from datetime import datetime, timezone
from models.task import Difficulty


DIFFICULTY_WEIGHT = {
    "easy": 10,
    "medium": 20,
    "hard": 35,
}

PRIORITY_WEIGHT = {
    "low": 5,
    "medium": 10,
    "high": 20,
}


def calculate_risk(task: dict) -> dict:
    """
    Risk Score = Deadline Urgency + Workload Pressure + Difficulty + Priority - Progress
    Returns risk_score (0-100), risk_level, and reason string.
    """
    now = datetime.now(timezone.utc)

    # Parse deadline
    try:
        deadline_str = task.get("deadline", "")
        if deadline_str.endswith("Z"):
            deadline_str = deadline_str[:-1] + "+00:00"
        deadline = datetime.fromisoformat(deadline_str)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
    except Exception:
        deadline = now

    hours_left = max((deadline - now).total_seconds() / 3600, 0)
    estimated_hours = task.get("estimated_hours", 4)
    progress = task.get("progress", 0)  # 0-100

    # --- Deadline Urgency (0-35) ---
    remaining_work_hours = estimated_hours * (1 - progress / 100)
    if hours_left <= 0:
        urgency = 35
    elif remaining_work_hours >= hours_left:
        urgency = 35
    else:
        ratio = remaining_work_hours / max(hours_left, 1)
        urgency = min(int(ratio * 35), 35)

    # --- Workload Pressure (0-20) ---
    if hours_left < 6:
        workload = 20
    elif hours_left < 24:
        workload = 15
    elif hours_left < 72:
        workload = 10
    else:
        workload = 5

    # --- Difficulty (0-35) ---
    difficulty = task.get("difficulty", "medium")
    difficulty_score = DIFFICULTY_WEIGHT.get(difficulty, 20)

    # --- Priority boost (0-20) ---
    priority = task.get("priority", "medium")
    priority_score = PRIORITY_WEIGHT.get(priority, 10)

    # --- Progress reduction ---
    progress_reduction = int(progress * 0.3)

    raw_score = urgency + workload + difficulty_score + priority_score - progress_reduction
    risk_score = max(0, min(100, raw_score))

    # --- Risk Level ---
    if risk_score <= 40:
        risk_level = "SAFE"
    elif risk_score <= 70:
        risk_level = "WARNING"
    else:
        risk_level = "CRITICAL"

    # --- Reason ---
    reasons = []
    if urgency >= 25:
        reasons.append("deadline is very close")
    if progress < 30:
        reasons.append(f"only {int(progress)}% completed")
    if difficulty == "hard":
        reasons.append("task is marked as hard")
    if workload >= 15:
        reasons.append("less than 24 hours left")

    reason = (
        f"Risk is {risk_level.lower()} because "
        + (", ".join(reasons) if reasons else "task is on track")
        + "."
    )

    return {
        "risk_score": round(risk_score, 1),
        "risk_level": risk_level,
        "reason": reason,
    }
