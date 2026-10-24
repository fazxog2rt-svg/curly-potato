from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationCreate, ConversationResponse, ConversationUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@router.post("", response_model=ConversationResponse)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "Percakapan Baru",
        model=conv_in.model or "claude-sonnet-4.5",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/{id}", response_model=ConversationResponse)
def get_conversation_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Percakapan tidak ditemukan.",
        )
    return conv


@router.patch("/{id}", response_model=ConversationResponse)
def rename_conversation(
    id: str,
    conv_in: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Percakapan tidak ditemukan.",
        )
    conv.title = conv_in.title
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/{id}")
def delete_conversation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Percakapan tidak ditemukan.",
        )
    db.delete(conv)
    db.commit()
    return {"message": "Percakapan berhasil dihapus."}
