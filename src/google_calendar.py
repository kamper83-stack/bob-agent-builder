"""
google_calendar.py
------------------
Minimal Google Calendar API client for the agent runner.

Authentication flow (OAuth 2.0 — installed-app / service-account):
  - First run: opens browser for user consent and saves token.json
  - Subsequent runs: refreshes the token automatically

Required env vars (see src/.env.example):
    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    GOOGLE_CALENDAR_ID   (defaults to "primary")

Optional:
    GOOGLE_TOKEN_PATH    (defaults to src/token.json)
    GOOGLE_CREDENTIALS_PATH (path to credentials.json downloaded from Google Cloud Console)

Setup (one-time):
    1. Go to https://console.cloud.google.com/
    2. Create a project → Enable "Google Calendar API"
    3. Create OAuth 2.0 credentials (Desktop app type)
    4. Download credentials.json → place in src/
    5. Run: python3 src/google_calendar.py  (authorises and saves token.json)
"""

from __future__ import annotations

import os
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ── Optional import — only needed at runtime, not at import time ──────────────
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build as google_build
    _GOOGLE_AVAILABLE = True
except ImportError:
    _GOOGLE_AVAILABLE = False

SCOPES = ["https://www.googleapis.com/auth/calendar"]

_DEFAULT_CREDENTIALS = Path(__file__).parent / "credentials.json"
_DEFAULT_TOKEN = Path(__file__).parent / "token.json"


def _get_service() -> Any:
    """Return an authenticated Google Calendar service object.

    Raises:
        ImportError: If google-api-python-client / google-auth-oauthlib are not installed.
        FileNotFoundError: If credentials.json is missing.
    """
    if not _GOOGLE_AVAILABLE:
        raise ImportError(
            "Google Calendar dependencies not installed. "
            "Run: pip install google-api-python-client google-auth-oauthlib google-auth-httplib2"
        )

    credentials_path = Path(os.getenv("GOOGLE_CREDENTIALS_PATH", str(_DEFAULT_CREDENTIALS)))
    token_path = Path(os.getenv("GOOGLE_TOKEN_PATH", str(_DEFAULT_TOKEN)))

    if not credentials_path.exists():
        raise FileNotFoundError(
            f"credentials.json not found at {credentials_path}. "
            "Download it from Google Cloud Console → APIs & Services → Credentials."
        )

    creds: Credentials | None = None

    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            creds = flow.run_local_server(port=8080)
        token_path.write_text(creds.to_json())

    return google_build("calendar", "v3", credentials=creds)


def create_event(
    summary: str,
    start: datetime,
    end: datetime,
    description: str = "",
    attendees: list[str] | None = None,
    calendar_id: str | None = None,
) -> dict[str, Any]:
    """Create a Google Calendar event.

    Args:
        summary:     Event title.
        start:       Start datetime (timezone-aware recommended).
        end:         End datetime.
        description: Optional event body text.
        attendees:   List of email addresses to invite.
        calendar_id: Calendar to add the event to (defaults to env var or "primary").

    Returns:
        The created event resource dict (includes ``htmlLink``, ``id``, etc.).
    """
    cal_id = calendar_id or os.getenv("GOOGLE_CALENDAR_ID", "primary")
    service = _get_service()

    def _dt(dt: datetime) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    body: dict[str, Any] = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": _dt(start), "timeZone": "UTC"},
        "end": {"dateTime": _dt(end), "timeZone": "UTC"},
    }
    if attendees:
        body["attendees"] = [{"email": e} for e in attendees]

    event = service.events().insert(calendarId=cal_id, body=body).execute()
    return event  # type: ignore[return-value]


def list_upcoming_events(
    max_results: int = 10,
    calendar_id: str | None = None,
) -> list[dict[str, Any]]:
    """Return the next *max_results* events from now.

    Args:
        max_results: Maximum number of events to return (1–2500).
        calendar_id: Calendar to query (defaults to env var or "primary").

    Returns:
        List of event resource dicts.
    """
    cal_id = calendar_id or os.getenv("GOOGLE_CALENDAR_ID", "primary")
    service = _get_service()

    now = datetime.now(timezone.utc).isoformat()
    result = (
        service.events()
        .list(
            calendarId=cal_id,
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return result.get("items", [])  # type: ignore[return-value]


def delete_event(event_id: str, calendar_id: str | None = None) -> None:
    """Delete an event by ID.

    Args:
        event_id:    The event ``id`` returned by :func:`create_event`.
        calendar_id: Calendar that contains the event.
    """
    cal_id = calendar_id or os.getenv("GOOGLE_CALENDAR_ID", "primary")
    service = _get_service()
    service.events().delete(calendarId=cal_id, eventId=event_id).execute()


# ── CLI helper — run once to authorise ───────────────────────────────────────
if __name__ == "__main__":
    print("Authorising Google Calendar access…")
    svc = _get_service()
    print("✓ Authorised. token.json saved.")
    events = list_upcoming_events(max_results=3)
    print(f"Next {len(events)} event(s):")
    for e in events:
        start = e.get("start", {}).get("dateTime", e.get("start", {}).get("date", "?"))
        print(f"  {start}  {e.get('summary', '(no title)')}")
