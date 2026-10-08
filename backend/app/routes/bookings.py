import io
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Booking, Slot, User
from ..utils.validators import require_fields, clean_phone
from ..services import ticket_service, booking_service

bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

MAX_PEOPLE = 10


@bp.post("")
@jwt_required()
def create_booking():
    data = request.get_json() or {}
    missing = require_fields(data, ["slot_id", "customer_name", "customer_phone"])
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}"), 400
    try:
        people = int(data.get("participants", 1))
    except (TypeError, ValueError):
        return jsonify(error="participants must be a number"), 400
    if not 1 <= people <= MAX_PEOPLE:
        return jsonify(error=f"participants must be between 1 and {MAX_PEOPLE}"), 400
    phone = clean_phone(data["customer_phone"])
    if not phone:
        return jsonify(error="Enter a valid phone number (10 digits)"), 400

    booking_service.expire_stale_holds()
    user = db.session.get(User, int(get_jwt_identity()))
    slot = Slot.query.get_or_404(data["slot_id"])
    if not slot.activity.is_active:
        return jsonify(error="This activity is not available right now"), 400
    if slot.capacity - slot.booked < people:
        return jsonify(error="Not enough seats left in this slot"), 409

    coupon, problem = booking_service.find_coupon(data.get("coupon_code"))
    if problem:
        return jsonify(error=problem), 400
    subtotal = slot.activity.price * people
    discount, total = booking_service.apply_coupon(subtotal, coupon)

    booking = Booking(user_id=user.id, activity_id=slot.activity_id, slot_id=slot.id,
                      customer_name=data["customer_name"].strip(),
                      customer_phone=phone,
                      customer_email=(data.get("customer_email") or user.email),
                      participants=people, amount=total, discount=discount,
                      coupon_id=coupon.id if coupon else None)
    slot.booked += people  # seats are held while the customer pays
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking.to_dict()), 201


@bp.post("/validate-coupon")
@jwt_required()
def validate_coupon():
    d = request.get_json() or {}
    coupon, problem = booking_service.find_coupon(d.get("code"))
    if problem or not coupon:
        return jsonify(valid=False, error=problem or "Enter a coupon code"), 400
    try:
        subtotal = float(d.get("amount", 0))
    except (TypeError, ValueError):
        subtotal = 0
    discount, total = booking_service.apply_coupon(subtotal, coupon)
    return jsonify(valid=True, code=coupon.code, percent_off=coupon.percent_off,
                   discount=discount, total=total)


@bp.get("/mine")
@jwt_required()
def my_bookings():
    booking_service.expire_stale_holds()
    items = Booking.query.filter_by(user_id=int(get_jwt_identity())).order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in items])


@bp.get("/<int:booking_id>")
@jwt_required()
def get_booking(booking_id):
    b = Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()
    return jsonify(b.to_dict())


@bp.get("/<int:booking_id>/ticket")
@jwt_required()
def get_ticket(booking_id):
    """Full ticket image (details + QR). Only after payment is confirmed."""
    b = Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()
    if b.payment_status != "paid" or b.status == "cancelled":
        return jsonify(error="Ticket is available after payment is confirmed"), 400
    png = ticket_service.generate_ticket_image(b)
    return send_file(io.BytesIO(png), mimetype="image/png", download_name=f"ticket-{b.ticket_code}.png")


@bp.post("/<int:booking_id>/cancel")
@jwt_required()
def cancel(booking_id):
    b = Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()
    if b.status == "cancelled":
        return jsonify(error="Already cancelled"), 400
    if b.status == "completed":
        return jsonify(error="A completed ride cannot be cancelled"), 400
    b.release_seats()
    b.status = "cancelled"
    if b.payment_status in ("paid", "verifying"):
        b.payment_status = "refund_pending"  # admin refunds it from the bookings screen
    db.session.commit()
    return jsonify(b.to_dict())