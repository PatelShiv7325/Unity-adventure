from datetime import date, datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from ..extensions import db
from ..models import Activity, Booking, Payment, User, Coupon
from ..utils.decorators import admin_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---------- Overview (dashboard cards) ----------
@bp.get("/overview")
@admin_required
def overview():
    total_activities = Activity.query.count()

    today = date.today()
    todays_bookings = Booking.query.filter(
        func.date(Booking.created_at) == today
    ).count()

    month_start = today.replace(day=1)
    revenue_this_month = db.session.query(func.coalesce(func.sum(Booking.amount), 0)).filter(
        Booking.payment_status == "paid",
        Booking.created_at >= month_start,
    ).scalar()

    pending_bookings = Booking.query.filter_by(status="pending").count()

    return jsonify(
        total_activities=total_activities,
        todays_bookings=todays_bookings,
        revenue_this_month=float(revenue_this_month),
        pending_bookings=pending_bookings,
    )


# ---------- Activities ----------
@bp.post("/activities")
@admin_required
def add_activity():
    d = request.get_json() or {}
    a = Activity(title=d["title"], slug=d["slug"], price=d["price"],
                 description=d.get("description"), location=d.get("location"),
                 duration_minutes=d.get("duration_minutes", 30),
                 difficulty=d.get("difficulty", "Easy"),
                 image_url=d.get("image_url"), safety_notes=d.get("safety_notes"))
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


@bp.put("/activities/<int:activity_id>")
@admin_required
def update_activity(activity_id):
    a = Activity.query.get_or_404(activity_id)
    d = request.get_json() or {}
    for field in ("title", "slug", "price", "description", "location",
                  "duration_minutes", "difficulty", "image_url", "safety_notes"):
        if field in d:
            setattr(a, field, d[field])
    if "is_active" in d:
        a.is_active = bool(d["is_active"])
    db.session.commit()
    return jsonify(a.to_dict())


@bp.patch("/activities/<int:activity_id>/toggle")
@admin_required
def toggle_activity(activity_id):
    a = Activity.query.get_or_404(activity_id)
    a.is_active = not a.is_active
    db.session.commit()
    return jsonify(a.to_dict())


@bp.delete("/activities/<int:activity_id>")
@admin_required
def delete_activity(activity_id):
    a = Activity.query.get_or_404(activity_id)
    if Booking.query.filter_by(activity_id=a.id).first():
        return jsonify(error="Cannot delete an activity that has bookings. Disable it instead."), 400
    from ..models import Slot
    Slot.query.filter_by(activity_id=a.id).delete()
    db.session.delete(a)
    db.session.commit()
    return jsonify(deleted=True)


# ---------- Bookings ----------
@bp.get("/bookings")
@admin_required
def all_bookings():
    rows = Booking.query.order_by(Booking.created_at.desc()).all()
    return jsonify([{**b.to_dict(), "account_email": b.user.email} for b in rows])


@bp.patch("/bookings/<int:booking_id>/status")
@admin_required
def update_booking_status(booking_id):
    b = Booking.query.get_or_404(booking_id)
    d = request.get_json() or {}
    status = d.get("status")
    if status not in ("pending", "confirmed", "cancelled", "completed"):
        return jsonify(error="Invalid status"), 400
    b.status = status
    if status == "cancelled" and b.payment_status == "paid":
        b.payment_status = "refund_pending"
    db.session.commit()
    return jsonify(b.to_dict())


@bp.patch("/bookings/<int:booking_id>/refund")
@admin_required
def refund_booking(booking_id):
    b = Booking.query.get_or_404(booking_id)
    if b.payment_status not in ("paid", "refund_pending"):
        return jsonify(error="Only paid bookings can be refunded"), 400
    b.payment_status = "refunded"
    b.status = "cancelled"
    db.session.commit()
    return jsonify(b.to_dict())


@bp.get("/payments")
@admin_required
def all_payments():
    return jsonify([p.to_dict() for p in Payment.query.order_by(Payment.created_at.desc()).all()])


# ---------- Users ----------
@bp.get("/users")
@admin_required
def all_users():
    return jsonify([u.to_dict() for u in User.query.all()])


@bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    u = User.query.get_or_404(user_id)
    if u.role == "admin":
        return jsonify(error="Cannot delete an admin account"), 400
    if Booking.query.filter_by(user_id=u.id).first():
        return jsonify(error="Cannot delete a user with existing bookings"), 400
    db.session.delete(u)
    db.session.commit()
    return jsonify(deleted=True)


# ---------- Revenue ----------
@bp.get("/revenue")
@admin_required
def revenue():
    total = db.session.query(func.coalesce(func.sum(Booking.amount), 0)).filter(
        Booking.payment_status == "paid").scalar()

    by_activity_rows = (
        db.session.query(Activity.title, func.coalesce(func.sum(Booking.amount), 0))
        .join(Booking, Booking.activity_id == Activity.id)
        .filter(Booking.payment_status == "paid")
        .group_by(Activity.title)
        .order_by(func.sum(Booking.amount).desc())
        .all()
    )
    by_activity = [{"activity": title, "revenue": float(amt)} for title, amt in by_activity_rows]

    by_month_rows = (
        db.session.query(func.strftime("%Y-%m", Booking.created_at), func.coalesce(func.sum(Booking.amount), 0))
        .filter(Booking.payment_status == "paid")
        .group_by(func.strftime("%Y-%m", Booking.created_at))
        .order_by(func.strftime("%Y-%m", Booking.created_at))
        .all()
    )
    by_month = [{"month": m, "revenue": float(amt)} for m, amt in by_month_rows]

    return jsonify(total_revenue=float(total), by_activity=by_activity, by_month=by_month)


# ---------- Coupons ----------
@bp.get("/coupons")
@admin_required
def list_coupons():
    rows = Coupon.query.order_by(Coupon.id.desc()).all()
    return jsonify([{
        "id": c.id, "code": c.code, "percent_off": c.percent_off,
        "expires_on": c.expires_on.isoformat() if c.expires_on else None,
        "is_active": c.is_active,
    } for c in rows])


@bp.post("/coupons")
@admin_required
def add_coupon():
    d = request.get_json() or {}
    expires_on = None
    if d.get("expires_on"):
        expires_on = datetime.strptime(d["expires_on"], "%Y-%m-%d").date()
    c = Coupon(code=d["code"].upper(), percent_off=d.get("percent_off", 0),
               expires_on=expires_on, is_active=d.get("is_active", True))
    db.session.add(c)
    db.session.commit()
    return jsonify(id=c.id, code=c.code, percent_off=c.percent_off,
                   expires_on=c.expires_on.isoformat() if c.expires_on else None,
                   is_active=c.is_active), 201


@bp.put("/coupons/<int:coupon_id>")
@admin_required
def update_coupon(coupon_id):
    c = Coupon.query.get_or_404(coupon_id)
    d = request.get_json() or {}
    if "code" in d:
        c.code = d["code"].upper()
    if "percent_off" in d:
        c.percent_off = d["percent_off"]
    if "expires_on" in d:
        c.expires_on = datetime.strptime(d["expires_on"], "%Y-%m-%d").date() if d["expires_on"] else None
    if "is_active" in d:
        c.is_active = bool(d["is_active"])
    db.session.commit()
    return jsonify(id=c.id, code=c.code, percent_off=c.percent_off,
                   expires_on=c.expires_on.isoformat() if c.expires_on else None,
                   is_active=c.is_active)


@bp.delete("/coupons/<int:coupon_id>")
@admin_required
def delete_coupon(coupon_id):
    c = Coupon.query.get_or_404(coupon_id)
    db.session.delete(c)
    db.session.commit()
    return jsonify(deleted=True)