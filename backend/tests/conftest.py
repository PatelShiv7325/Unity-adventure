import os
# Set BEFORE the app is imported: these tests use the in-memory database and the fake "demo" payment.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ALLOW_DEMO_PAYMENTS"] = "true"
os.environ["FLASK_ENV"] = "development"
os.environ["RAZORPAY_KEY_ID"] = ""
os.environ["RAZORPAY_KEY_SECRET"] = ""
os.environ["RAZORPAY_WEBHOOK_SECRET"] = ""
os.environ["SMTP_HOST"] = ""

from datetime import date, time, timedelta
import pytest
from app import create_app
from app.extensions import db
from app.models import Activity, Slot
from app.services.booking_service import today_local


@pytest.fixture()
def app():
    app = create_app()
    with app.app_context():
        db.create_all()
        a = Activity(title="Paramotor Ride", slug="paramotor-ride", price=4500, description="x")
        db.session.add(a)
        db.session.flush()
        # slot 1: tomorrow 08:00, 6 seats. slot 2: tomorrow 09:00, only 2 seats (for sell-out tests)
        db.session.add(Slot(activity_id=a.id, slot_date=today_local() + timedelta(days=1),
                            start_time=time(8, 0), capacity=6))
        db.session.add(Slot(activity_id=a.id, slot_date=today_local() + timedelta(days=1),
                            start_time=time(9, 0), capacity=2))
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def auth(app):
    c = app.test_client()
    r = c.post("/api/auth/register", json={"name": "Test", "email": "t@example.com", "password": "secret1"})
    return c, {"Authorization": "Bearer " + r.get_json()["token"]}
