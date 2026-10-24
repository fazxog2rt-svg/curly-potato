import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class CATQuestion(Base):
    __tablename__ = "cat_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    subject = Column(String(100), nullable=False, default="Umum", index=True)
    topic = Column(String(150), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False) # list of 4-5 options
    correct_answer = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=True)

    # IRT 3PL Parameters
    a_param = Column(Float, default=1.0)  # Discrimination (0.5 to 2.5)
    b_param = Column(Float, default=0.0)  # Difficulty (-3.0 to +3.0)
    c_param = Column(Float, default=0.20) # Pseudo-guessing (~0.20)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CATSession(Base):
    __tablename__ = "cat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(100), nullable=False)
    current_theta = Column(Float, default=0.0) # Latent ability
    scaled_score = Column(Integer, default=600)  # SAT/UTBK standardized score (200-1000)
    proficiency_level = Column(String(50), default="Proficient")
    total_administered = Column(Integer, default=0)
    is_finished = Column(Boolean, default=False)

    # History of items: [{question_id, response, is_correct, theta_after, a, b, c}]
    responses_history = Column(JSON, default=list)

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
