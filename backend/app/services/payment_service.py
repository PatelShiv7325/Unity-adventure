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
