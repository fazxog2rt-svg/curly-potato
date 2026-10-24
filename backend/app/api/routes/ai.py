import time
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.models.material import LearningMaterial
from app.models.memory import UserMemory
from app.models.ai_log import AIUsageLog
from app.models.session import StudySession
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    ModelInfo,
    MindMapRequest,
    MindMapResponse,
    CheatSheetRequest,
    CheatSheetResponse,
    MotivationRequest,
    MotivationResponse,
)
from app.ai.guts_client import guts_client, GutsAIError
from app.ai.prompts import (
    get_tutor_system_prompt,
    MINDMAP_GENERATION_PROMPT,
    CHEATSHEET_GENERATION_PROMPT,
    MOTIVATION_GENERATION_PROMPT,
)
from app.services.document_service import document_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Tutor & Models"])


@router.get("/models", response_model=List[ModelInfo])
async def list_models(
    refresh: bool = Query(False, description="Paksa refresh daftar model dari server GutsAI"),
):
    models = await guts_client.list_models(force_refresh=refresh)
    return [
        ModelInfo(
            id=m["id"],
            name=m.get("name") or m["id"],
            provider=m.get("provider", "GutsAI"),
            status=m.get("status", "active"),
        )
        for m in models
    ]


@router.post("/chat", response_model=ChatResponse)
async def chat_tutor(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Fetch or create conversation
    conv = None
    if request.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()

    if not conv:
        # Generate initial title from first user message
        first_user_msg = next((m.content for m in request.messages if m.role == "user"), "Belajar Baru")
        title = first_user_msg[:40] + ("..." if len(first_user_msg) > 40 else "")
        conv = Conversation(
            user_id=current_user.id,
            title=title,
            model=request.model or settings.GUTSAI_DEFAULT_MODEL,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Gather Personal Memories if enabled
    memories_text = None
    if current_user.memory_enabled:
        user_mems = db.query(UserMemory).filter(UserMemory.user_id == current_user.id).all()
        if user_mems:
            memories_text = "\n".join([f"- [{m.category}] {m.key}: {m.value}" for m in user_mems])

    # 3. Gather Document Context if material_id is provided
    document_context = None
    if request.material_id:
        mat = db.query(LearningMaterial).filter(
            LearningMaterial.id == request.material_id,
            LearningMaterial.user_id == current_user.id,
        ).first()
        if mat and mat.chunks:
            # Get latest user question for chunk search
            last_user_query = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
            retrieved = document_service.search_chunks(mat.chunks, last_user_query, top_k=4)
            if retrieved:
                document_context = f"Dokumen: {mat.title}\n" + "\n\n".join(retrieved)

    # 4. Construct System Prompt
    system_prompt = get_tutor_system_prompt(
        difficulty=request.difficulty or current_user.preferred_difficulty,
        style=request.style or "step_by_step",
        language=current_user.preferred_language,
        personal_memories=memories_text,
        document_context=document_context,
    )

    api_messages = [{"role": "system", "content": system_prompt}]
    for m in request.messages:
        api_messages.append({"role": m.role, "content": m.content})

    # 5. Call GutsAI
    try:
        start_time = time.time()
        result = await guts_client.chat_completion(
            messages=api_messages,
            model=request.model,
            temperature=request.temperature or 0.7,
            max_tokens=request.max_tokens or 2000,
        )
        latency = (time.time() - start_time) * 1000

        # Save user message to DB
        last_user = next((m for m in reversed(request.messages) if m.role == "user"), None)
        if last_user:
            db.add(Message(conversation_id=conv.id, role="user", content=last_user.content))

        # Save assistant message to DB
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=result["content"],
            token_count=result["usage"]["completion_tokens"],
        )
        db.add(assistant_msg)

        # Log AI Usage
        usage_log = AIUsageLog(
            user_id=current_user.id,
            endpoint="/api/ai/chat",
            model=result["model"],
            prompt_tokens=result["usage"]["prompt_tokens"],
            completion_tokens=result["usage"]["completion_tokens"],
            total_tokens=result["usage"]["total_tokens"],
            latency_ms=latency,
            status_code=200,
        )
        db.add(usage_log)

        # Log active study session (e.g. 5 minutes per interactive exchange)
        study_session = StudySession(
            user_id=current_user.id,
            subject=request.style or "AI Tutor",
            duration_minutes=5,
            activity_type="tutor",
            notes=f"Sesi tanya jawab topik {conv.title}",
        )
        db.add(study_session)

        db.commit()
        db.refresh(assistant_msg)

        return ChatResponse(
            content=result["content"],
            conversation_id=conv.id,
            message_id=assistant_msg.id,
            model=result["model"],
            prompt_tokens=result["usage"]["prompt_tokens"],
            completion_tokens=result["usage"]["completion_tokens"],
            total_tokens=result["usage"]["total_tokens"],
            latency_ms=latency,
        )

    except GutsAIError as e:
        db.rollback()
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses jawaban tutor: {str(e)}",
        )


@router.post("/chat/stream")
async def chat_tutor_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Server-Sent Events (SSE) streaming endpoint for AI Tutor."""
    # 1. Fetch or create conversation
    conv = None
    if request.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()

    if not conv:
        first_user_msg = next((m.content for m in request.messages if m.role == "user"), "Belajar Baru")
        title = first_user_msg[:40] + ("..." if len(first_user_msg) > 40 else "")
        conv = Conversation(
            user_id=current_user.id,
            title=title,
            model=request.model or settings.GUTSAI_DEFAULT_MODEL,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Gather Personal Memories
    memories_text = None
    if current_user.memory_enabled:
        user_mems = db.query(UserMemory).filter(UserMemory.user_id == current_user.id).all()
        if user_mems:
            memories_text = "\n".join([f"- [{m.category}] {m.key}: {m.value}" for m in user_mems])

    # 3. Document Grounding
    document_context = None
    if request.material_id:
        mat = db.query(LearningMaterial).filter(
            LearningMaterial.id == request.material_id,
            LearningMaterial.user_id == current_user.id,
        ).first()
        if mat and mat.chunks:
            last_user_query = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
            retrieved = document_service.search_chunks(mat.chunks, last_user_query, top_k=4)
            if retrieved:
                document_context = f"Dokumen: {mat.title}\n" + "\n\n".join(retrieved)

    # 4. Construct System Prompt
    system_prompt = get_tutor_system_prompt(
        difficulty=request.difficulty or current_user.preferred_difficulty,
        style=request.style or "step_by_step",
        language=current_user.preferred_language,
        personal_memories=memories_text,
        document_context=document_context,
    )

    api_messages = [{"role": "system", "content": system_prompt}]
    for m in request.messages:
        api_messages.append({"role": m.role, "content": m.content})

    # Save user message
    last_user = next((m for m in reversed(request.messages) if m.role == "user"), None)
    if last_user:
        db.add(Message(conversation_id=conv.id, role="user", content=last_user.content))
        db.commit()

    conv_id = conv.id

    async def event_generator():
        yield f"data: {{\"conversation_id\": \"{conv_id}\"}}\n\n"
        full_content = []
        try:
            async for token in guts_client.chat_completion_stream(
                messages=api_messages,
                model=request.model,
                temperature=request.temperature or 0.7,
                max_tokens=request.max_tokens or 2500,
            ):
                full_content.append(token)
                # Escape json string safely
                token_data = {"delta": token}
                import json
                yield f"data: {json.dumps(token_data)}\n\n"
        except Exception as e:
            err_data = {"error": str(e)}
            import json
            yield f"data: {json.dumps(err_data)}\n\n"

        # Signal completion
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/mindmap", response_model=MindMapResponse)
async def generate_mindmap(
    request: MindMapRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate Mermaid.js mindmap diagram syntax from study content."""
    messages = [
        {"role": "system", "content": MINDMAP_GENERATION_PROMPT},
        {"role": "user", "content": f"Buatkan diagram mind map Mermaid untuk materi berikut:\n\n{request.content[:4000]}"},
    ]

    try:
        res = await guts_client.chat_completion(
            messages=messages,
            model=request.model,
            temperature=0.3,
            max_tokens=2000,
        )
        content = res["content"].strip()
        # Clean markdown fences if present
        if content.startswith("```mermaid"):
            content = content[10:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        return MindMapResponse(
            mermaid_code=content,
            model=res["model"],
        )
    except GutsAIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghasilkan mind map: {str(e)}")


@router.post("/cheatsheet", response_model=CheatSheetResponse)
async def generate_cheatsheet(
    request: CheatSheetRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a high-yield exam cheat sheet in structured Markdown."""
    messages = [
        {"role": "system", "content": CHEATSHEET_GENERATION_PROMPT},
        {
            "role": "user",
            "content": f"Mata Pelajaran: {request.subject}\nMateri:\n{request.content[:6000]}\n\nSusun lembar rangkuman ujian (cheatsheet) yang padat dan komprehensif.",
        },
    ]

    try:
        res = await guts_client.chat_completion(
            messages=messages,
            model=request.model,
            temperature=0.4,
            max_tokens=3000,
        )
        return CheatSheetResponse(
            cheatsheet_markdown=res["content"].strip(),
            model=res["model"],
        )
    except GutsAIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyusun lembar rangkuman: {str(e)}")


@router.post("/motivation", response_model=MotivationResponse)
async def generate_motivation(
    request: MotivationRequest,
    current_user: User = Depends(get_current_user),
):
    """Generates an authentic, context-aware motivational quote and reflection dynamically."""
    category = request.category or "islamic"
    context_note = f"\nKonteks Pembelajaran: {request.context}" if request.context else ""

    messages = [
        {"role": "system", "content": MOTIVATION_GENERATION_PROMPT},
        {
            "role": "user",
            "content": f"Kategori: {category}{context_note}\n\nBuatkan 1 kutipan mutiara motivasi belajar yang mendalam dan relevan dalam format JSON.",
        },
    ]

    try:
        res = await guts_client.chat_completion(
            messages=messages,
            model=request.model,
            temperature=0.7,
            max_tokens=600,
        )
        raw = res["content"].strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        import json
        data = json.loads(raw)
        return MotivationResponse(
            quote=data.get("quote", "Man jadda wajada."),
            source=data.get("source", "Mahfuzhat"),
            category_label=data.get("category_label", "Mutiara Islami"),
            reflection=data.get("reflection", "Teruslah melangkah, setiap usaha belajar Anda bernilai mulia."),
            category=category,
        )
    except Exception as e:
        return MotivationResponse(
            quote="Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
            source="HR. Muslim no. 2699",
            category_label="Mutiara Islami",
            reflection="Setiap menit yang Anda luangkan untuk belajar adalah langkah mulia yang mengantarkan pada kesuksesan.",
            category=category,
        )

