def require_fields(data, fields):
    """Return a list of missing field names."""
    return [f for f in fields if not (data or {}).get(f)]
