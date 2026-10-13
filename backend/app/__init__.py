from flask import Flask, jsonify
from config import Config
from .extensions import db, migrate, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from .routes import register_blueprints
    register_blueprints(app)

    # First run on a brand-new database (e.g. a fresh Postgres on Render): create the tables.
    # Safe to repeat - it only creates tables that are missing.
    with app.app_context():
        try:
            from . import models  # noqa: F401  (make sure every model is registered)
            db.create_all()
        except Exception:  # two workers starting at once can race; the other one wins
            app.logger.warning("create_all skipped", exc_info=True)

    from .services.schema_service import add_missing_columns
    add_missing_columns(app, db)

    @app.get("/")
    def index():
        return jsonify(service="Unity Adventure API", status="ok", health="/api/health", rides="/api/activities")

    @app.get("/favicon.ico")
    def favicon():
        return "", 204

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")


    # Flask's default 404/500 pages are HTML, so requests like a bad slot_id
    # (get_or_404) used to reach the frontend with no "error" field at all.
    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error="Not found"), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify(error="Method not allowed"), 405

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception(e)
        return jsonify(error="Something went wrong on our end"), 500

    return app