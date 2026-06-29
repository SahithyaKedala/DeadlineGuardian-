from fastapi import APIRouter, HTTPException
from models.task import TaskCreate, TaskUpdate
from services import firebase_service, gemini_service, risk_engine
from datetime import datetime, timezone

router = APIRouter()


def _check_and_handle_deadline(task: dict) -> dict | None:
    """Returns None if task should be deleted (missed deadline), else returns task with status updated."""
    deadline_str = task.get("deadline")
    status = task.get("status", "")
    if not deadline_str or status == "completed":
        return task

    try:
        deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
    except Exception:
        return task

    now = datetime.now(timezone.utc)
    if now > deadline:
        # Deadline passed and not completed → mark missed then delete
        firebase_service.update_task(task["id"], {"status": "missed"})
        firebase_service.delete_task(task["id"])
        return None  # Signal deletion

    return task


@router.post("/")
def create_task(task: TaskCreate):
    task_data = task.model_dump()

    # Calculate initial risk
    risk = risk_engine.calculate_risk(task_data)
    task_data.update(risk)

    # Save to Firestore
    created = firebase_service.create_task(task_data)

    # Decompose into subtasks via Gemini
    subtasks = gemini_service.decompose_task(
        task.title, task.estimated_hours, task.deadline
    )
    subtasks_with_status = [
        {**s, "id": f"sub_{i}", "status": "pending"}
        for i, s in enumerate(subtasks)
    ]

    # Update with subtasks
    updated = firebase_service.update_task(
        created["id"], {"subtasks": subtasks_with_status}
    )
    return updated


@router.get("/{task_id}")
def get_task(task_id: str):
    task = firebase_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/user/{user_id}")
def get_user_tasks(user_id: str):
    tasks = firebase_service.get_user_tasks(user_id)

    updated_tasks = []
    for task in tasks:
        # Skip already-completed tasks from deadline check
        processed = _check_and_handle_deadline(task)
        if processed is None:
            # Task was missed & deleted — skip it
            continue

        # Recalculate risk
        risk = risk_engine.calculate_risk(processed)
        processed.update(risk)
        firebase_service.update_task(processed["id"], risk)
        updated_tasks.append(processed)

    # Sort: completed last, then by risk score descending
    updated_tasks.sort(key=lambda t: (t.get("status") == "completed", -t.get("risk_score", 0)))
    return updated_tasks


@router.patch("/{task_id}")
def update_task(task_id: str, updates: TaskUpdate):
    task = firebase_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    task.update(update_data)

    # Auto-complete when progress hits 100
    if update_data.get("progress", 0) >= 100:
        update_data["progress"] = 100
        update_data["status"] = "completed"
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

    # Recalculate risk after update
    risk = risk_engine.calculate_risk(task)
    update_data.update(risk)

    return firebase_service.update_task(task_id, update_data)


@router.delete("/{task_id}")
def delete_task(task_id: str):
    firebase_service.delete_task(task_id)
    return {"message": "Task deleted"}


@router.post("/{task_id}/subtask/{subtask_id}/complete")
def complete_subtask(task_id: str, subtask_id: str):
    task = firebase_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtasks = task.get("subtasks", [])
    for sub in subtasks:
        if sub.get("id") == subtask_id:
            sub["status"] = "completed"

    completed = sum(1 for s in subtasks if s.get("status") == "completed")
    progress = (completed / len(subtasks) * 100) if subtasks else 0

    updates = {"subtasks": subtasks, "progress": round(progress, 1)}
    risk = risk_engine.calculate_risk({**task, **updates})
    updates.update(risk)

    return firebase_service.update_task(task_id, updates)


@router.post("/{task_id}/miss")
def mark_task_missed(task_id: str):
    """User missed a planned session - trigger recovery planning."""
    task = firebase_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    recovery = gemini_service.generate_recovery_plan(task, [])
    firebase_service.update_task(task_id, {"status": "in_progress"})

    return {"recovery_plan": recovery, "task": task}
