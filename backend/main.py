from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import tasks, ai, calendar, auth

app = FastAPI(title="DeadlineGuardian AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])
app.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])

@app.get("/")
def root():
    return {"message": "DeadlineGuardian AI is running"}

@app.get("/health")
def health():
    return {"status": "ok"}