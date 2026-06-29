import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

# Initialize Firebase once
_db = None

def get_db():
    global _db
    if _db is None:
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS", "firebase_credentials.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # For local dev without credentials, use emulator
                firebase_admin.initialize_app()
        _db = firestore.client()
    return _db


# ---------- Tasks ----------

def create_task(task_data: dict) -> dict:
    db = get_db()
    task_data["created_at"] = datetime.utcnow().isoformat()
    ref = db.collection("tasks").document()
    task_data["id"] = ref.id
    ref.set(task_data)
    return task_data


def get_task(task_id: str) -> dict | None:
    db = get_db()
    doc = db.collection("tasks").document(task_id).get()
    return doc.to_dict() if doc.exists else None


def get_user_tasks(user_id: str) -> list:
    db = get_db()
    docs = db.collection("tasks").where("user_id", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


def update_task(task_id: str, updates: dict) -> dict:
    db = get_db()
    ref = db.collection("tasks").document(task_id)
    ref.update(updates)
    return ref.get().to_dict()


def delete_task(task_id: str):
    db = get_db()
    db.collection("tasks").document(task_id).delete()


# ---------- User Patterns (RAG memory) ----------

def save_user_pattern(user_id: str, pattern: dict):
    db = get_db()
    db.collection("user_patterns").document(user_id).set(pattern, merge=True)


def get_user_pattern(user_id: str) -> dict:
    db = get_db()
    doc = db.collection("user_patterns").document(user_id).get()
    return doc.to_dict() if doc.exists else {}
