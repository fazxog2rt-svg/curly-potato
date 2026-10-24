from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"


class SubjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: Optional[int] = None
    content: str

    model_config = ConfigDict(from_attributes=True)


class MaterialResponse(BaseModel):
    id: str
    subject_id: Optional[str] = None
    title: str
    filename: str
    file_type: str
    file_size: int
    status: str
    summary: Optional[str] = None
    key_concepts: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteCreate(BaseModel):
    title: str
    content: str
    material_id: Optional[str] = None
    tags: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    material_id: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
