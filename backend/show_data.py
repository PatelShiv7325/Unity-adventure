"""Print users, bookings and payments from the database:  python show_data.py"""
from app import create_app
from app.models import User, Booking, Payment

app = create_app()


def table(title, header, rows):
    print(f"\n=== {title} ({len(rows)}) ===")
    if not rows:
        print("(empty)")
        return
    widths = [max(len(str(x)) for x in col) for col in zip(header, *rows)]
    line = lambda r: "  ".join(str(x).ljust(w) for x, w in zip(r, widths))
    print(line(header))
    print("  ".join("-" * w for w in widths))
    for r in rows:
        print(line(r))


with app.app_context():
    table("USERS", ["id", "name", "email", "phone", "role"],
          [(u.id, u.name, u.email, u.phone or "", u.role) for u in User.query.all()])
    table("BOOKINGS", ["id", "customer", "phone", "activity", "date", "time", "people", "amount", "pay", "status", "ticket"],
          [(b.id, b.customer_name, b.customer_phone, b.activity.title, b.slot.slot_date, b.slot.start_time.strftime("%H:%M"),
            b.participants, b.amount, b.payment_status, b.status, b.ticket_code) for b in Booking.query.all()])
    table("PAYMENTS", ["id", "booking", "provider", "order_id", "payment_id", "amount", "status"],
          [(p.id, p.booking_id, p.provider, p.provider_order_id, p.provider_payment_id or "", p.amount, p.status)
           for p in Payment.query.all()])
