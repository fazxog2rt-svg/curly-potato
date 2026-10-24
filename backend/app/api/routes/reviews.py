from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.review import ReviewCard
from app.models.session import StudySession
from app.schemas.review import (
    ReviewCardCreate,
    ReviewCardResponse,
    ReviewAnswerRequest,
    ReviewAnswerResponse,
)
from app.services.review_service import review_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/reviews", tags=["Smart Review"])


@router.get("/due", response_model=List[ReviewCardResponse])
def get_due_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.get_due_cards(db, current_user.id)


@router.get("/all", response_model=List[ReviewCardResponse])
def get_all_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(ReviewCard)
        .filter(ReviewCard.user_id == current_user.id)
        .order_by(ReviewCard.failure_count.desc(), ReviewCard.created_at.desc())
        .all()
    )


@router.post("/cards", response_model=ReviewCardResponse)
def create_card(
    card_in: ReviewCardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = ReviewCard(
        user_id=current_user.id,
        subject=card_in.subject,
        topic=card_in.topic,
        question=card_in.question,
        answer=card_in.answer,
        explanation=card_in.explanation,
        difficulty_level=card_in.difficulty_level or "medium",
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.post("/{id}/answer", response_model=ReviewAnswerResponse)
def answer_review(
    id: str,
    answer_in: ReviewAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(ReviewCard)
        .filter(ReviewCard.id == id, ReviewCard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kartu review tidak ditemukan.")

    result = review_service.process_review_attempt(
        db=db,
        card=card,
        rating=answer_in.rating,
    )

    # Log study session for review activity
    session = StudySession(
        user_id=current_user.id,
        subject=card.subject,
        duration_minutes=3,
        activity_type="review",
        notes=f"Pengulangan konsep: {card.question[:30]}...",
    )
    db.add(session)
    db.commit()

    return ReviewAnswerResponse(**result)


@router.delete("/{id}")
def delete_card(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(ReviewCard)
        .filter(ReviewCard.id == id, ReviewCard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kartu review tidak ditemukan.")
    db.delete(card)
    db.commit()
    return {"message": "Kartu review berhasil dihapus."}
