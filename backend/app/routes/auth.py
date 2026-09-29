from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..utils.validators import require_fields

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json() or {}
    missing = require_fields(data, ["name", "email", "password"])
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}"), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify(error="Email already registered"), 409
    user = User(name=data["name"], email=data["email"].lower(), phone=data.get("phone"))
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
