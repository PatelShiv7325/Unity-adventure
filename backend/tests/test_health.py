import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
from app import create_app


def test_health():
    client = create_app().test_client()
    assert client.get("/api/health").get_json() == {"status": "ok"}
