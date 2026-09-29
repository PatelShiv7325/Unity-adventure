import uuid
import qrcode
from io import BytesIO
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Booking, Payment
from ..services import payment_service as ps
from ..services import notification_service

bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def _own_booking(booking_id):
    return Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()


def _mark_paid(booking, payment, provider_payment_id):
    payment.status = "paid"
    payment.provider_payment_id = provider_payment_id
    payment.paid_at = datetime.utcnow()
    booking.payment_status = "paid"
    booking.payment_ref = provider_payment_id
    booking.status = "confirmed"
    db.session.commit()
    
    notification_service.send_booking_confirmation(booking)


def _check_payable(booking):
    if booking.status == "cancelled":
        return "This booking was cancelled"
    if booking.payment_status == "paid":
        return "This booking is already paid"
    return None


@bp.post("/create-order")
@jwt_required()
def create_order():
    booking = _own_booking((request.get_json() or {}).get("booking_id"))
    problem = _check_payable(booking)
    if problem:
        return jsonify(error=problem), 400

    payment_method = (request.get_json() or {}).get("payment_method", "card")
    
    if payment_method == "upi":
        # Use static UPI QR code image
        upi_id = current_app.config.get("UPI_ID", "7984438055@ybl")
        upi_amount = int(booking.amount * 100)  # Amount in paise
        upi_transaction_id = f"BOOK{booking.id}_{uuid.uuid4().hex[:8]}"
        
        order_id = f"upi_{uuid.uuid4().hex[:12]}"
        db.session.add(Payment(booking_id=booking.id, provider="upi",
                               provider_order_id=order_id, amount=booking.amount,
                               transaction_id=upi_transaction_id))
        db.session.commit()
        
        return jsonify(mode="upi", order_id=order_id, amount=upi_amount, currency="INR",
                       booking_id=booking.id, qr_image="/images/Upi Scanner.jpg",
                       upi_id=upi_id, transaction_id=upi_transaction_id)

    if ps.razorpay_enabled():
        order = ps.create_razorpay_order(booking.amount, f"booking_{booking.id}")
        db.session.add(Payment(booking_id=booking.id, provider="razorpay",
                               provider_order_id=order["id"], amount=booking.amount))
        db.session.commit()
        return jsonify(mode="razorpay", key_id=current_app.config["RAZORPAY_KEY_ID"],
                       order_id=order["id"], amount=order["amount"], currency=order["currency"],
                       booking_id=booking.id)

    if not current_app.config["ALLOW_DEMO_PAYMENTS"]:
        return jsonify(error="Payments are not configured"), 503
    order_id = f"demo_{uuid.uuid4().hex[:12]}"
    db.session.add(Payment(booking_id=booking.id, provider="demo",
                           provider_order_id=order_id, amount=booking.amount))
    db.session.commit()
    return jsonify(mode="demo", order_id=order_id, amount=int(booking.amount * 100),
                   currency="INR", booking_id=booking.id)


@bp.post("/verify")
@jwt_required()
def verify():
    """Called by the browser after Razorpay checkout succeeds."""
    d = request.get_json() or {}
    booking = _own_booking(d.get("booking_id"))
    payment = Payment.query.filter_by(booking_id=booking.id, provider="razorpay",
                                      provider_order_id=d.get("razorpay_order_id")).first()
    if not payment:
        return jsonify(error="Unknown payment order"), 404
    if not ps.razorpay_enabled() or not ps.verify_razorpay_signature(
            d.get("razorpay_order_id"), d.get("razorpay_payment_id"), d.get("razorpay_signature")):
        payment.status = "failed"
        db.session.commit()
        return jsonify(error="Payment verification failed"), 400
    _mark_paid(booking, payment, d["razorpay_payment_id"])
    return jsonify(booking.to_dict())


@bp.post("/demo-confirm")
@jwt_required()
def demo_confirm():
    """Pretend payment for local testing. Refused as soon as real Razorpay keys are set."""
    if ps.razorpay_enabled() or not current_app.config["ALLOW_DEMO_PAYMENTS"]:
        return jsonify(error="Demo payments are disabled"), 403
    booking = _own_booking((request.get_json() or {}).get("booking_id"))
    problem = _check_payable(booking)
    if problem:
        return jsonify(error=problem), 400
    payment = (Payment.query.filter_by(booking_id=booking.id, provider="demo", status="created")
               .order_by(Payment.id.desc()).first())
    if not payment:
        return jsonify(error="Start the payment first"), 404
    _mark_paid(booking, payment, f"demo_pay_{uuid.uuid4().hex[:10]}")
    return jsonify(booking.to_dict())


@bp.post("/upi-verify")
@jwt_required()
def upi_verify():
    """Verify UPI payment - for now, this will accept the payment based on booking ID."""
    d = request.get_json() or {}
    booking = _own_booking(d.get("booking_id"))
    payment = Payment.query.filter_by(booking_id=booking.id, provider="upi",
                                      provider_order_id=d.get("order_id")).first()
    if not payment:
        return jsonify(error="Unknown UPI order"), 404
    
    # In production, you would verify the payment with the UPI provider
    # For now, we'll mark it as paid based on the order
    _mark_paid(booking, payment, d.get("transaction_id", f"upi_{uuid.uuid4().hex[:10]}"))
    return jsonify(booking.to_dict())
