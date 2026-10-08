import re


def require_fields(data, fields):
    return [f for f in fields if not (data or {}).get(f)]


def clean_phone(raw):
    p = re.sub(r"[\s\-()]", "", str(raw or ""))
    if re.fullmatch(r"\+?\d{10,13}", p):
        return p
    return None


def valid_email(raw):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", str(raw or "")))


def valid_utr(raw):
    """UPI reference numbers (UTR) are 12 digits."""
    return bool(re.fullmatch(r"\d{12}", str(raw or "").strip()))