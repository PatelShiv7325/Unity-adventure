"""Ticket generation: a QR code for the ticket code, and a full printable ticket image (PNG)."""
import io
import qrcode
from PIL import Image, ImageDraw, ImageFont

NIGHT = (11, 27, 43)
CANOPY = (255, 90, 31)
SUN = (255, 194, 26)
GLACIER = (223, 240, 249)
MUTED = (77, 98, 116)


def generate_ticket_qr(ticket_code: str) -> bytes:
    img = qrcode.make(ticket_code)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _font(size, bold=False):
    names = (["DejaVuSans-Bold.ttf", "arialbd.ttf", "Arial Bold.ttf"] if bold
             else ["DejaVuSans.ttf", "arial.ttf", "Arial.ttf"])
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()


def generate_ticket_image(booking) -> bytes:
    W, H = 1100, 520
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W, 110], fill=NIGHT)
    d.rectangle([0, 104, W, 114], fill=CANOPY)
    d.text((40, 28), "UNITY ADVENTURE SPORTS", font=_font(40, True), fill="white")
    d.text((42, 76), "Paramotor  |  Winchgliding  |  Parasailing", font=_font(18), fill=SUN)
    d.rounded_rectangle([W - 300, 30, W - 40, 82], radius=26, fill=CANOPY)
    d.text((W - 280, 44), "CONFIRMED", font=_font(26, True), fill=NIGHT)

    slot = booking.slot
    rows = [
        ("ACTIVITY", booking.activity.title),
        ("DATE", slot.slot_date.strftime("%d %b %Y")),
        ("REPORTING TIME", slot.start_time.strftime("%I:%M %p").lstrip("0")),
        ("FLYER", booking.customer_name),
        ("PEOPLE", str(booking.participants)),
        ("AMOUNT PAID", "Rs. {:,.0f}".format(float(booking.amount))),
    ]
    x0, y0 = 40, 150
    for i, (label, value) in enumerate(rows):
        col, row = i % 2, i // 2
        x, y = x0 + col * 340, y0 + row * 100
        d.text((x, y), label, font=_font(16, True), fill=MUTED)
        v = value if len(value) <= 20 else value[:19] + "..."
        d.text((x, y + 26), v, font=_font(30, True), fill=NIGHT)

    for y in range(130, H - 20, 18):
        d.line([(750, y), (750, y + 9)], fill=(190, 205, 216), width=3)
    qr = Image.open(io.BytesIO(generate_ticket_qr(booking.ticket_code))).convert("RGB").resize((250, 250))
    img.paste(qr, (810, 150))
    d.text((810, 410), "TICKET CODE", font=_font(15, True), fill=MUTED)
    d.text((810, 434), booking.ticket_code, font=_font(26, True), fill=CANOPY)

    d.rectangle([0, H - 46, W, H], fill=GLACIER)
    d.text((40, H - 34), "Venue: Ralej, Khambhat (coastal site)   |   +91 90814 24343   |   Carry a photo ID. Show this ticket at check-in.",
           font=_font(15), fill=NIGHT)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()