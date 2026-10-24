from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    token_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: Optional[str] = "Percakapan Baru"
    model: Optional[str] = "claude-sonnet-4.5"


class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]] = []

    model_config = ConfigDict(from_attributes=True)
