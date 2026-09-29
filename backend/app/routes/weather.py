from flask import Blueprint, jsonify

bp = Blueprint("weather", __name__, url_prefix="/api/weather")


@bp.get("/<slug>")
def weather(slug):
    # TODO (Step 11): call a weather API using the activity's latitude/longitude
    return jsonify(error="Not implemented yet"), 501
