import io
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Booking, Slot, User
from ..utils.validators import require_fields
from ..services import ticket_service

bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")


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
    if people < 1:
        return jsonify(error="participants must be at least 1"), 400

    user = User.query.get(int(get_jwt_identity()))
    slot = Slot.query.get_or_404(data["slot_id"])
    if slot.capacity - slot.booked < people:
        return jsonify(error="Not enough seats left in this slot"), 409

    amount = slot.activity.price * people  # TODO: apply coupon
    booking = Booking(user_id=user.id, activity_id=slot.activity_id, slot_id=slot.id,
                      customer_name=data["customer_name"].strip(),
                      customer_phone=data["customer_phone"].strip(),
                      customer_email=(data.get("customer_email") or user.email),
                      participants=people, amount=amount)
    slot.booked += people  # seats are held while the customer pays
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking.to_dict()), 201


@bp.get("/mine")
@jwt_required()
def my_bookings():
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
    b = Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()
    if b.payment_status != "paid":
        return jsonify(error="Ticket is available after payment"), 400
    qr_bytes = ticket_service.generate_ticket_qr(b.ticket_code)
    return send_file(io.BytesIO(qr_bytes), mimetype="image/png",
                      download_name=f"ticket-{b.ticket_code}.png")

@bp.post("/<int:booking_id>/cancel")
@jwt_required()
def cancel(booking_id):
    b = Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()
    if b.status == "cancelled":
        return jsonify(error="Already cancelled"), 400
    b.status = "cancelled"
    b.slot.booked = max(0, b.slot.booked - b.participants)
    if b.payment_status == "paid":
        b.payment_status = "refund_pending"  # admin refunds it from the payment dashboard
    db.session.commit()
    return jsonify(b.to_dict())
