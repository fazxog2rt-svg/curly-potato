import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(150), nullable=False)
    subject = Column(String(100), nullable=False, default="Umum", index=True)
    description = Column(Text, nullable=True)
    difficulty = Column(String(50), default="intermediate") # beginner, intermediate, advanced
    # List of prerequisite node IDs (JSON array)
    prerequisites = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user_states = relationship("UserKnowledgeState", back_populates="node", cascade="all, delete-orphan")


class UserKnowledgeState(Base):
    __tablename__ = "user_knowledge_states"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String(36), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)

    # Bayesian Knowledge Tracing Parameters for this concept
    p_know = Column(Float, default=0.15)      # Current mastery belief P(L_t)
    p_transit = Column(Float, default=0.15)   # P(T)
    p_slip = Column(Float, default=0.10)      # P(S)
    p_guess = Column(Float, default=0.20)     # P(G)

    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    node = relationship("KnowledgeNode", back_populates="user_states")
    user = relationship("User")
