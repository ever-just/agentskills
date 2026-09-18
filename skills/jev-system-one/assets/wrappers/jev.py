"""One-file Jev wrapper. Copy into the product repo. Questions and thresholds
live in a sibling constants file (or JSON) so humans can review them.

  pip install typesafe-sdk
  export TYPESAFE_API_KEY=...
"""
from __future__ import annotations

import os
from typing import Any

from typesafe_sdk import TypeSafeClient

_CLIENT: TypeSafeClient | None = None
FLAG = os.environ.get("JEV_ENABLED", "0") == "1"


def client() -> TypeSafeClient:
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = TypeSafeClient()  # reads TYPESAFE_API_KEY; default model jev-latest
    return _CLIENT


def jev(state: Any, questions: dict) -> dict:
    """Typed answers or {} on failure. Callers own fail-open vs fail-closed."""
    if not FLAG or not os.environ.get("TYPESAFE_API_KEY"):
        return {}
    try:
        return client().system_one(state=state, questions=questions).answers
    except Exception:
        return {}
