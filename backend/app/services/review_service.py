from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.review import ReviewCard, ReviewHistory


class ReviewService:
    @staticmethod
    def process_review_attempt(
        db: Session,
        card: ReviewCard,
        rating: int,
    ) -> Dict[str, Any]:
        """
        Process a review card attempt using the SuperMemo-2 (SM-2) spaced repetition algorithm.
        Rating: 0 to 5.
        """
        now = datetime.now(timezone.utc)
        prev_interval = card.interval_days
        prev_repetitions = card.repetitions
        prev_ease = card.ease_factor

        # SM-2 core calculation
        if rating >= 3:
            # Successful recall
            if card.repetitions == 0:
                card.interval_days = 1
            elif card.repetitions == 1:
                card.interval_days = 6
            else:
                card.interval_days = max(1, int(round(card.interval_days * card.ease_factor)))
            card.repetitions += 1
            message = f"Bagus! Kartu ini akan diulang kembali dalam {card.interval_days} hari."
        else:
            # Failed recall
            card.repetitions = 0
            card.interval_days = 1
            card.failure_count += 1
            message = "Perlu pengulangan. Kartu dijadwalkan kembali besok."

        # Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ease = card.ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
        card.ease_factor = max(1.3, round(new_ease, 2))
        card.last_reviewed_at = now
        card.next_review_at = now + timedelta(days=card.interval_days)

        # Record history
        history = ReviewHistory(
            card_id=card.id,
            user_id=card.user_id,
            rating=rating,
            interval_before=prev_interval,
            interval_after=card.interval_days,
            reviewed_at=now,
        )
        db.add(history)
        db.commit()
        db.refresh(card)

        return {
            "card_id": card.id,
            "rating": rating,
            "repetitions": card.repetitions,
            "interval_days": card.interval_days,
            "ease_factor": card.ease_factor,
            "next_review_at": card.next_review_at,
            "message": message,
        }

    @staticmethod
    def get_due_cards(db: Session, user_id: str) -> List[ReviewCard]:
        """Return cards where next_review_at is due (<= now)."""
        now = datetime.now(timezone.utc)
        return (
            db.query(ReviewCard)
            .filter(ReviewCard.user_id == user_id, ReviewCard.next_review_at <= now)
            .order_by(ReviewCard.failure_count.desc(), ReviewCard.next_review_at.asc())
            .all()
        )


review_service = ReviewService()
