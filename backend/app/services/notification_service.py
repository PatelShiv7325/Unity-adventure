"""Email booking confirmations over SMTP (Gmail, or any SMTP provider)."""
import smtplib
import threading
from email.message import EmailMessage
from flask import current_app
from . import ticket_service


def email_enabled() -> bool:
    cfg = current_app.config
    return bool(cfg["SMTP_HOST"] and cfg["SMTP_USER"])


def send_booking_confirmation(booking) -> bool:
    """Email the customer their ticket (full ticket image attached).

    Silently no-ops (returns False) if SMTP isn't configured or there's no email on file,
    so payments still succeed even without email set up. Never raises.
    """
    cfg = current_app.config
    to_email = booking.customer_email
    if not to_email or not email_enabled():
        current_app.logger.info("Skipping confirmation email: SMTP not configured or no email on file.")
        return False
    try:
        ticket_png = ticket_service.generate_ticket_image(booking)

        msg = EmailMessage()
        msg["Subject"] = f"Your ticket for {booking.activity.title} - {booking.ticket_code}"
        msg["From"] = cfg["SMTP_FROM"] or cfg["SMTP_USER"]
        msg["To"] = to_email
        msg.set_content(
            f"Hi {booking.customer_name},\n\n"
            f"Your booking is confirmed!\n\n"
            f"Activity: {booking.activity.title}\n"
            f"Date: {booking.slot.slot_date.strftime('%d %b %Y')} at {booking.slot.start_time.strftime('%I:%M %p').lstrip('0')}\n"
            f"People: {booking.participants}\n"
            f"Amount paid: Rs {float(booking.amount):,.0f}\n"
            f"Ticket code: {booking.ticket_code}\n\n"
            f"Your ticket is attached. Show it (or the QR code on it) at check-in and carry a photo ID.\n"
            f"Please arrive 20 minutes before your slot.\n\n"
            f"- Unity Adventure Sports"
        )
        msg.add_attachment(ticket_png, maintype="image", subtype="png",
                           filename=f"ticket-{booking.ticket_code}.png")

        # timeout: a slow mail server must never freeze the request that confirms a payment
        with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=15) as server:
            server.starttls()
            server.login(cfg["SMTP_USER"], cfg["SMTP_PASS"])
            server.send_message(msg)
        return True
    except Exception:
        current_app.logger.exception("Failed to send booking confirmation email")
        return False


def send_booking_confirmation_async(booking) -> bool:
    """Send the email in the background so the customer sees 'Payment successful' immediately."""
    if not booking.customer_email or not email_enabled():
        current_app.logger.info("Skipping confirmation email: SMTP not configured or no email on file.")
        return False
    app = current_app._get_current_object()
    booking_id = booking.id

    def _run():
        from ..extensions import db
        from ..models import Booking
        with app.app_context():
            b = db.session.get(Booking, booking_id)
            if b:
                send_booking_confirmation(b)

    threading.Thread(target=_run, daemon=True).start()
    return True

def send_admin_payment_alert(booking) -> bool:
    """Email the owner that a UPI payment is waiting to be checked. Never raises."""
    cfg = current_app.config
    to_email = cfg.get("ADMIN_NOTIFY_EMAIL")
    if not to_email or not email_enabled():
        return False
    try:
        msg = EmailMessage()
        msg["Subject"] = f"UPI payment to check: Rs {float(booking.amount):,.0f} - {booking.customer_name}"
        msg["From"] = cfg["SMTP_FROM"] or cfg["SMTP_USER"]
        msg["To"] = to_email
        what = booking.activity.title + (f" - {booking.package}" if booking.package else "")
        msg.set_content(
            "A customer says they have paid by UPI.\n\n"
            f"Amount expected: Rs {float(booking.amount):,.2f}\n"
            f"UTR they entered: {booking.payment_ref}\n"
            f"Customer: {booking.customer_name} ({booking.customer_phone})\n"
            f"Ride: {what}, {booking.participants} person(s)\n"
            f"Date: {booking.slot.slot_date.strftime('%d %b %Y')} at {booking.slot.start_time.strftime('%I:%M %p').lstrip('0')}\n"
            f"Ticket code: {booking.ticket_code}\n\n"
            "To check: open PhonePe > History and find a payment with the same UTR and the same amount.\n"
            "If it matches, open Admin > Bookings and press Approve payment. Otherwise press Reject."
        )
        with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=15) as server:
            server.starttls()
            server.login(cfg["SMTP_USER"], cfg["SMTP_PASS"])
            server.send_message(msg)
        return True
    except Exception:
        current_app.logger.exception("Failed to send admin payment alert")
        return False


def send_admin_payment_alert_async(booking) -> bool:
    """Send the alert in the background so the customer's request is never slowed down."""
    if not current_app.config.get("ADMIN_NOTIFY_EMAIL") or not email_enabled():
        return False
    app = current_app._get_current_object()
    booking_id = booking.id

    def _run():
        from ..extensions import db
        from ..models import Booking
        with app.app_context():
            b = db.session.get(Booking, booking_id)
            if b:
                send_admin_payment_alert(b)

    threading.Thread(target=_run, daemon=True).start()
    return True