"""Email booking confirmations over SMTP (Gmail, or any SMTP provider)."""
import smtplib
from email.message import EmailMessage
from flask import current_app
from . import ticket_service


def send_booking_confirmation(booking) -> bool:
    """Email the customer their ticket + QR code.
    Silently no-ops (returns False) if SMTP isn't configured or there's no
    email on file, so payments still succeed even without email set up.
    """
    cfg = current_app.config
    to_email = booking.customer_email
    if not to_email or not cfg["SMTP_HOST"] or not cfg["SMTP_USER"]:
        current_app.logger.info(
            "Skipping confirmation email: SMTP not configured or no email on file."
        )
        return False

    qr_bytes = ticket_service.generate_ticket_qr(booking.ticket_code)

    msg = EmailMessage()
    msg["Subject"] = f"Your ticket for {booking.activity.title} - {booking.ticket_code}"
    msg["From"] = cfg["SMTP_FROM"] or cfg["SMTP_USER"]
    msg["To"] = to_email
    msg.set_content(
        f"Hi {booking.customer_name},\n\n"
        f"Your booking is confirmed!\n\n"
        f"Activity: {booking.activity.title}\n"
        f"Date: {booking.slot.slot_date.isoformat()} at {booking.slot.start_time.strftime('%H:%M')}\n"
        f"Participants: {booking.participants}\n"
        f"Amount paid: Rs {booking.amount}\n"
        f"Ticket code: {booking.ticket_code}\n\n"
        f"Show the attached QR code at check-in.\n\n"
        f"- Unity Adventure Sports"
    )
    msg.add_attachment(qr_bytes, maintype="image", subtype="png", filename="ticket.png")

    try:
        with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"]) as server:
            server.starttls()
            server.login(cfg["SMTP_USER"], cfg["SMTP_PASS"])
            server.send_message(msg)
        return True
    except Exception:
        current_app.logger.exception("Failed to send booking confirmation email")
        return False