import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Booking, Payment
from ..services import payment_service as ps
from ..utils.validators import valid_utr

bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def _own_booking(booking_id):
    return Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()


def _mark_paid(booking, payment, provider_payment_id):
    ps.mark_paid(db, booking, payment, provider_payment_id)


def _check_payable(booking):
    if booking.status == "cancelled":
        return "This booking was cancelled or expired. Please book again."
    if booking.payment_status == "paid":
        return "This booking is already paid"
    if booking.payment_status == "verifying":
        return "Your UPI payment is already being verified"
    return None


@bp.get("/config")
def public_config():
    """What the pay page needs to know: which methods exist (no secrets)."""
    cfg = current_app.config
    return jsonify(razorpay=ps.razorpay_enabled(), upi=bool(cfg.get("UPI_ID")),
                   demo=bool(cfg["ALLOW_DEMO_PAYMENTS"]) and not ps.razorpay_enabled(),
                   upi_id=cfg.get("UPI_ID"), payee=cfg.get("UPI_PAYEE_NAME"),
                   hold_minutes=cfg.get("HOLD_MINUTES", 30))


@bp.post("/create-order")
@jwt_required()
def create_order():
    d = request.get_json() or {}
    booking = _own_booking(d.get("booking_id"))
    problem = _check_payable(booking)
    if problem:
        return jsonify(error=problem), 400

    payment_method = d.get("payment_method", "card")

    if payment_method == "upi":
        cfg = current_app.config
        upi_id = cfg.get("UPI_ID")
        if not upi_id:
            return jsonify(error="UPI is not configured"), 503
        ref = f"UAS{booking.id}{uuid.uuid4().hex[:6].upper()}"
        order_id = f"upi_{uuid.uuid4().hex[:12]}"
        db.session.add(Payment(booking_id=booking.id, provider="upi",
                               provider_order_id=order_id, amount=booking.amount,
                               transaction_id=ref))
        db.session.commit()
        uri = ps.upi_uri(upi_id, cfg["UPI_PAYEE_NAME"], booking.amount,
                         f"Booking {booking.id} {booking.ticket_code}", ref)
        return jsonify(mode="upi", order_id=order_id, amount=int(booking.amount * 100),
                       amount_rupees=float(booking.amount), currency="INR",
                       booking_id=booking.id, upi_id=upi_id, payee=cfg["UPI_PAYEE_NAME"],
                       transaction_id=ref, upi_uri=uri, qr_data_uri=ps.upi_qr_data_uri(uri),
                       static_qr="/images/Upi Scanner.jpg")

    if ps.razorpay_enabled():
        order = ps.create_razorpay_order(booking.amount, f"booking_{booking.id}")
        db.session.add(Payment(booking_id=booking.id, provider="razorpay",
                               provider_order_id=order["id"], amount=booking.amount))
        db.session.commit()
        return jsonify(mode="razorpay", key_id=current_app.config["RAZORPAY_KEY_ID"],
                       order_id=order["id"], amount=order["amount"], currency=order["currency"],
                       booking_id=booking.id)

    if not current_app.config["ALLOW_DEMO_PAYMENTS"]:
        return jsonify(error="Card payments are not configured. Please pay with UPI."), 503
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


@bp.post("/upi-submit")
@bp.post("/upi-verify")  # old path kept so a cached old frontend does not get a 404
@jwt_required()
def upi_submit():
    """Customer says 'I paid' and gives the 12-digit UPI reference (UTR).
    The booking goes to 'verifying'; you approve it in Admin > Bookings."""
    d = request.get_json() or {}
    booking = _own_booking(d.get("booking_id"))
    if booking.status == "cancelled":
        return jsonify(error="This booking was cancelled or expired. Please book again."), 400
    if booking.payment_status == "paid":
        return jsonify(error="This booking is already paid"), 400

    utr = str(d.get("utr") or "").strip()
    if not valid_utr(utr):
        return jsonify(error="Enter the 12-digit UPI reference number (UTR) from your payment app"), 400
    payment = Payment.query.filter_by(booking_id=booking.id, provider="upi",
                                      provider_order_id=d.get("order_id")).first()
    if not payment:
        return jsonify(error="Unknown UPI order. Start the payment again."), 404
    clash = Payment.query.filter(Payment.utr == utr, Payment.id != payment.id,
                                 Payment.status.in_(("verifying", "paid"))).first()
    if clash:
        return jsonify(error="This UPI reference was already used for another booking"), 409

    payment.utr = utr
    if current_app.config["UPI_AUTO_CONFIRM"] and not current_app.config["IS_PRODUCTION"]:
        _mark_paid(booking, payment, utr)  # local testing only
    else:
        payment.status = "verifying"
        booking.payment_status = "verifying"
        booking.payment_ref = utr
        db.session.commit()
    return jsonify(booking.to_dict())