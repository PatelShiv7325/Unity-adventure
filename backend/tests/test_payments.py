import hashlib
import hmac
from app.extensions import db
from app.models import Booking, Payment, Slot
from app.services import payment_service


def _book(c, h, people=2):
    r = c.post("/api/bookings", headers=h, json={
        "slot_id": 1, "participants": people, "customer_name": "Ravi", "customer_phone": "9999999999"})
    assert r.status_code == 201, r.get_json()
    return r.get_json()


def test_booking_needs_customer_details(auth):
    c, h = auth
    r = c.post("/api/bookings", headers=h, json={"slot_id": 1})
    assert r.status_code == 400


def test_booking_starts_pending_and_stores_customer(auth, app):
    c, h = auth
    b = _book(c, h)
    assert b["status"] == "pending" and b["payment_status"] == "pending"
    assert b["amount"] == 9000.0
    with app.app_context():
        row = db.session.get(Booking, b["id"])
        assert row.customer_name == "Ravi" and row.customer_phone == "9999999999"


def test_demo_payment_flow(auth, app):
    c, h = auth
    b = _book(c, h)
    o = c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]}).get_json()
    assert o["mode"] == "demo"
    done = c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]}).get_json()
    assert done["payment_status"] == "paid" and done["status"] == "confirmed"
    with app.app_context():
        p = Payment.query.one()
        assert p.status == "paid" and p.provider == "demo"
    again = c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    assert again.status_code == 400  # already paid


def test_razorpay_flow_and_bad_signature(auth, app, monkeypatch):
    c, h = auth
    app.config["RAZORPAY_KEY_ID"] = "rzp_test_x"
    app.config["RAZORPAY_KEY_SECRET"] = "secret"
    monkeypatch.setattr(payment_service, "create_razorpay_order",
                        lambda amount, receipt: {"id": "order_ABC", "amount": int(amount * 100), "currency": "INR"})
    b = _book(c, h)
    o = c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]}).get_json()
    assert o["mode"] == "razorpay" and o["order_id"] == "order_ABC" and o["amount"] == 900000
    # demo endpoint must be closed once real keys exist
    assert c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]}).status_code == 403
    bad = c.post("/api/payments/verify", headers=h, json={
        "booking_id": b["id"], "razorpay_order_id": "order_ABC",
        "razorpay_payment_id": "pay_1", "razorpay_signature": "nope"})
    assert bad.status_code == 400
    sig = hmac.new(b"secret", b"order_ABC|pay_1", hashlib.sha256).hexdigest()
    ok = c.post("/api/payments/verify", headers=h, json={
        "booking_id": b["id"], "razorpay_order_id": "order_ABC",
        "razorpay_payment_id": "pay_1", "razorpay_signature": sig})
    assert ok.status_code == 200 and ok.get_json()["payment_status"] == "paid"


def test_cancel_paid_booking_marks_refund_and_frees_seats(auth, app):
    c, h = auth
    b = _book(c, h, people=2)
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]})
    r = c.post(f"/api/bookings/{b['id']}/cancel", headers=h).get_json()
    assert r["status"] == "cancelled" and r["payment_status"] == "refund_pending"
    with app.app_context():
        assert db.session.get(Slot, 1).booked == 0


def test_cannot_pay_someone_elses_booking(auth, app):
    c, h = auth
    b = _book(c, h)
    r2 = c.post("/api/auth/register", json={"name": "Other", "email": "o@example.com", "password": "secret1"})
    h2 = {"Authorization": "Bearer " + r2.get_json()["token"]}
    assert c.post("/api/payments/create-order", headers=h2, json={"booking_id": b["id"]}).status_code == 404
