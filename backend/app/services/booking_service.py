"""Booking helpers shared by several routes."""
from datetime import date, datetime, time, timedelta
from flask import current_app
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import Booking, Coupon, Slot


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


# Daily flying slots. Change these times / seats if your schedule changes.
SLOT_TIMES = (time(7, 0), time(9, 0), time(16, 30), time(18, 0))
SLOT_CAPACITY = 4
SLOT_DAYS_AHEAD = 30


def ensure_slots(activity, days_ahead=SLOT_DAYS_AHEAD):
    """Create the daily slots for the next `days_ahead` days if they do not exist yet.

    The seed script only made 7 days of slots once, so after a week the booking page showed
    'No slots on this date'. Now slots are topped up automatically, so it never runs out.
    """
    today = date.today()
    last = today + timedelta(days=days_ahead)
    have = {(s.slot_date, s.start_time) for s in
            Slot.query.filter(Slot.activity_id == activity.id,
                              Slot.slot_date >= today, Slot.slot_date <= last).all()}
    added = 0
    for d in range(0, days_ahead + 1):
        day = today + timedelta(days=d)
        for t in SLOT_TIMES:
            if (day, t) not in have:
                db.session.add(Slot(activity_id=activity.id, slot_date=day, start_time=t,
                                    capacity=SLOT_CAPACITY, booked=0))
                added += 1
    if added:
        try:
            db.session.commit()
        except IntegrityError:  # two visitors at the same moment - the other one created them
            db.session.rollback()
    return added