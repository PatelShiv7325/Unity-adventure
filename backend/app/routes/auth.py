from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..utils.validators import require_fields, valid_email, clean_phone

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json() or {}
    missing = require_fields(data, ["name", "email", "password"])
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}"), 400
    if not valid_email(data["email"]):
        return jsonify(error="Enter a valid email address"), 400
    if len(data["password"]) < 6:
        return jsonify(error="Password must be at least 6 characters"), 400
    if data.get("phone") and not clean_phone(data["phone"]):
        return jsonify(error="Enter a valid phone number (10 digits)"), 400
    if User.query.filter_by(email=data["email"].strip().lower()).first():
        return jsonify(error="Email already registered"), 409
    user = User(name=data["name"].strip(), email=data["email"].strip().lower(),
                phone=clean_phone(data.get("phone")) if data.get("phone") else None)
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify(token=token, user=user.to_dict()), 201


@bp.post("/login")
def login():
    data = request.get_json() or {}
    user = User.query.filter_by(email=(data.get("email") or "").lower()).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify(error="Invalid email or password"), 401
    return jsonify(token=create_access_token(identity=str(user.id)), user=user.to_dict())


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.to_dict())


# TODO (Step 8): POST /api/auth/google  -> verify Google ID token, create/login user
