import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.cat_exam import CATQuestion, CATSession
from app.services.irt_engine import irt_engine

router = APIRouter(prefix="/cat-exam", tags=["Computerized Adaptive Testing (CAT)"])

# Standard IRT Item Bank seed
INITIAL_CAT_QUESTIONS = [
    {
        "id": "cat_q1_easy",
        "subject": "Matematika",
        "topic": "Aljabar",
        "question_text": "Jika 3x - 5 = 16, berapakah nilai dari x?",
        "options": ["5", "7", "9", "11", "13"],
        "correct_answer": "7",
        "explanation": "3x = 16 + 5 = 21 -> x = 7.",
        "a_param": 1.1,
        "b_param": -1.2, # Mudah
        "c_param": 0.20,
    },
    {
        "id": "cat_q2_med",
        "subject": "Matematika",
        "topic": "Persamaan Kuadrat",
        "question_text": "Akar-akar dari persamaan kuadrat x² - 5x + 6 = 0 adalah...",
        "options": ["x = 1 atau x = 6", "x = 2 atau x = 3", "x = -2 atau x = -3", "x = -1 atau x = 6", "x = 0 atau x = 5"],
        "correct_answer": "x = 2 atau x = 3",
        "explanation": "(x - 2)(x - 3) = 0 -> x = 2 atau x = 3.",
        "a_param": 1.25,
        "b_param": 0.0, # Sedang (baseline)
        "c_param": 0.20,
    },
    {
        "id": "cat_q3_hard",
        "subject": "Matematika",
        "topic": "Kalkulus Turunan",
        "question_text": "Jika f(x) = 2x³ - 3x² + 4x - 5, berapakah nilai dari f'(2)?",
        "options": ["12", "14", "16", "18", "20"],
        "correct_answer": "16",
        "explanation": "f'(x) = 6x² - 6x + 4. f'(2) = 6(4) - 6(2) + 4 = 24 - 12 + 4 = 16.",
        "a_param": 1.45,
        "b_param": 1.1, # Sulit
        "c_param": 0.20,
    },
    {
        "id": "cat_q4_very_hard",
        "subject": "Matematika",
        "topic": "Integral Tertentu",
        "question_text": "Nilai dari ∫ (dari 0 sampai 2) (3x² + 2x) dx adalah...",
        "options": ["10", "12", "14", "16", "18"],
        "correct_answer": "12",
        "explanation": "[x³ + x²] dari 0 sampai 2 = (8 + 4) - 0 = 12.",
        "a_param": 1.6,
        "b_param": 1.8, # Sangat Sulit
        "c_param": 0.20,
    },
    {
        "id": "cat_q5_easy2",
        "subject": "Matematika",
        "topic": "Aritmatika Sosial",
        "question_text": "Sebuah barang dibeli seharga Rp 100.000 dan dijual dengan keuntungan 15%. Berapakah harga jualnya?",
        "options": ["Rp 110.000", "Rp 115.000", "Rp 120.000", "Rp 125.000", "Rp 130.000"],
        "correct_answer": "Rp 115.000",
        "explanation": "Untung = 15% x 100.000 = 15.000. Harga jual = 115.000.",
        "a_param": 0.95,
        "b_param": -1.5,
        "c_param": 0.20,
    },
    {
        "id": "cat_q6_med2",
        "subject": "Matematika",
        "topic": "Peluang & Kombinatorika",
        "question_text": "Dari 5 orang calon pengurus, akan dipilih 2 orang sebagai ketua dan wakil ketua. Berapa banyak susunan yang mungkin?",
        "options": ["10", "15", "20", "25", "30"],
        "correct_answer": "20",
        "explanation": "Permutasi P(5,2) = 5 x 4 = 20 cara.",
        "a_param": 1.2,
        "b_param": 0.4,
        "c_param": 0.20,
    },
    {
        "id": "cat_q7_hard2",
        "subject": "Matematika",
        "topic": "Geometri Dimensi Tiga",
        "question_text": "Pada kubus ABCD.EFGH dengan panjang rusuk 6 cm, berapakah jarak titik A ke bidang BDE?",
        "options": ["2√3 cm", "3√2 cm", "4√3 cm", "2√6 cm", "3√3 cm"],
        "correct_answer": "2√3 cm",
        "explanation": "Jarak titik sudut ke bidang diagonal berjarak 1/3 diagonal ruang = 1/3 x 6√3 = 2√3 cm.",
        "a_param": 1.7,
        "b_param": 1.9,
        "c_param": 0.20,
    },
]


def seed_cat_questions_if_needed(db: Session):
    count = db.query(CATQuestion).count()
    if count == 0:
        for q in INITIAL_CAT_QUESTIONS:
            item = CATQuestion(
                id=q["id"],
                subject=q["subject"],
                topic=q["topic"],
                question_text=q["question_text"],
                options=q["options"],
                correct_answer=q["correct_answer"],
                explanation=q["explanation"],
                a_param=q["a_param"],
                b_param=q["b_param"],
                c_param=q["c_param"],
            )
            db.add(item)
        db.commit()


class StartCATRequest(BaseModel):
    subject: Optional[str] = "Matematika"


class SubmitCATAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_option: str


@router.post("/start")
def start_cat_session(
    req: StartCATRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initializes an adaptive CAT tryout session and serves the first calibrated item."""
    seed_cat_questions_if_needed(db)

    # Create new CAT session
    session = CATSession(
        user_id=current_user.id,
        subject=req.subject,
        current_theta=0.0,
        scaled_score=600,
        proficiency_level="Proficient (Cukup)",
        total_administered=0,
        is_finished=False,
        responses_history=[],
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Get all questions
    all_questions = db.query(CATQuestion).filter(CATQuestion.subject == req.subject).all()
    if not all_questions:
        all_questions = db.query(CATQuestion).all()

    items_dict = [
        {
            "id": q.id,
            "subject": q.subject,
            "topic": q.topic,
            "question_text": q.question_text,
            "options": q.options,
            "a": q.a_param,
            "b": q.b_param,
            "c": q.c_param,
        }
        for q in all_questions
    ]

    first_item = irt_engine.select_next_item(
        current_theta=0.0,
        available_items=items_dict,
        administered_ids=[],
    )

    if not first_item:
        raise HTTPException(status_code=500, detail="Bank soal CAT belum tersedia.")

    return {
        "session_id": session.id,
        "subject": session.subject,
        "current_theta": session.current_theta,
        "scaled_score": session.scaled_score,
        "total_administered": 0,
        "max_questions": 5, # Standard short adaptive CAT test
        "is_finished": False,
        "next_question": {
            "id": first_item["id"],
            "topic": first_item["topic"],
            "question_text": first_item["question_text"],
            "options": first_item["options"],
            "difficulty_label": (
                "Mudah" if first_item["b"] < -0.5 else "Sedang" if first_item["b"] < 0.8 else "Tantangan Tinggi"
            ),
        },
    }


@router.post("/submit-answer")
def submit_cat_answer(
    req: SubmitCATAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates response, recalculates student theta via IRT MLE,
    and dynamically selects next adaptive item or finalizes exam.
    """
    session = (
        db.query(CATSession)
        .filter(CATSession.id == req.session_id, CATSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Sesi CAT tidak ditemukan.")
    if session.is_finished:
        raise HTTPException(status_code=400, detail="Sesi CAT ini sudah selesai.")

    q = db.query(CATQuestion).filter(CATQuestion.id == req.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Butir soal tidak ditemukan.")

    is_correct = (req.selected_option.strip() == q.correct_answer.strip())

    # Build updated responses history
    history = list(session.responses_history or [])
    history.append({
        "question_id": q.id,
        "topic": q.topic,
        "selected": req.selected_option,
        "correct_answer": q.correct_answer,
        "is_correct": is_correct,
        "a": q.a_param,
        "b": q.b_param,
        "c": q.c_param,
    })

    # Estimate new theta via IRT Newton-Raphson MLE
    new_theta = irt_engine.estimate_ability(history, current_theta=session.current_theta)
    scaled_score = irt_engine.theta_to_scaled_score(new_theta)
    prof = irt_engine.classify_proficiency(new_theta)

    session.current_theta = new_theta
    session.scaled_score = scaled_score
    session.proficiency_level = prof["level"]
    session.total_administered = len(history)
    session.responses_history = history

    # Stopping rule: finish after 5 questions
    MAX_CAT_ITEMS = 5
    if session.total_administered >= MAX_CAT_ITEMS:
        session.is_finished = True
        session.finished_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)

        return {
            "session_id": session.id,
            "is_finished": True,
            "was_correct": is_correct,
            "explanation": q.explanation,
            "correct_answer": q.correct_answer,
            "final_results": {
                "theta": new_theta,
                "scaled_score": scaled_score,
                "proficiency_level": prof["level"],
                "grade": prof["grade"],
                "badge": prof["badge"],
                "total_questions": session.total_administered,
                "correct_count": sum(1 for h in history if h["is_correct"]),
                "history": history,
            },
        }

    # Select next adaptive item
    administered_ids = [h["question_id"] for h in history]
    all_questions = db.query(CATQuestion).filter(CATQuestion.subject == session.subject).all()
    if not all_questions:
        all_questions = db.query(CATQuestion).all()

    items_dict = [
        {
            "id": it.id,
            "subject": it.subject,
            "topic": it.topic,
            "question_text": it.question_text,
            "options": it.options,
            "a": it.a_param,
            "b": it.b_param,
            "c": it.c_param,
        }
        for it in all_questions
    ]

    next_item = irt_engine.select_next_item(
        current_theta=new_theta,
        available_items=items_dict,
        administered_ids=administered_ids,
    )

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "is_finished": False,
        "was_correct": is_correct,
        "explanation": q.explanation,
        "correct_answer": q.correct_answer,
        "current_theta": new_theta,
        "scaled_score": scaled_score,
        "total_administered": session.total_administered,
        "max_questions": MAX_CAT_ITEMS,
        "next_question": {
            "id": next_item["id"],
            "topic": next_item["topic"],
            "question_text": next_item["question_text"],
            "options": next_item["options"],
            "difficulty_label": (
                "Mudah" if next_item["b"] < -0.5 else "Sedang" if next_item["b"] < 0.8 else "Tantangan Tinggi"
            ),
        } if next_item else None,
    }


@router.get("/history")
def get_cat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetches user's historical CAT exam attempts and theta progression."""
    sessions = (
        db.query(CATSession)
        .filter(CATSession.user_id == current_user.id)
        .order_by(CATSession.started_at.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": s.id,
            "subject": s.subject,
            "scaled_score": s.scaled_score,
            "theta": s.current_theta,
            "proficiency_level": s.proficiency_level,
            "total_questions": s.total_administered,
            "is_finished": s.is_finished,
            "date": s.started_at.strftime("%d %b %Y, %H:%M") if s.started_at else "-",
        }
        for s in sessions
    ]
