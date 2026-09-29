from datetime import date
from flask import Blueprint, request, jsonify
from ..models import Activity, Slot

bp = Blueprint("activities", __name__, url_prefix="/api/activities")


@bp.get("")
def list_activities():
    items = Activity.query.filter_by(is_active=True).all()
    return jsonify([a.to_dict() for a in items])


@bp.get("/<slug>")
def get_activity(slug):
    a = Activity.query.filter_by(slug=slug, is_active=True).first_or_404()
    return jsonify(a.to_dict())


@bp.get("/<slug>/slots")
def get_slots(slug):
    a = Activity.query.filter_by(slug=slug, is_active=True).first_or_404()
    q = Slot.query.filter(Slot.activity_id == a.id, Slot.slot_date >= date.today())
    if request.args.get("date"):
        q = q.filter(Slot.slot_date == date.fromisoformat(request.args["date"]))
    slots = q.order_by(Slot.slot_date, Slot.start_time).all()
    return jsonify([s.to_dict() for s in slots])
