"""Booking helpers shared by several routes."""
from datetime import date, datetime, timedelta
from flask import current_app
from ..extensions import db
from ..models import Booking, Coupon


def expire_stale_holds():
    """Unpaid bookings hold seats. Release them after HOLD_MINUTES."""
    minutes = current_app.config.get("HOLD_MINUTES", 30)
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    stale = Booking.query.filter(Booking.status == "pending",
                                 Booking.payment_status.in_(("pending", "failed")),
                                 Booking.created_at < cutoff).all()
    for b in stale:
        b.release_seats()
        b.status = "cancelled"
    if stale:
        db.session.commit()
    return len(stale)


def find_coupon(code):
    """Return (coupon, error)."""
    code = (code or "").strip().upper()
    if not code:
        return None, None
    c = Coupon.query.filter_by(code=code).first()
    if not c or not c.is_active:
        return None, "Invalid coupon code"
    if c.expires_on and c.expires_on < date.today():
        return None, "This coupon has expired"
    return c, None


def apply_coupon(amount, coupon):
    """Return (discount, total) for a rupee amount."""
    if not coupon:
        return 0, amount
    pct = max(0, min(100, int(coupon.percent_off or 0)))
    discount = round(float(amount) * pct / 100)
    return discount, float(amount) - discount