from fastapi import APIRouter
from pydantic import BaseModel
from services import gemini_service, firebase_service, calendar_service
from datetime import datetime, timezone, timedelta

router = APIRouter()


class ChatMessage(BaseModel):
    user_id: str
    message: str


class ScheduleRequest(BaseModel):
    user_id: str


class ReminderRequest(BaseModel):
    task_id: str
    user_id: str


@router.post("/chat")
def chat(body: ChatMessage):
    tasks = firebase_service.get_user_tasks(body.user_id)
    context = {"tasks": tasks}
    try:
        reply = gemini_service.chat_with_ai(body.message, context)
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"⏳ AI is temporarily unavailable (rate limit). Wait 60 seconds and try again.\n\nError: {str(e)[:100]}"}


@router.post("/schedule")
def generate_schedule(body: ScheduleRequest):
    tasks = firebase_service.get_user_tasks(body.user_id)
    active_tasks = [t for t in tasks if t.get("status") != "completed"]

    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=2)

    free_slots = calendar_service.get_free_slots(
        now.isoformat().replace("+00:00", "Z"),
        tomorrow.isoformat().replace("+00:00", "Z"),
    )

    schedule = gemini_service.generate_schedule(active_tasks, free_slots)

    # Create calendar events for each block
    events_created = []
    for block in schedule:
        event = calendar_service.create_calendar_event(
            title=block.get("task_title", "Work Block"),
            start_time=block.get("start_time"),
            end_time=block.get("end_time"),
            description=f"DeadlineGuardian scheduled work session",
        )
        events_created.append({**block, "calendar_event": event})

    return {"schedule": events_created, "total_blocks": len(events_created)}


@router.post("/reminder")
def get_smart_reminder(body: ReminderRequest):
    task = firebase_service.get_task(body.task_id)
    if not task:
        return {"error": "Task not found"}

    patterns = firebase_service.get_user_pattern(body.user_id)
    reminder = gemini_service.generate_smart_reminder(task, patterns)
    return {"reminder": reminder, "task_title": task.get("title")}


@router.get("/dashboard/{user_id}")
def get_dashboard_data(user_id: str):
    tasks = firebase_service.get_user_tasks(user_id)

    total = len(tasks)
    critical = sum(1 for t in tasks if t.get("risk_level") == "CRITICAL" and t.get("status") != "completed")
    warning = sum(1 for t in tasks if t.get("risk_level") == "WARNING" and t.get("status") != "completed")
    # Count as completed if status == "completed" OR progress >= 100
    completed = sum(1 for t in tasks if t.get("status") == "completed" or t.get("progress", 0) >= 100)

    avg_progress = (
        sum(t.get("progress", 0) for t in tasks) / total if total > 0 else 0
    )

    # Exclude completed tasks from high-risk list
    active_tasks = [t for t in tasks if t.get("status") != "completed" and t.get("progress", 0) < 100]
    top_risks = sorted(active_tasks, key=lambda t: t.get("risk_score", 0), reverse=True)[:3]

    return {
        "stats": {
            "total_tasks": total,
            "critical_tasks": critical,
            "warning_tasks": warning,
            "completed_tasks": completed,
            "avg_progress": round(avg_progress, 1),
        },
        "top_risk_tasks": top_risks,
        "all_tasks": tasks,
    }
