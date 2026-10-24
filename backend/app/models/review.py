import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReviewCard(Base):
    __tablename__ = "review_cards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(100), nullable=False)
    topic = Column(String(255), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    
    # SM-2 Spaced Repetition Parameters
    difficulty_level = Column(String(50), default="medium")  # easy, medium, hard
    repetitions = Column(Integer, default=0)
    interval_days = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)  # default SM-2 ease factor
    next_review_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    last_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    failure_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="review_cards")
    history = relationship("ReviewHistory", back_populates="card", cascade="all, delete-orphan", order_by="ReviewHistory.reviewed_at.desc()")


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    card_id = Column(String(36), ForeignKey("review_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 0 to 5 in SM-2 rating
    interval_before = Column(Integer, default=0)
    interval_after = Column(Integer, default=1)
    reviewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    card = relationship("ReviewCard", back_populates="history")
