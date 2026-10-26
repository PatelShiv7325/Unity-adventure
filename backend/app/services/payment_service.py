"""Payment helpers: Razorpay, UPI, and the single place that confirms a booking as paid."""
import base64
import hashlib
import hmac
import io
from datetime import datetime
from urllib.parse import quote
from flask import current_app


def razorpay_enabled():
    cfg = current_app.config
    return bool(cfg["RAZORPAY_KEY_ID"] and cfg["RAZORPAY_KEY_SECRET"])


def create_razorpay_order(amount_rupees, receipt):
    import razorpay  # imported here so demo mode works even if the package is missing
    cfg = current_app.config
    client = razorpay.Client(auth=(cfg["RAZORPAY_KEY_ID"], cfg["RAZORPAY_KEY_SECRET"]))
    return client.order.create({
        "amount": int(round(float(amount_rupees) * 100)),  # Razorpay uses paise
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1,
    })


def verify_razorpay_signature(order_id, payment_id, signature):
    """Razorpay signs 'order_id|payment_id' with your secret key (HMAC-SHA256)."""
    secret = current_app.config["RAZORPAY_KEY_SECRET"]
    expected = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    """Razorpay signs the raw webhook body with the webhook secret (HMAC-SHA256)."""
    secret = current_app.config.get("RAZORPAY_WEBHOOK_SECRET", "")
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# UPI helpers
# ---------------------------------------------------------------------------
def upi_uri(upi_id, payee, amount_rupees, note, ref):
    """Standard UPI deep link. Every UPI app understands it, and the amount is pre-filled."""
    return (f"upi://pay?pa={quote(upi_id, safe='@')}&pn={quote(payee)}"
            f"&am={float(amount_rupees):.2f}&cu=INR&tn={quote(note)}")


def upi_qr_data_uri(uri):
    import qrcode
    img = qrcode.make(uri, box_size=8, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------------------
# Confirming a payment
# ---------------------------------------------------------------------------
def mark_paid(db, booking, payment, provider_payment_id):
    """Single place that turns a booking into 'paid + confirmed' (Razorpay, webhook, demo and UPI approval).

    Returns True if the booking is now confirmed. Safe to call twice (the webhook and the browser
    both report the same payment): the second call does nothing.

    If the booking had already been cancelled/expired while the customer was paying, we try to
    take the seats back. If they are gone, the money is NOT thrown away and the booking is NOT
    confirmed - it goes to 'refund_pending' so you can refund it from Admin > Bookings.
    """
    from . import booking_service, notification_service
    if booking.payment_status == "paid":
        return True

    payment.status = "paid"
    payment.provider_payment_id = provider_payment_id
    payment.paid_at = datetime.utcnow()
    booking.payment_ref = provider_payment_id

    if booking.status == "cancelled":
        slot = booking.slot
        if (slot is not None and booking_service.slot_is_open(slot)
                and booking_service.reserve_seats(booking.slot_id, booking.participants or 1)):
            booking.status = "confirmed"          # seats were still free - customer keeps the booking
            booking.payment_status = "paid"
            db.session.commit()
            notification_service.send_booking_confirmation_async(booking)
            return True
        booking.payment_status = "refund_pending"  # money received, seats gone
        db.session.commit()
        return False

    booking.payment_status = "paid"
    booking.status = "confirmed"
    db.session.commit()
    notification_service.send_booking_confirmation_async(booking)
    return True
