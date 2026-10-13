"""Tiny in-memory rate limiter (no extra package). Counts per client IP, per worker process."""
import time
from collections import defaultdict, deque
from functools import wraps
from flask import jsonify, request, current_app

_hits = defaultdict(deque)


def rate_limit(name, max_calls, per_seconds):
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            if current_app.config.get("TESTING"):
                return fn(*a, **kw)
            # behind Render's proxy the real client IP is the first X-Forwarded-For entry
            ip = (request.headers.get("X-Forwarded-For", request.remote_addr or "") or "").split(",")[0].strip()
            q = _hits[(name, ip)]
            now = time.time()
            while q and q[0] < now - per_seconds:
                q.popleft()
            if len(q) >= max_calls:
                return jsonify(error="Too many attempts. Please wait a few minutes and try again."), 429
            q.append(now)
            return fn(*a, **kw)
        return wrapper
    return deco