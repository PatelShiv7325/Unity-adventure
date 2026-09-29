import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from datetime import date, time, timedelta
import pytest
from app import create_app
from app.extensions import db
from app.models import Activity, Slot


@pytest.fixture()
def app():
    app = create_app()
    with app.app_context():
        db.create_all()
        a = Activity(title="Paramotor Ride", slug="paramotor-ride", price=4500, description="x")
        db.session.add(a)
        db.session.flush()
        db.session.add(Slot(activity_id=a.id, slot_date=date.today() + timedelta(days=1),
                            start_time=time(8, 0), capacity=6))
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def auth(app):
    c = app.test_client()
    r = c.post("/api/auth/register", json={"name": "Test", "email": "t@example.com", "password": "secret1"})
    return c, {"Authorization": "Bearer " + r.get_json()["token"]}
