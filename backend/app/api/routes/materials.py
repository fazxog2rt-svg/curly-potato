import os
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.material import Subject, LearningMaterial, DocumentChunk
from app.schemas.material import SubjectCreate, SubjectResponse, MaterialResponse
from app.schemas.ai import AskDocumentRequest
from app.services.document_service import document_service
from app.ai.guts_client import guts_client
from app.ai.prompts import get_tutor_system_prompt
from app.api.deps import get_current_user

router = APIRouter(prefix="/materials", tags=["Learning Materials & Documents"])


@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Subject)
        .filter(Subject.user_id == current_user.id)
        .order_by(Subject.name.asc())
        .all()
    )


@router.post("/subjects", response_model=SubjectResponse)
def create_subject(
    subject_in: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = Subject(
        user_id=current_user.id,
        name=subject_in.name,
        description=subject_in.description,
        color=subject_in.color or "#6366f1",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("", response_model=List[MaterialResponse])
def get_materials(
    subject_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(LearningMaterial).filter(LearningMaterial.user_id == current_user.id)
    if subject_id:
        query = query.filter(LearningMaterial.subject_id == subject_id)
    return query.order_by(LearningMaterial.created_at.desc()).all()


@router.post("/upload", response_model=MaterialResponse)
async def upload_material(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Validate File Extension
    filename = file.filename or "dokumen"
    if not document_service.is_allowed_file(filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format file tidak didukung. Harap unggah PDF, DOCX, TXT, atau Markdown (.md).",
        )

    file_ext = filename.rsplit(".", 1)[-1].lower()

    # 2. Read and Validate Size
    content_bytes = await file.read()
    file_size = len(content_bytes)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ukuran file ({file_size / (1024*1024):.1f} MB) melebihi batas maksimum {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # 3. Save File Locally
    upload_dir = os.path.abspath(settings.STORAGE_LOCAL_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    saved_filename = f"{uuid.uuid4()}_{filename}"
    saved_filepath = os.path.join(upload_dir, saved_filename)

    with open(saved_filepath, "wb") as f:
        f.write(content_bytes)

    # 4. Extract and Chunk Text
    try:
        pages_text = document_service.extract_text(saved_filepath, file_ext)
        if not pages_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dokumen kosong atau teks tidak dapat diekstrak.",
            )

        chunks_data = document_service.chunk_text(pages_text)
    except Exception as e:
        if os.path.exists(saved_filepath):
            os.remove(saved_filepath)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Gagal memproses dokumen: {str(e)}",
        )

    # 5. Create LearningMaterial record
    display_title = title.strip() if title and title.strip() else filename.rsplit(".", 1)[0]
    material = LearningMaterial(
        user_id=current_user.id,
        subject_id=subject_id,
        title=display_title,
        filename=filename,
        file_type=file_ext,
        file_size=file_size,
        file_path=saved_filepath,
        status="ready",
    )
    db.add(material)
    db.flush()

    # 6. Save Chunks
    for c in chunks_data:
        chunk = DocumentChunk(
            material_id=material.id,
            chunk_index=c["chunk_index"],
            page_number=c["page_number"],
            content=c["content"],
        )
        db.add(chunk)

    db.commit()
    db.refresh(material)
    return material


@router.get("/{id}", response_model=MaterialResponse)
def get_material_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mat = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.id == id, LearningMaterial.user_id == current_user.id)
        .first()
    )
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materi tidak ditemukan.")
    return mat


@router.post("/{id}/summarize")
async def summarize_material(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mat = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.id == id, LearningMaterial.user_id == current_user.id)
        .first()
    )
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materi tidak ditemukan.")

    if not mat.chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Materi tidak memuat teks yang dapat diringkas.")

    full_text = "\n\n".join([c.content for c in mat.chunks])
    summary_data = await document_service.summarize_document(full_text)

    mat.summary = summary_data["summary"]
    mat.key_concepts = summary_data["key_concepts"]
    db.commit()
    db.refresh(mat)

    return {
        "material_id": mat.id,
        "title": mat.title,
        "summary": mat.summary,
        "key_concepts": mat.key_concepts,
        "glossary": summary_data.get("glossary", []),
    }


@router.post("/{id}/ask")
async def ask_material(
    id: str,
    ask_in: AskDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mat = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.id == id, LearningMaterial.user_id == current_user.id)
        .first()
    )
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materi tidak ditemukan.")

    # Retrieve relevant chunks
    retrieved = document_service.search_chunks(mat.chunks, ask_in.question, top_k=4)
    doc_context = f"Dokumen: {mat.title}\n" + "\n\n".join(retrieved) if retrieved else "Tidak ada teks relevan ditemukan."

    system_prompt = get_tutor_system_prompt(
        difficulty=current_user.preferred_difficulty,
        language=current_user.preferred_language,
        document_context=doc_context,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": ask_in.question},
    ]

    resp = await guts_client.chat_completion(
        messages=messages,
        model=ask_in.model,
        temperature=0.5,
        max_tokens=1500,
    )

    return {
        "answer": resp["content"],
        "sources": retrieved,
        "material_title": mat.title,
        "model": resp["model"],
    }


@router.delete("/{id}")
def delete_material(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mat = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.id == id, LearningMaterial.user_id == current_user.id)
        .first()
    )
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materi tidak ditemukan.")

    # Delete physical file
    if mat.file_path and os.path.exists(mat.file_path):
        try:
            os.remove(mat.file_path)
        except Exception:
            pass

    db.delete(mat)
    db.commit()
    return {"message": "Materi berhasil dihapus."}
