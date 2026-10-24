from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.note import Note
from app.schemas.material import NoteCreate, NoteUpdate, NoteResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("", response_model=List[NoteResponse])
def get_notes(
    material_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Note).filter(Note.user_id == current_user.id)
    if material_id:
        query = query.filter(Note.material_id == material_id)
    return query.order_by(Note.updated_at.desc()).all()


@router.post("", response_model=NoteResponse)
def create_note(
    note_in: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = Note(
        user_id=current_user.id,
        title=note_in.title,
        content=note_in.content,
        material_id=note_in.material_id,
        tags=note_in.tags,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{id}", response_model=NoteResponse)
def get_note(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catatan tidak ditemukan.")
    return note


@router.patch("/{id}", response_model=NoteResponse)
def update_note(
    id: str,
    note_in: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catatan tidak ditemukan.")

    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.tags is not None:
        note.tags = note_in.tags

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{id}")
def delete_note(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catatan tidak ditemukan.")
    db.delete(note)
    db.commit()
    return {"message": "Catatan berhasil dihapus."}
