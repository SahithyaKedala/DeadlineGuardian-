from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class VerifyTokenRequest(BaseModel):
    token: str
    user_id: str
    email: str


@router.post("/verify")
def verify_token(body: VerifyTokenRequest):
    """
    Frontend sends Firebase ID token here.
    In production, verify with firebase_admin.auth.verify_id_token(token).
    For now we trust the frontend Firebase SDK.
    """
    return {
        "user_id": body.user_id,
        "email": body.email,
        "verified": True,
    }
