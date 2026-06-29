from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"


class SubTask(BaseModel):
    id: Optional[str] = None
    title: str
    estimated_time: float  # hours
    deadline: Optional[str] = None
    dependency: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING


class Task(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    deadline: str          # ISO datetime string
    priority: Priority = Priority.MEDIUM
    estimated_hours: float
    category: str = "General"
    difficulty: Difficulty = Difficulty.MEDIUM
    progress: float = 0.0  # 0-100
    status: TaskStatus = TaskStatus.PENDING
    subtasks: List[SubTask] = []
    risk_score: float = 0.0
    risk_level: str = "SAFE"
    created_at: Optional[str] = None


class TaskCreate(BaseModel):
    user_id: str
    title: str
    deadline: str
    priority: Priority = Priority.MEDIUM
    estimated_hours: float
    category: str = "General"
    difficulty: Difficulty = Difficulty.MEDIUM


class TaskUpdate(BaseModel):
    progress: Optional[float] = None
    status: Optional[TaskStatus] = None
    title: Optional[str] = None


class RiskResult(BaseModel):
    task_id: str
    risk_score: float
    risk_level: str
    reason: str


class ScheduleBlock(BaseModel):
    task_id: str
    task_title: str
    start_time: str
    end_time: str
    duration_hours: float
