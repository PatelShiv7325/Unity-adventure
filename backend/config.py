import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

_db_url = os.getenv("DATABASE_URL", "sqlite:///adventure.db")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
    WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
    UPI_ID = os.getenv("UPI_ID", "7984438055@ybl")
    # Demo payments let you test the flow without Razorpay keys. Set to false in production.
    ALLOW_DEMO_PAYMENTS = os.getenv("ALLOW_DEMO_PAYMENTS", "true").lower() == "true"
    # SMTP for booking confirmation emails. Leave blank to skip sending email.
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASS = os.getenv("SMTP_PASS", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "")
