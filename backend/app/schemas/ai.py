from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessageItem(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessageItem]
    conversation_id: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000
    style: Optional[str] = "step_by_step"  # step_by_step, practical, analogy, exercise
    difficulty: Optional[str] = "intermediate"  # beginner, intermediate, advanced
    material_id: Optional[str] = None  # optional grounding in specific document
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    content: str
    conversation_id: str
    message_id: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    status: Optional[str] = "active"


class AskDocumentRequest(BaseModel):
    question: str
    model: Optional[str] = None


class MindMapRequest(BaseModel):
    content: str = Field(..., description="Topik atau teks materi yang ingin divisualisasikan")
    model: Optional[str] = None


class MindMapResponse(BaseModel):
    mermaid_code: str
    model: str


class CheatSheetRequest(BaseModel):
    content: str = Field(..., description="Teks materi pembelajaran untuk dibuat rangkuman ujian")
    subject: Optional[str] = "Umum"
    model: Optional[str] = None


class CheatSheetResponse(BaseModel):
    cheatsheet_markdown: str
    model: str


class MotivationRequest(BaseModel):
    category: Optional[str] = "islamic" # islamic, science_leaders, philosophy, general
    context: Optional[str] = None # misal: "sedang belajar matematika sulit", "lelah", "persiapan ujian"
    model: Optional[str] = None


class MotivationResponse(BaseModel):
    quote: str
    source: str
    category_label: str
    reflection: str
    category: str

