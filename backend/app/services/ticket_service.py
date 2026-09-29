"""QR-code ticket generation. Encodes the booking's ticket_code as a PNG."""
import io
import qrcode


def generate_ticket_qr(ticket_code: str) -> bytes:
    """Return PNG image bytes of a QR code that encodes the ticket code."""
    img = qrcode.make(ticket_code)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()