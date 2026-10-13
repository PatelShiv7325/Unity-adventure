import json
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Booking, Payment
from ..services import payment_service as ps, booking_service, notification_service
from ..utils.validators import valid_utr

bp = Blueprint("payments", __name__, url_prefix="/api/payments")

SUPPORT_PHONE = "+91 90814 24343"


def _own_booking(booking_id):
    return Booking.query.filter_by(id=booking_id, user_id=int(get_jwt_identity())).first_or_404()


def _mark_paid(booking, payment, provider_payment_id):
    return ps.mark_paid(db, booking, payment, provider_payment_id)


def _check_payable(booking):
    if booking.status == "cancelled":
        return "This booking was cancelled or expired. Please book again."
    if booking.payment_status == "paid":
        return "This booking is already paid"
    if booking.payment_status == "verifying":
        return "Your UPI payment is already being verified"
    if booking.slot and booking_service.slot_start(booking.slot) <= booking_service.now_local():
        return "This time slot has already started. Please book another slot."
    return None


@bp.get("/config")
def public_config():
    """What the pay page needs to know: which methods exist (no secrets)."""
    cfg = current_app.config
    email_tickets = notification_service.email_enabled()
    return jsonify(razorpay=ps.razorpay_enabled(), upi=bool(cfg.get("UPI_ID")),
                   demo=bool(cfg["ALLOW_DEMO_PAYMENTS"]) and not ps.razorpay_enabled(),
                   upi_id=cfg.get("UPI_ID"), payee=cfg.get("UPI_PAYEE_NAME"),
                   hold_minutes=cfg.get("HOLD_MINUTES", 30), email_tickets=email_tickets)


@bp.post("/create-order")
@jwt_required()
def create_order():
    d = request.get_json() or {}
    booking = _own_booking(d.get("booking_id"))
    problem = _check_payable(booking)
    if problem:
        return jsonify(error=problem), 400

    payment_method = d.get("payment_method", "card")
    # the customer is now paying: keep their seats while they do it
    booking_service.extend_hold(booking)

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
    confirmed = _mark_paid(booking, payment, d["razorpay_payment_id"])
    if not confirmed:
        # money was taken but the seats were released and are gone: never pretend it worked
        return jsonify(error=f"Your payment was received, but the seats were released before it completed "
                             f"and are no longer available. We will refund you in full. "
                             f"For help call {SUPPORT_PHONE} with booking number {booking.id}."), 409
    return jsonify(booking.to_dict())


@bp.post("/webhook")
def razorpay_webhook():
    """Razorpay calls this by itself when a payment succeeds.

    It is the safety net for the customer who pays and then closes the browser (or loses signal)
    before the page can call /verify: without it the money is taken but the booking stays unpaid
    and later expires. Set the same secret in Razorpay Dashboard > Webhooks and in
    RAZORPAY_WEBHOOK_SECRET, and enable the events payment.captured and order.paid."""
    raw = request.get_data()
    if not ps.verify_webhook_signature(raw, request.headers.get("X-Razorpay-Signature", "")):
        return jsonify(error="Invalid signature"), 400
    try:
        event = json.loads(raw)
        if event.get("event") not in ("payment.captured", "order.paid"):
            return jsonify(ok=True, ignored=True)
        entity = event["payload"]["payment"]["entity"]
        order_id, payment_id, amount = entity.get("order_id"), entity.get("id"), entity.get("amount")
    except (ValueError, KeyError, TypeError):
        return jsonify(ok=True, ignored=True)  # 200 so Razorpay does not keep retrying a malformed event

    payment = Payment.query.filter_by(provider="razorpay", provider_order_id=order_id).first()
    if not payment:
        return jsonify(ok=True, ignored=True)
    if amount is not None and int(amount) != int(round(float(payment.amount) * 100)):
        current_app.logger.error("Webhook amount mismatch for order %s: got %s", order_id, amount)
        return jsonify(ok=True, ignored=True)
    if payment.status != "paid":
        _mark_paid(payment.booking, payment, payment_id)
    return jsonify(ok=True)


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
        return jsonify(error=f"This booking was cancelled or expired. If money was deducted from your account, "
                             f"call {SUPPORT_PHONE} with your UPI reference and we will sort it out."), 400
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
