from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MemoryCreate(BaseModel):
    category: str = Field(..., pattern="^(preference|weakness|goal|topic_interest|habit)$")
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1)


class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    key: Optional[str] = None
    value: Optional[str] = None


class MemoryResponse(BaseModel):
    id: str
    category: str
    key: str
    value: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
