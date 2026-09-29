from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()


# Flask-JWT-Extended returns {"msg": "..."} by default, not {"error": "..."}.
# The frontend only reads .error, so without these it silently falls back to
# a generic "failed" message on every auth problem. These make the real
# reason visible to the user.
@jwt.unauthorized_loader
def _missing_token(reason):
    return jsonify(error="Please log in to continue."), 401


@jwt.invalid_token_loader
def _invalid_token(reason):
    return jsonify(error="Your session is invalid. Please log in again."), 401


@jwt.expired_token_loader
def _expired_token(jwt_header, jwt_payload):
    return jsonify(error="Your session expired. Please log in again."), 401