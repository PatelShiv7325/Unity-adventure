import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

_db_url = os.getenv("DATABASE_URL", "sqlite:///adventure.db")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)


def _flag(name, default="false"):
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


_IS_PRODUCTION = os.getenv("FLASK_ENV", "").strip().lower() == "production"

# In production the app must never start with the built-in development secrets:
# anyone who has read the source code could forge a login token (including admin).
if _IS_PRODUCTION:
    for _name in ("SECRET_KEY", "JWT_SECRET_KEY"):
        if not os.getenv(_name) or os.getenv(_name, "").startswith(("dev-", "change-me")):
            raise RuntimeError(f"{_name} must be set to a long random value when FLASK_ENV=production")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # keeps Postgres connections healthy on Render/Neon (they close idle connections)
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    CORS_ORIGINS = [o.strip() for o in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175").split(",") if o.strip()]
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
    # Razorpay Dashboard > Settings > Webhooks. Lets a payment confirm the booking even if the
    # customer closes the browser right after paying.
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
    WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
    UPI_ID = os.getenv("UPI_ID", "7984438055@ybl")
    UPI_PAYEE_NAME = os.getenv("UPI_PAYEE_NAME", "Unity Adventure Sports")
    # false (default): customer submits the UTR and you approve it in Admin > Bookings.
    # true: confirm instantly with no check. Only for local testing - ignored when FLASK_ENV=production.
    UPI_AUTO_CONFIRM = _flag("UPI_AUTO_CONFIRM")
    IS_PRODUCTION = _IS_PRODUCTION
    # unpaid bookings release their seats after this many minutes
    HOLD_MINUTES = int(os.getenv("HOLD_MINUTES", "30"))
    # a customer who has started paying keeps the seats a little longer, but never beyond this
    HOLD_MAX_MINUTES = int(os.getenv("HOLD_MAX_MINUTES", "180"))
    # no bookings for a slot that starts in less than this many minutes
    BOOKING_CUTOFF_MINUTES = int(os.getenv("BOOKING_CUTOFF_MINUTES", "60"))
    # Demo payments let you test the flow WITHOUT paying (anyone can get a free ticket).
    # Off by default and always off in production.
    ALLOW_DEMO_PAYMENTS = _flag("ALLOW_DEMO_PAYMENTS") and not _IS_PRODUCTION
    # SMTP for booking confirmation emails. Leave blank to skip sending email.
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASS = os.getenv("SMTP_PASS", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "")
