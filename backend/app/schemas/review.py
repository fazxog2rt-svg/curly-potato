from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ReviewCardCreate(BaseModel):
    subject: str
    topic: Optional[str] = None
    question: str
    answer: str
    explanation: Optional[str] = None
    difficulty_level: Optional[str] = "medium"


class ReviewCardResponse(BaseModel):
    id: str
    subject: str
    topic: Optional[str] = None
    question: str
    answer: str
    explanation: Optional[str] = None
    difficulty_level: str
    repetitions: int
    interval_days: int
    ease_factor: float
    next_review_at: datetime
    last_reviewed_at: Optional[datetime] = None
    failure_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewAnswerRequest(BaseModel):
    rating: int = Field(..., ge=0, le=5)


class ReviewAnswerResponse(BaseModel):
    card_id: str
    rating: int
    repetitions: int
    interval_days: int
    ease_factor: float
    next_review_at: datetime
    message: str
