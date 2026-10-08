"""Razorpay helpers. Demo mode is used automatically when no Razorpay keys are set."""
import hashlib
import hmac
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

# ---------------------------------------------------------------------------
# UPI helpers
# ---------------------------------------------------------------------------
import base64
import io
from datetime import datetime
from urllib.parse import quote


def upi_uri(upi_id, payee, amount_rupees, note, ref):
    """Standard UPI deep link. Every UPI app understands it, and the amount is pre-filled."""
    return (f"upi://pay?pa={quote(upi_id, safe='@')}&pn={quote(payee)}"
            f"&am={float(amount_rupees):.2f}&cu=INR&tn={quote(note)}&tr={quote(ref)}")


def upi_qr_data_uri(uri):
    import qrcode
    img = qrcode.make(uri, box_size=8, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def mark_paid(db, booking, payment, provider_payment_id):
    """Single place that turns a booking into 'paid + confirmed' (Razorpay, demo and UPI approval)."""
    from . import notification_service
    payment.status = "paid"
    payment.provider_payment_id = provider_payment_id
    payment.paid_at = datetime.utcnow()
    booking.payment_status = "paid"
    booking.payment_ref = provider_payment_id
    booking.status = "confirmed"
    db.session.commit()
    notification_service.send_booking_confirmation(booking)