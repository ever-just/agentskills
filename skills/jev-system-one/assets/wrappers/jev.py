"""One-file Jev wrapper. Copy into the product repo. Questions and thresholds
live in a sibling constants file (or JSON) so humans can review them.

  pip install typesafe-sdk
  export TYPESAFE_API_KEY=...
  export JEV_ENABLED=1

Returns a dict: {"answers": {...}, "model": "jev-x.y.z", "usage": {...},
"fallback": None} on success; {"answers": {}, "model": None, "usage": None,
"fallback": "inert"|"timeout"|"<ErrorType>"} otherwise. Callers own fail-open
vs fail-closed and can stamp model/fallback into telemetry (04).
"""
from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from typesafe_sdk import TypeSafeClient

FLAG = os.environ.get("JEV_ENABLED", "0") == "1"
_CLIENT: TypeSafeClient | None = None
_POOL = ThreadPoolExecutor(max_workers=4)


def client() -> TypeSafeClient:
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = TypeSafeClient()  # reads TYPESAFE_API_KEY; default jev-latest
    return _CLIENT


def jev(state: Any, questions: dict, timeout_s: float | None = None) -> dict:
    """Typed answers or a fallback marker. 04 budgets: ~800ms-2s inline, ~45s offline."""
    empty = {"answers": {}, "model": None, "usage": None}
    if not FLAG or not os.environ.get("TYPESAFE_API_KEY"):
        return {**empty, "fallback": "inert"}
    try:
        if timeout_s:
            resp = _POOL.submit(
                client().system_one, state=state, questions=questions
            ).result(timeout_s)
        else:
            resp = client().system_one(state=state, questions=questions)
        return {"answers": resp.answers, "model": getattr(resp, "model", None),
                "usage": getattr(resp, "usage", None), "fallback": None}
    except TimeoutError:
        return {**empty, "fallback": "timeout"}
    except Exception as e:
        return {**empty, "fallback": type(e).__name__}
