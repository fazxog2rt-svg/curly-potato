from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class QuizGenerateRequest(BaseModel):
    subject: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    difficulty: Optional[str] = "intermediate"
    question_count: Optional[int] = Field(5, ge=1, le=20)
    time_limit_minutes: Optional[int] = None
    material_id: Optional[str] = None
    model: Optional[str] = None


class QuizQuestionPublic(BaseModel):
    id: str
    order_index: int
    question_type: str
    question_text: str
    options: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


class QuizPublicResponse(BaseModel):
    id: str
    subject: str
    topic: str
    difficulty: str
    question_count: int
    time_limit_minutes: Optional[int] = None
    created_at: datetime
    questions: List[QuizQuestionPublic]

    model_config = ConfigDict(from_attributes=True)


class QuizAnswerItem(BaseModel):
    question_id: str
    user_answer: str


class QuizSubmitRequest(BaseModel):
    answers: List[QuizAnswerItem]


class QuizAnswerReview(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    ai_feedback: Optional[str] = None


class QuizAttemptResponse(BaseModel):
    id: str
    quiz_id: str
    score: float
    max_score: float
    percentage: float
    total_questions: int
    correct_count: int
    completed_at: datetime
    answers: List[QuizAnswerReview]

    model_config = ConfigDict(from_attributes=True)
