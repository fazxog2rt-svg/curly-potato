from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class DailyStudyTime(BaseModel):
    day: str  # e.g., "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
    date: str  # YYYY-MM-DD
    minutes: int


class SubjectAccuracy(BaseModel):
    subject: str
    accuracy_percentage: float
    total_quizzes: int


class WeakTopic(BaseModel):
    topic: str
    subject: str
    failure_count: int


class AnalyticsOverviewResponse(BaseModel):
    total_study_minutes: int
    total_sessions_count: int
    average_quiz_score: float
    quizzes_taken_count: int
    cards_due_for_review: int
    total_cards_count: int
    study_goals_active: int
    study_goals_completed: int
    weekly_study_trends: List[DailyStudyTime]
    accuracy_by_subject: List[SubjectAccuracy]
    weak_topics: List[WeakTopic]
    consistency_score: int  # 0-100 percentage based on active study days
    recommendations: List[str]
