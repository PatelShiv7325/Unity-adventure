import uuid
from datetime import datetime
from ..extensions import db


class Coupon(db.Model):
    __tablename__ = "coupons"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False)
    percent_off = db.Column(db.Integer, default=0)
    expires_on = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)


class Booking(db.Model):
    __tablename__ = "bookings"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey("activities.id"), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("slots.id"), nullable=False)

    # Who is flying (can differ from the account holder)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    customer_email = db.Column(db.String(120))

    participants = db.Column(db.Integer, default=1)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    coupon_id = db.Column(db.Integer, db.ForeignKey("coupons.id"))
    discount = db.Column(db.Numeric(10, 2), default=0)
    # pending | verifying (UPI paid, waiting for admin check) | paid | failed | refund_pending | refunded
    payment_status = db.Column(db.String(20), default="pending")
    payment_ref = db.Column(db.String(120))
    # pending (waiting for payment) | confirmed | cancelled | completed
    status = db.Column(db.String(20), default="pending")
    ticket_code = db.Column(db.String(40), unique=True, default=lambda: uuid.uuid4().hex[:12].upper())
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")
    activity = db.relationship("Activity")
    slot = db.relationship("Slot")
    payments = db.relationship("Payment", backref="booking", lazy=True)

    def to_dict(self):
        return {"id": self.id, "activity": self.activity.title,
                "date": self.slot.slot_date.isoformat(),
                "time": self.slot.start_time.strftime("%H:%M"),
                "customer_name": self.customer_name,
                "customer_phone": self.customer_phone,
                "customer_email": self.customer_email,
                "participants": self.participants, "amount": float(self.amount),
                "payment_status": self.payment_status, "status": self.status,
                "ticket_code": self.ticket_code,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "activity_slug": self.activity.slug,
                "location": self.activity.location,
                "discount": float(self.discount or 0)}


class Payment(db.Model):
    """One row per payment attempt. A booking can have several attempts."""
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    provider = db.Column(db.String(20), nullable=False)          # razorpay | demo
    provider_order_id = db.Column(db.String(120), index=True)
    provider_payment_id = db.Column(db.String(120))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default="INR")
    status = db.Column(db.String(20), default="created")    
    transaction_id = db.Column(db.String(120))
    utr = db.Column(db.String(30), index=True)  
    # created | paid | failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime)

    def release_seats(self):
        """Give the seats back to the slot (call once when a booking is cancelled/expired)."""
        if self.slot and self.status != "cancelled":
            self.slot.booked = max(0, (self.slot.booked or 0) - (self.participants or 0))

    def latest_payment(self):
        return max(self.payments, key=lambda p: p.id, default=None)

    def to_dict(self):
        return {"id": self.id, "booking_id": self.booking_id, "provider": self.provider,
                "order_id": self.provider_order_id, "payment_id": self.provider_payment_id,
                "amount": float(self.amount), "currency": self.currency, "status": self.status,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "paid_at": self.paid_at.isoformat() if self.paid_at else None}
