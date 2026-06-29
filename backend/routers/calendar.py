from fastapi import APIRouter
from pydantic import BaseModel
from services import calendar_service

router = APIRouter()


class EventCreate(BaseModel):
    title: str
    start_time: str
    end_time: str
    description: str = ""


@router.post("/event")
def create_event(body: EventCreate):
    result = calendar_service.create_calendar_event(
        body.title, body.start_time, body.end_time, body.description
    )
    return result


@router.get("/slots")
def get_free_slots(date_from: str, date_to: str):
    slots = calendar_service.get_free_slots(date_from, date_to)
    return {"slots": slots}
