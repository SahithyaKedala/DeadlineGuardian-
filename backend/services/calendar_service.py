from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import json
from datetime import datetime, timedelta, timezone

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CREDENTIALS_FILE = os.getenv("GOOGLE_CALENDAR_CREDENTIALS", "credentials.json")
TOKEN_FILE = "token.json"


def get_calendar_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


def create_calendar_event(title: str, start_time: str, end_time: str, description: str = "") -> dict:
    """Create a Google Calendar event."""
    try:
        service = get_calendar_service()
        event = {
            "summary": f"🎯 {title}",
            "description": description,
            "start": {"dateTime": start_time, "timeZone": "UTC"},
            "end": {"dateTime": end_time, "timeZone": "UTC"},
            "colorId": "11",  # Tomato red for urgency
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 15},
                    {"method": "popup", "minutes": 5},
                ],
            },
        }
        created = service.events().insert(calendarId="primary", body=event).execute()
        return {"event_id": created["id"], "link": created.get("htmlLink", "")}
    except Exception as e:
        print(f"Calendar error: {e}")
        return {"error": str(e)}


def get_free_slots(date_from: str, date_to: str) -> list:
    """Get free time slots from Google Calendar."""
    try:
        service = get_calendar_service()
        body = {
            "timeMin": date_from,
            "timeMax": date_to,
            "items": [{"id": "primary"}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result["calendars"]["primary"]["busy"]

        # Generate 2-hour free slots avoiding busy times
        free_slots = []
        current = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
        end = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
        busy_ranges = [
            (
                datetime.fromisoformat(b["start"].replace("Z", "+00:00")),
                datetime.fromisoformat(b["end"].replace("Z", "+00:00")),
            )
            for b in busy
        ]

        while current < end:
            slot_end = current + timedelta(hours=2)
            is_free = all(
                slot_end <= b_start or current >= b_end
                for b_start, b_end in busy_ranges
            )
            hour = current.hour
            if is_free and 6 <= hour <= 22:
                free_slots.append({
                    "start": current.isoformat(),
                    "end": slot_end.isoformat(),
                })
            current += timedelta(hours=1)

        return free_slots
    except Exception as e:
        print(f"Free slots error: {e}")
        # Return default slots if Calendar not connected
        now = datetime.now(timezone.utc)
        return [
            {
                "start": (now.replace(hour=19, minute=0, second=0)).isoformat(),
                "end": (now.replace(hour=21, minute=0, second=0)).isoformat(),
            },
            {
                "start": (now.replace(hour=6, minute=0, second=0) + timedelta(days=1)).isoformat(),
                "end": (now.replace(hour=8, minute=0, second=0) + timedelta(days=1)).isoformat(),
            },
        ]
