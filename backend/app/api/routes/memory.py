from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.memory import UserMemory
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/memory", tags=["Personal Learning Memory"])


@router.get("", response_model=List[MemoryResponse])
def get_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(UserMemory)
        .filter(UserMemory.user_id == current_user.id)
        .order_by(UserMemory.created_at.desc())
        .all()
    )


@router.post("", response_model=MemoryResponse)
def create_memory(
    mem_in: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mem = UserMemory(
        user_id=current_user.id,
        category=mem_in.category,
        key=mem_in.key,
        value=mem_in.value,
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@router.patch("/{id}", response_model=MemoryResponse)
def update_memory(
    id: str,
    mem_in: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mem = db.query(UserMemory).filter(UserMemory.id == id, UserMemory.user_id == current_user.id).first()
    if not mem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memori tidak ditemukan.")

    if mem_in.category is not None:
        mem.category = mem_in.category
    if mem_in.key is not None:
        mem.key = mem_in.key
    if mem_in.value is not None:
        mem.value = mem_in.value

    db.commit()
    db.refresh(mem)
    return mem


@router.delete("/{id}")
def delete_memory(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mem = db.query(UserMemory).filter(UserMemory.id == id, UserMemory.user_id == current_user.id).first()
    if not mem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memori tidak ditemukan.")
    db.delete(mem)
    db.commit()
    return {"message": "Memori belajar berhasil dihapus."}
