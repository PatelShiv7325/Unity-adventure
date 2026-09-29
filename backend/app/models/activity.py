from ..extensions import db
class Activity(db.Model):
    __tablename__ = "activities"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(160), unique=True, nullable=False)
    description = db.Column(db.Text)
    safety_notes = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    duration_minutes = db.Column(db.Integer, default=30)
    location = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    difficulty = db.Column(db.String(20), default="Easy")
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    slots = db.relationship("Slot", backref="activity", lazy=True)
    def to_dict(self):
        return {"id": self.id, "title": self.title, "slug": self.slug,
                "description": self.description, "safety_notes": self.safety_notes,
                "price": float(self.price), "duration_minutes": self.duration_minutes,
                "location": self.location, "latitude": self.latitude,
                "longitude": self.longitude, "difficulty": self.difficulty,
                "image_url": self.image_url, "is_active": self.is_active}
class Slot(db.Model):
    __tablename__ = "slots"
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey("activities.id"), nullable=False)
    slot_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    capacity = db.Column(db.Integer, default=6)
    booked = db.Column(db.Integer, default=0)
    __table_args__ = (db.UniqueConstraint("activity_id", "slot_date", "start_time"),)
    def to_dict(self):
        return {"id": self.id, "date": self.slot_date.isoformat(),
                "time": self.start_time.strftime("%H:%M"),
                "available": self.capacity - self.booked}