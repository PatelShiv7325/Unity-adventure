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


# ---------------------------------------------------------------------------
# Regression tests for the payment / ticket audit
# ---------------------------------------------------------------------------
from datetime import datetime, timedelta, time as dtime
from app.services import booking_service
import json


def _rzp(app, monkeypatch):
    app.config["RAZORPAY_KEY_ID"] = "rzp_test_x"
    app.config["RAZORPAY_KEY_SECRET"] = "secret"
    monkeypatch.setattr(payment_service, "create_razorpay_order",
                        lambda amount, receipt: {"id": "order_ABC", "amount": int(float(amount) * 100), "currency": "INR"})


def _book_slot(c, h, slot_id, people=1):
    return c.post("/api/bookings", headers=h, json={
        "slot_id": slot_id, "participants": people, "customer_name": "Ravi", "customer_phone": "9999999999"})


def test_demo_payment_is_off_unless_explicitly_enabled(app):
    c = app.test_client()
    app.config["ALLOW_DEMO_PAYMENTS"] = False
    assert c.get("/api/payments/config").get_json()["demo"] is False


def test_demo_confirm_refused_when_demo_disabled(auth, app):
    c, h = auth
    b = _book(c, h)
    app.config["ALLOW_DEMO_PAYMENTS"] = False
    assert c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]}).status_code == 503
    assert c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]}).status_code == 403


def test_cannot_book_a_slot_that_already_started(auth, app):
    c, h = auth
    with app.app_context():
        past = booking_service.now_local() - timedelta(hours=3)
        s = Slot(activity_id=1, slot_date=past.date(), start_time=past.time().replace(second=0, microsecond=0), capacity=10)
        db.session.add(s)
        db.session.commit()
        sid = s.id
    r = _book_slot(c, h, sid)
    assert r.status_code == 400 and "closed" in r.get_json()["error"]


def test_slot_list_hides_slots_that_can_no_longer_be_booked(auth, app):
    c, h = auth
    r = c.get("/api/activities/paramotor-ride/slots")
    assert r.status_code == 200
    now = booking_service.now_local()
    for s in r.get_json():
        start = datetime.fromisoformat(f"{s['date']}T{s['time']}")
        assert start >= now


def test_last_seats_cannot_be_sold_twice(auth, app):
    c, h = auth
    assert _book_slot(c, h, 2, 2).status_code == 201          # takes both seats
    r = _book_slot(c, h, 2, 1)
    assert r.status_code == 409
    with app.app_context():
        assert db.session.get(Slot, 2).booked == 2            # never above capacity


def test_late_razorpay_payment_never_overbooks(auth, app, monkeypatch):
    """Customer pays at the gateway after their hold ran out and the seats were resold."""
    c, h = auth
    _rzp(app, monkeypatch)
    b = _book_slot(c, h, 2, 2).get_json()                      # both seats of slot 2
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    c.post(f"/api/bookings/{b['id']}/cancel", headers=h)       # hold released
    assert _book_slot(c, h, 2, 2).status_code == 201           # someone else buys them
    sig = hmac.new(b"secret", b"order_ABC|pay_1", hashlib.sha256).hexdigest()
    r = c.post("/api/payments/verify", headers=h, json={
        "booking_id": b["id"], "razorpay_order_id": "order_ABC", "razorpay_payment_id": "pay_1", "razorpay_signature": sig})
    assert r.status_code == 409                                # told the truth, not "success"
    with app.app_context():
        bk = db.session.get(Booking, b["id"])
        assert bk.status == "cancelled" and bk.payment_status == "refund_pending"   # admin can refund it
        assert db.session.get(Slot, 2).booked == 2             # still not oversold


def test_late_payment_reclaims_seats_when_still_free(auth, app, monkeypatch):
    c, h = auth
    _rzp(app, monkeypatch)
    b = _book_slot(c, h, 2, 1).get_json()
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    c.post(f"/api/bookings/{b['id']}/cancel", headers=h)
    sig = hmac.new(b"secret", b"order_ABC|pay_1", hashlib.sha256).hexdigest()
    r = c.post("/api/payments/verify", headers=h, json={
        "booking_id": b["id"], "razorpay_order_id": "order_ABC", "razorpay_payment_id": "pay_1", "razorpay_signature": sig})
    assert r.status_code == 200 and r.get_json()["status"] == "confirmed"
    with app.app_context():
        assert db.session.get(Slot, 2).booked == 1


def test_paying_keeps_the_hold_alive_for_upi(auth, app):
    """Paid by UPI after the original 30 minutes: must still be accepted."""
    c, h = auth
    b = _book(c, h)
    o = c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"], "payment_method": "upi"}).get_json()
    with app.app_context():
        bk = db.session.get(Booking, b["id"])
        bk.created_at = datetime.utcnow() - timedelta(minutes=31)   # booking itself is 31 min old
        db.session.commit()
    c.get("/api/bookings/mine", headers=h)                          # runs the expiry sweep
    r = c.post("/api/payments/upi-submit", headers=h,
               json={"booking_id": b["id"], "order_id": o["order_id"], "utr": "412345678901"})
    assert r.status_code == 200 and r.get_json()["payment_status"] == "verifying"


def test_unpaid_booking_still_expires(auth, app):
    c, h = auth
    b = _book(c, h)
    with app.app_context():
        bk = db.session.get(Booking, b["id"])
        bk.hold_until = datetime.utcnow() - timedelta(minutes=1)
        db.session.commit()
    mine = c.get("/api/bookings/mine", headers=h).get_json()
    assert mine[0]["status"] == "cancelled"
    with app.app_context():
        assert db.session.get(Slot, 1).booked == 0


def test_booking_reports_hold_expiry_for_the_timer(auth):
    c, h = auth
    b = _book(c, h)
    assert b["hold_expires_at"].endswith("Z")


def test_webhook_confirms_booking_when_browser_never_called_verify(auth, app, monkeypatch):
    c, h = auth
    _rzp(app, monkeypatch)
    app.config["RAZORPAY_WEBHOOK_SECRET"] = "whsec"
    b = _book(c, h)
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    body = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": "pay_WH1", "order_id": "order_ABC", "amount": int(b["amount"] * 100)}}}}).encode()
    bad = c.post("/api/payments/webhook", data=body, headers={"X-Razorpay-Signature": "nope"})
    assert bad.status_code == 400
    sig = hmac.new(b"whsec", body, hashlib.sha256).hexdigest()
    ok = c.post("/api/payments/webhook", data=body, headers={"X-Razorpay-Signature": sig})
    assert ok.status_code == 200
    again = c.post("/api/payments/webhook", data=body, headers={"X-Razorpay-Signature": sig})   # Razorpay retries
    assert again.status_code == 200
    got = c.get(f"/api/bookings/{b['id']}", headers=h).get_json()
    assert got["payment_status"] == "paid" and got["status"] == "confirmed"
    with app.app_context():
        assert Payment.query.filter_by(status="paid").count() == 1


def test_webhook_with_wrong_amount_is_ignored(auth, app, monkeypatch):
    c, h = auth
    _rzp(app, monkeypatch)
    app.config["RAZORPAY_WEBHOOK_SECRET"] = "whsec"
    b = _book(c, h)
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    body = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": "pay_X", "order_id": "order_ABC", "amount": 100}}}}).encode()
    sig = hmac.new(b"whsec", body, hashlib.sha256).hexdigest()
    assert c.post("/api/payments/webhook", data=body, headers={"X-Razorpay-Signature": sig}).status_code == 200
    assert c.get(f"/api/bookings/{b['id']}", headers=h).get_json()["payment_status"] == "pending"


def test_webhook_without_configured_secret_is_rejected(auth, app):
    c, h = auth
    assert c.post("/api/payments/webhook", data=b"{}", headers={"X-Razorpay-Signature": "x"}).status_code == 400


def test_ticket_only_after_payment_then_valid_png(auth, app):
    c, h = auth
    b = _book(c, h)
    assert c.get(f"/api/bookings/{b['id']}/ticket", headers=h).status_code == 400
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]})
    r = c.get(f"/api/bookings/{b['id']}/ticket", headers=h)
    assert r.status_code == 200 and r.mimetype == "image/png" and r.data[:8] == b"\x89PNG\r\n\x1a\n"
    assert r.headers["Cache-Control"] == "no-store"


def test_ticket_handles_very_long_names(auth, app):
    c, h = auth
    r = c.post("/api/bookings", headers=h, json={"slot_id": 1, "participants": 1, "customer_phone": "9999999999",
                                                  "customer_name": "Venkata Subramanian Raghunathan Iyer"})
    b = r.get_json()
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]})
    assert c.get(f"/api/bookings/{b['id']}/ticket", headers=h).status_code == 200


def test_cannot_cancel_a_paid_ride_after_it_started(auth, app):
    c, h = auth
    b = _book(c, h)
    c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"]})
    c.post("/api/payments/demo-confirm", headers=h, json={"booking_id": b["id"]})
    with app.app_context():
        s = db.session.get(Slot, 1)
        past = booking_service.now_local() - timedelta(hours=1)
        s.slot_date, s.start_time = past.date(), past.time().replace(second=0, microsecond=0)
        db.session.commit()
    assert c.post(f"/api/bookings/{b['id']}/cancel", headers=h).status_code == 400


def test_admin_reject_gives_customer_a_fresh_window(auth, app):
    c, h = auth
    b = _book(c, h)
    o = c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"], "payment_method": "upi"}).get_json()
    c.post("/api/payments/upi-submit", headers=h, json={"booking_id": b["id"], "order_id": o["order_id"], "utr": "412345678901"})
    from app.models import User
    with app.app_context():
        u = User(name="Admin", email="a@example.com", role="admin"); u.set_password("secret1")
        db.session.add(u)
        bk = db.session.get(Booking, b["id"]); bk.created_at = datetime.utcnow() - timedelta(hours=2)
        bk.hold_until = datetime.utcnow() - timedelta(hours=1)
        db.session.commit()
    tok = c.post("/api/auth/login", json={"email": "a@example.com", "password": "secret1"}).get_json()["token"]
    ah = {"Authorization": "Bearer " + tok}
    assert c.patch(f"/api/admin/bookings/{b['id']}/reject-payment", headers=ah).status_code == 200
    c.get("/api/bookings/mine", headers=h)    # sweep
    got = c.get(f"/api/bookings/{b['id']}", headers=h).get_json()
    assert got["status"] == "pending" and got["payment_status"] == "failed"   # can pay again
    # ...and the full approve path unlocks the ticket
    o2 = c.post("/api/payments/create-order", headers=h, json={"booking_id": b["id"], "payment_method": "upi"}).get_json()
    c.post("/api/payments/upi-submit", headers=h, json={"booking_id": b["id"], "order_id": o2["order_id"], "utr": "512345678901"})
    assert c.patch(f"/api/admin/bookings/{b['id']}/approve-payment", headers=ah).status_code == 200
    assert c.get(f"/api/bookings/{b['id']}/ticket", headers=h).status_code == 200
