import os
import json
import time
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
MODEL = "gemini-2.0-flash-lite"


def _generate(prompt: str, retries: int = 2) -> str:
    for attempt in range(retries):
        try:
            response = client.models.generate_content(model=MODEL, contents=prompt)
            return response.text.strip()
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                if attempt < retries - 1:
                    time.sleep(5)
                    continue
                raise Exception("Gemini API rate limit exceeded. You are on the free tier — wait a minute and try again, or upgrade your plan.")
            raise e
    return ""


def decompose_task(task_title: str, estimated_hours: float, deadline: str) -> list:
    prompt = f"""Break this task into 4-6 actionable subtasks.

Task: {task_title}
Total estimated time: {estimated_hours} hours
Deadline: {deadline}

Return ONLY a JSON array. No markdown, no explanation.
[{{"title": "subtask name", "estimated_time": 1.5, "dependency": null}}]"""
    try:
        text = _generate(prompt).replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"AI decompose error: {e}")
        return [
            {"title": f"Plan {task_title}", "estimated_time": round(estimated_hours * 0.2, 1), "dependency": None},
            {"title": f"Execute {task_title}", "estimated_time": round(estimated_hours * 0.5, 1), "dependency": None},
            {"title": "Review and test", "estimated_time": round(estimated_hours * 0.2, 1), "dependency": None},
            {"title": f"Submit {task_title}", "estimated_time": round(estimated_hours * 0.1, 1), "dependency": None},
        ]


def generate_schedule(tasks: list, available_slots: list) -> list:
    task_summary = json.dumps([{
        "title": t.get("title"), "deadline": t.get("deadline"),
        "estimated_hours": t.get("estimated_hours"),
        "risk_level": t.get("risk_level", "SAFE"),
        "progress": t.get("progress", 0)
    } for t in tasks], indent=2)

    prompt = f"""Create a work schedule. Prioritize CRITICAL tasks first.
Tasks: {task_summary}
Available slots: {json.dumps(available_slots, indent=2)}
Return ONLY JSON array. No markdown.
[{{"task_title":"name","start_time":"2024-01-15T19:00:00","end_time":"2024-01-15T21:00:00","duration_hours":2.0}}]"""
    try:
        text = _generate(prompt).replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"AI schedule error: {e}")
        return []


def generate_recovery_plan(missed_task: dict, remaining_tasks: list) -> str:
    prompt = f"""User missed this work session:
Task: {missed_task.get("title")}, Progress: {missed_task.get("progress", 0)}%, Deadline: {missed_task.get("deadline")}
Give a short motivating recovery plan with 2-3 time blocks for tomorrow. Max 4 sentences."""
    try:
        return _generate(prompt)
    except:
        return "You missed a session. Reschedule for tomorrow 7-9 AM and 7-9 PM to catch up."


def generate_smart_reminder(task: dict, user_patterns: dict) -> str:
    prompt = f"""Write a 2-3 sentence motivating reminder.
Task: {task.get("title")}, Deadline: {task.get("deadline")},
Risk: {task.get("risk_level")} ({task.get("risk_score")}%), Progress: {task.get("progress", 0)}%
Be specific about what to do NOW."""
    try:
        return _generate(prompt)
    except:
        return f"Your task '{task.get('title')}' needs attention. Risk is {task.get('risk_level')}. Start now!"


def chat_with_ai(message: str, context: dict) -> str:
    tasks_summary = json.dumps(context.get("tasks", [])[:3], indent=2)
    prompt = f"""You are DeadlineGuardian AI, a productivity assistant. Be concise.
User tasks: {tasks_summary}
User: {message}
Reply in 2-3 sentences max. Be helpful and action-oriented."""
    try:
        return _generate(prompt)
    except Exception as e:
        err = str(e)
        if "rate limit" in err.lower() or "429" in err:
            return "⏳ Gemini free tier rate limit hit. Please wait 1 minute and try again. This happens because Gemini free tier allows only ~15 requests per minute."
        return f"Connection error: {err}"