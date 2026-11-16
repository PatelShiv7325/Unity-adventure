"""Ticket generation: a QR code for the ticket, and a full printable ticket image (PNG)."""
import io
import os
import textwrap
import qrcode
from flask import current_app
from PIL import Image, ImageDraw, ImageFont, ImageOps

NIGHT = (11, 27, 43)        # page background around the ticket
ACCENT = (200, 22, 40)      # red used for pills and headings (change to (255, 90, 31) for brand orange)
PINK = (253, 228, 230)      # light pill background
INK = (30, 30, 34)
MUTED = (110, 110, 118)
LINE = (205, 210, 216)
WHITE = (255, 255, 255)

_APP_DIR = os.path.dirname(os.path.dirname(__file__))
_FONT_DIR = os.path.join(_APP_DIR, "assets", "fonts")
_PHOTO_DIR = os.path.join(_APP_DIR, "assets", "ticket")   # ride photos + logo for the ticket

W = 900


def generate_ticket_qr(ticket_code: str) -> bytes:
    img = qrcode.make(ticket_code)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def ticket_qr_value(ticket_code: str) -> str:
    """The QR holds a link that opens the staff check-in page (or just the code if FRONTEND_URL is empty)."""
    base = current_app.config.get("FRONTEND_URL", "")
    return f"{base}/admin/checkin?code={ticket_code}" if base else ticket_code


def _font(size, bold=False):
    # The bundled font comes first so the ticket looks identical on every server
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for n in (os.path.join(_FONT_DIR, name), name, "arialbd.ttf" if bold else "arial.ttf"):
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()


def _fit(draw, text, max_width, size, bold=True, min_size=16):
    """Shrink the font until the text fits; only then cut it with '...'."""
    while size > min_size and draw.textlength(text, font=_font(size, bold)) > max_width:
        size -= 2
    font = _font(size, bold)
    if draw.textlength(text, font=font) > max_width:
        base = text
        while len(base) > 1 and draw.textlength(base + "...", font=font) > max_width:
            base = base[:-1]
        text = base.rstrip() + "..."
    return text, font


def _center(d, text, y, font, fill, cx=W // 2):
    d.text((cx - d.textlength(text, font=font) / 2, y), text, font=font, fill=fill)


def _right(d, text, x_right, y, font, fill):
    d.text((x_right - d.textlength(text, font=font), y), text, font=font, fill=fill)


def _dashed(d, y, x0=70, x1=830):
    for x in range(x0, x1, 16):
        d.line([(x, y), (x + 8, y)], fill=LINE, width=3)


def _load(name):
    try:
        return Image.open(os.path.join(_PHOTO_DIR, name))
    except (OSError, ValueError):
        return None


def _qr_image(value, max_px=320):
    """Sharp QR: every square is a whole number of pixels (no blurry resizing)."""
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=3)
    q.add_data(value)
    q.make(fit=True)
    q.box_size = max(3, max_px // (q.modules_count + 6))
    return q.make_image(fill_color="black", back_color="white").convert("RGB")


def _money(v):
    return "Rs. {:,.2f}".format(v)


def generate_ticket_image(booking) -> bytes:
    cfg = current_app.config
    slot, activity = booking.slot, booking.activity
    people = booking.participants or 1
    paid = float(booking.amount)
    discount = float(booking.discount or 0)
    subtotal = paid + discount
    gst = float(cfg.get("GST_PERCENT", 0) or 0)

    # price rows (label, value, is_bold) - built first because they decide the ticket height
    rows = [("Total Amount", _money(subtotal), True),
            (f"Ride Price ({people} {'Person' if people == 1 else 'People'})", _money(subtotal), False)]
    if gst > 0:
        rows.append((f"GST ({gst:g}%) included", _money(paid - paid / (1 + gst / 100)), False))
    rows.append(("Discount", "- " + _money(discount), False))

    price_top = 1545
    pill_top = price_top + 56 * len(rows)
    card_bottom = pill_top + 70 + 45
    H = card_bottom + 30

    img = Image.new("RGB", (W, H), NIGHT)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([30, 30, W - 30, card_bottom], radius=40, fill=WHITE)

    # ---- top: photo, logo, title, date, place ----
    photo = _load(f"{activity.slug}.jpg")
    mask = Image.new("L", (250, 370), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 249, 369], radius=22, fill=255)
    if photo:
        img.paste(ImageOps.fit(photo.convert("RGB"), (250, 370), Image.LANCZOS), (70, 70), mask)
    else:
        d.rounded_rectangle([70, 70, 320, 440], radius=22, fill=NIGHT)

    logo = _load("logo.png")
    if logo:
        logo = logo.convert("RGBA")
        logo.thumbnail((430, 90))
        img.paste(logo, (350, 72), logo)
    else:
        _t, f = _fit(d, "UNITY ADVENTURE SPORTS", 430, 34)
        d.text((350, 90), "UNITY ADVENTURE SPORTS", font=f, fill=ACCENT)

    title, f = _fit(d, activity.title, 440, 42, min_size=24)
    d.text((350, 170), title, font=f, fill=INK)
    sub, f = _fit(d, booking.package or "Adventure Ride", 440, 28, bold=False, min_size=18)
    d.text((350, 225), sub, font=f, fill=INK)

    when = f"{slot.slot_date.strftime('%a, %d %b %Y')} | {slot.start_time.strftime('%I:%M %p').lstrip('0')}"
    d.ellipse([350, 291, 362, 303], fill=ACCENT)
    when, f = _fit(d, when, 430, 25, bold=False, min_size=16)
    d.text((375, 282), when, font=f, fill=INK)

    d.ellipse([350, 345, 362, 357], fill=ACCENT)
    place = activity.location or "Ralej, Khambhat"
    for i, line in enumerate(textwrap.wrap(place, 26)[:2]):
        d.text((375, 336 + i * 32), line, font=_font(25), fill=INK)

    tag = Image.new("RGBA", (150, 46), (0, 0, 0, 0))
    td = ImageDraw.Draw(tag)
    td.rounded_rectangle([0, 0, 149, 45], radius=10, outline=ACCENT, width=3)
    tf = _font(22, True)
    td.text(((150 - td.textlength("E-TICKET", font=tf)) / 2, 8), "E-TICKET", font=tf, fill=ACCENT)
    tag = tag.rotate(90, expand=True)
    img.paste(tag, (808, 170), tag)

    # ---- divider with ticket notches ----
    _dashed(d, 500)
    for y in (500, 1520):
        d.ellipse([30 - 24, y - 24, 30 + 24, y + 24], fill=NIGHT)
        d.ellipse([W - 30 - 24, y - 24, W - 30 + 24, y + 24], fill=NIGHT)

    # ---- middle: ticket count, pass, QR ----
    d.rounded_rectangle([60, 530, 840, 600], radius=24, fill=PINK)
    _center(d, f"{people} Ticket(s)", 548, _font(34, True), ACCENT)

    _center(d, "BOOKING CONFIRMATION", 636, _font(26, True), MUTED)
    _center(d, "RIDE PASS", 672, _font(66, True), INK)

    name, f = _fit(d, activity.title.upper(), 620, 28, min_size=18)
    pw = d.textlength(name, font=f) + 80
    d.rounded_rectangle([W / 2 - pw / 2, 770, W / 2 + pw / 2, 832], radius=10, fill=ACCENT)
    _center(d, name, 785, f, WHITE)

    qr = _qr_image(ticket_qr_value(booking.ticket_code))
    img.paste(qr, ((W - qr.width) // 2, 860))

    _center(d, f"TICKET CODE: {booking.ticket_code}", 1205, _font(36, True), INK)
    flyer, f = _fit(d, f"Flyer: {booking.customer_name}", 760, 28, bold=False, min_size=16)
    _center(d, flyer, 1256, f, INK)
    _center(d, f"Booking ID: UAS{booking.id}", 1298, _font(22), MUTED)

    d.rounded_rectangle([60, 1340, 840, 1396], radius=20, fill=PINK)
    _center(d, "Please report 20 minutes before your scheduled time.", 1355, _font(23, True), ACCENT)

    # ---- contact / venue ----
    d.line([(450, 1425), (450, 1495)], fill=LINE, width=2)
    _center(d, "Contact Support", 1425, _font(27, True), INK, cx=255)
    _center(d, "+91 90814 24343", 1465, _font(25), ACCENT, cx=255)
    _center(d, "Venue", 1425, _font(27, True), INK, cx=645)
    _center(d, "Ralej, Khambhat", 1465, _font(25), ACCENT, cx=645)

    # ---- price breakdown ----
    _dashed(d, 1520)
    y = price_top
    for label, value, bold in rows:
        d.text((75, y), label, font=_font(29, bold), fill=INK)
        _right(d, value, 825, y, _font(29, bold), ACCENT if bold else INK)
        y += 56
    d.rounded_rectangle([60, pill_top, 840, pill_top + 70], radius=20, fill=PINK)
    d.text((85, pill_top + 17), "Amount Paid", font=_font(31, True), fill=ACCENT)
    _right(d, _money(paid), 815, pill_top + 17, _font(31, True), ACCENT)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()