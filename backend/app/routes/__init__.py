def register_blueprints(app):
    from .auth import bp as auth_bp
    from .activities import bp as activities_bp
    from .bookings import bp as bookings_bp
    from .payments import bp as payments_bp
    from .reviews import bp as reviews_bp
    from .admin import bp as admin_bp
    from .weather import bp as weather_bp

    for bp in (auth_bp, activities_bp, bookings_bp, payments_bp, reviews_bp, admin_bp, weather_bp):
        app.register_blueprint(bp)
