from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    target_date: Optional[datetime] = None


class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: str
    progress_percentage: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskCreate(BaseModel):
    goal_id: Optional[str] = None
    title: str = Field(..., min_length=1)
    subject: Optional[str] = None
    duration_minutes: Optional[int] = 30
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: str
    goal_id: Optional[str] = None
    title: str
    subject: Optional[str] = None
    duration_minutes: int
    due_date: Optional[datetime] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AISuggestPlanRequest(BaseModel):
    subject: str
    goal_description: str
    days_available: Optional[int] = 7
    hours_per_day: Optional[float] = 2.0
    model: Optional[str] = None
