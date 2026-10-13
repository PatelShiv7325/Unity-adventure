"""Run once: python seed.py  -> creates tables, an admin user and Unity Adventure Sports activities."""
from datetime import date, time, timedelta
from app import create_app
from app.extensions import db
from app.models import User, Activity, Slot
import os

app = create_app()

# The admin account can approve payments, so it must never use a password that is written in the
# source code (anyone who can read the GitHub repo would know it).
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD:
    if app.config["IS_PRODUCTION"]:
        raise SystemExit("Set ADMIN_PASSWORD (and optionally ADMIN_EMAIL) before running seed.py in production.")
    ADMIN_PASSWORD = "@unity#123"  # local development only
    print("NOTE: using the development admin password. Set ADMIN_PASSWORD before going live.")
elif len(ADMIN_PASSWORD) < 10:
    raise SystemExit("ADMIN_PASSWORD must be at least 10 characters.")

SAMPLE = [
    ("Paramotor Ride", "paramotor-ride", 1999, 7, "Ralej(coastal), Khambhat", "Medium",
     "Powered winchgliding with an ex-Indian Army instructor. Fly Smart (5-7 min, Rs.1,999) or Fly High (7-9 min, Rs.2,499) - choose your package when booking.",
     "Flown in tandem with a certified pilot who takes off and lands the aircraft. Dual-reserve parachute system. Digital wind monitoring before every launch. Minimum weight 15 kg, maximum 100 kg. No age restriction; minors need guardian consent.",
     "/images/paramotor_ride.jpg"),
    ("Winchgliding", "winchgliding", 2499, 15, "Ralej(coastal), Khambhat", "Medium",
     "Free flight above the coastline in tandem with a certified winchgliding instructor.",
     "Certified equipment, pre-flight briefing, and flights conducted only within safe wind and weather limits.",
     "/images/winchgliding.jpg"),
    ("Parasailing", "parasailing", 999, 10, "Ralej(coastal), Khambhat", "Easy",
     "An aerial adventure over the coast, suited to first-time flyers and families.",
     "Life jacket and harness provided. Briefing given before every flight.",
     "/images/parasailing.jpg"),
]

with app.app_context():
    db.create_all()
    if not User.query.filter_by(email=ADMIN_EMAIL).first():
        admin = User(name="Admin", email=ADMIN_EMAIL, phone="0000000000", role="admin")
        admin.set_password(ADMIN_PASSWORD)
        db.session.add(admin)
    for title, slug, price, mins, loc, diff, desc, safety, image in SAMPLE:
        a = Activity.query.filter_by(slug=slug).first()
        if a:
            a.price = price
            a.duration_minutes = mins
            a.location = loc
            a.difficulty = diff
            a.description = desc
            a.safety_notes = safety
            a.image_url = image
            continue
        a = Activity(title=title, slug=slug, price=price, duration_minutes=mins,
                     location=loc, difficulty=diff, description=desc, safety_notes=safety, image_url=image)
        db.session.add(a)
        db.session.flush()
        for d in range(1, 8):
            for t in (time(7, 0), time(9, 0), time(16, 30), time(18, 0)):
                db.session.add(Slot(activity_id=a.id, slot_date=date.today() + timedelta(days=d),
                                    start_time=t, capacity=10))
    db.session.commit()
    print(f"Seeded. Admin login: {ADMIN_EMAIL} / (your ADMIN_PASSWORD)")