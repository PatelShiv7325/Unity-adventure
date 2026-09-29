from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Review

bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


@bp.get("/<int:activity_id>")
def list_reviews(activity_id):
    items = Review.query.filter_by(activity_id=activity_id).order_by(Review.created_at.desc()).all()
    return jsonify([{"id": r.id, "rating": r.rating, "comment": r.comment} for r in items])


@bp.post("/<int:activity_id>")
@jwt_required()
def add_review(activity_id):
    data = request.get_json() or {}
    rating = int(data.get("rating", 0))
    if not 1 <= rating <= 5:
        return jsonify(error="rating must be 1-5"), 400
    r = Review(user_id=int(get_jwt_identity()), activity_id=activity_id,
               rating=rating, comment=data.get("comment"))
    db.session.add(r)
    db.session.commit()
    return jsonify(id=r.id), 201
