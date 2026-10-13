"""Booking helpers shared by several routes."""
from datetime import date, datetime, time, timedelta, timezone
from flask import current_app
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import Booking, Coupon, Slot

# India has no daylight saving, so a fixed +05:30 offset is exact and needs no tz database
# (Render's Python image and Windows both lack one by default).
IST = timezone(timedelta(hours=5, minutes=30))


def now_local():
    """Current time in India as a naive datetime (slot times are stored as local India time)."""
    return datetime.now(IST).replace(tzinfo=None)


def today_local():
    return now_local().date()


def slot_start(slot):
    return datetime.combine(slot.slot_date, slot.start_time)


def slot_is_open(slot):
    """True while customers may still book this slot (it must start at least BOOKING_CUTOFF_MINUTES from now)."""
    cutoff = current_app.config.get("BOOKING_CUTOFF_MINUTES", 60)
    return slot_start(slot) >= now_local() + timedelta(minutes=cutoff)


def expire_stale_holds():
    """Unpaid bookings hold seats. Release them when their hold has run out."""
    now = datetime.utcnow()
    legacy_cutoff = now - timedelta(minutes=current_app.config.get("HOLD_MINUTES", 30))
    stale = Booking.query.filter(
        Booking.status == "pending",
        Booking.payment_status.in_(("pending", "failed")),
        or_(and_(Booking.hold_until.isnot(None), Booking.hold_until < now),
            and_(Booking.hold_until.is_(None), Booking.created_at < legacy_cutoff)),
    ).all()
    for b in stale:
        b.release_seats()
        b.status = "cancelled"
    if stale:
        db.session.commit()
    return len(stale)


def extend_hold(booking):
    """A customer who has started paying keeps the seats for HOLD_MINUTES more.

    Without this, someone who starts a UPI payment at minute 25 and pays at minute 31 would lose
    their seats AFTER the money had left their account. Capped by HOLD_MAX_MINUTES from booking time."""
    cfg = current_app.config
    now = datetime.utcnow()
    hard_stop = (booking.created_at or now) + timedelta(minutes=cfg.get("HOLD_MAX_MINUTES", 180))
    wanted = now + timedelta(minutes=cfg.get("HOLD_MINUTES", 30))
    booking.hold_until = max(booking.hold_expires(), min(wanted, hard_stop))


def reserve_seats(slot_id, people):
    """Take `people` seats from a slot. One atomic UPDATE, so two customers clicking at the same
    moment can never both get the last seats. Returns True if the seats were reserved."""
    taken = (Slot.query
             .filter(Slot.id == slot_id, Slot.booked + people <= Slot.capacity)
             .update({Slot.booked: Slot.booked + people}, synchronize_session=False))
    return bool(taken)


def find_coupon(code):
    """Return (coupon, error)."""
    code = (code or "").strip().upper()
    if not code:
        return None, None
    c = Coupon.query.filter_by(code=code).first()
    if not c or not c.is_active:
        return None, "Invalid coupon code"
    if c.expires_on and c.expires_on < today_local():
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
SLOT_CAPACITY = 10
SLOT_DAYS_AHEAD = 30


def ensure_slots(activity, days_ahead=SLOT_DAYS_AHEAD):
    """Create the daily slots for the next `days_ahead` days if they do not exist yet.

    The seed script only made 7 days of slots once, so after a week the booking page showed
    'No slots on this date'. Now slots are topped up automatically, so it never runs out.
    """
    today = today_local()
    last = today + timedelta(days=days_ahead)
    have = {(s.slot_date, s.start_time) for s in
            Slot.query.filter(Slot.activity_id == activity.id,
                              Slot.slot_date >= today, Slot.slot_date <= last).all()}

    # raise seats on slots that were created earlier with a smaller limit (bookings are kept)
    Slot.query.filter(Slot.activity_id == activity.id, Slot.slot_date >= today,
                      Slot.capacity < SLOT_CAPACITY).update({"capacity": SLOT_CAPACITY})

    added = 0
    for d in range(0, days_ahead + 1):
        day = today + timedelta(days=d)
        for t in SLOT_TIMES:
            if (day, t) not in have:
                db.session.add(Slot(activity_id=activity.id, slot_date=day, start_time=t,
                                    capacity=SLOT_CAPACITY, booked=0))
                added += 1
    try:
        db.session.commit()
    except IntegrityError:  # two visitors at the same moment - the other one created them
        db.session.rollback()
    return added
