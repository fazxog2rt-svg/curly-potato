from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    preferred_language: Optional[str] = "id"
    preferred_difficulty: Optional[str] = "intermediate"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_difficulty: Optional[str] = None
    memory_enabled: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    preferred_language: str
    preferred_difficulty: str
    memory_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    picture: Optional[str] = None

