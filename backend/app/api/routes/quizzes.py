import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.material import LearningMaterial
from app.models.session import StudySession
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizPublicResponse,
    QuizQuestionPublic,
    QuizSubmitRequest,
    QuizAttemptResponse,
    QuizAnswerReview,
)
from app.services.quiz_service import quiz_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/quizzes", tags=["Quiz Center"])


@router.post("/generate", response_model=QuizPublicResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Optional grounding in document
    doc_context = None
    if request.material_id:
        mat = db.query(LearningMaterial).filter(
            LearningMaterial.id == request.material_id,
            LearningMaterial.user_id == current_user.id,
        ).first()
        if mat and mat.chunks:
            doc_context = "\n\n".join([c.content for c in mat.chunks[:5]])

    # Generate questions via GutsAI
    raw_questions = await quiz_service.generate_quiz_questions(
        subject=request.subject,
        topic=request.topic,
        difficulty=request.difficulty or "intermediate",
        question_count=request.question_count or 5,
        document_context=doc_context,
        model=request.model,
    )

    # Create Quiz in DB
    quiz = Quiz(
        user_id=current_user.id,
        material_id=request.material_id,
        subject=request.subject,
        topic=request.topic,
        difficulty=request.difficulty or "intermediate",
        question_count=len(raw_questions),
        time_limit_minutes=request.time_limit_minutes,
    )
    db.add(quiz)
    db.flush()

    # Save Questions
    public_questions: List[QuizQuestionPublic] = []
    for idx, q_data in enumerate(raw_questions, start=1):
        options = q_data.get("options")
        options_json = json.dumps(options) if options else None
        
        q_record = QuizQuestion(
            quiz_id=quiz.id,
            order_index=idx,
            question_type=q_data.get("question_type", "multiple_choice"),
            question_text=q_data.get("question_text", ""),
            options=options_json,
            correct_answer=str(q_data.get("correct_answer", "")),
            explanation=q_data.get("explanation", ""),
        )
        db.add(q_record)
        db.flush()

        public_questions.append(
            QuizQuestionPublic(
                id=q_record.id,
                order_index=idx,
                question_type=q_record.question_type,
                question_text=q_record.question_text,
                options=options if isinstance(options, list) else None,
            )
        )

    db.commit()
    db.refresh(quiz)

    return QuizPublicResponse(
        id=quiz.id,
        subject=quiz.subject,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        created_at=quiz.created_at,
        questions=public_questions,
    )


@router.get("", response_model=List[dict])
def list_quizzes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )

    results = []
    for q in quizzes:
        last_attempt = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.quiz_id == q.id, QuizAttempt.user_id == current_user.id)
            .order_by(QuizAttempt.completed_at.desc())
            .first()
        )
        results.append({
            "id": q.id,
            "subject": q.subject,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "question_count": q.question_count,
            "time_limit_minutes": q.time_limit_minutes,
            "created_at": q.created_at,
            "last_score": last_attempt.percentage if last_attempt else None,
            "attempts_count": len(q.attempts),
        })

    return results


@router.get("/{id}", response_model=QuizPublicResponse)
def get_quiz_for_taking(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kuis tidak ditemukan.")

    public_questions: List[QuizQuestionPublic] = []
    for q in quiz.questions:
        options_list = None
        if q.options:
            try:
                options_list = json.loads(q.options)
            except Exception:
                options_list = None

        public_questions.append(
            QuizQuestionPublic(
                id=q.id,
                order_index=q.order_index,
                question_type=q.question_type,
                question_text=q.question_text,
                options=options_list,
            )
        )

    return QuizPublicResponse(
        id=quiz.id,
        subject=quiz.subject,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        question_count=quiz.question_count,
        time_limit_minutes=quiz.time_limit_minutes,
        created_at=quiz.created_at,
        questions=public_questions,
    )


@router.post("/{id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(
    id: str,
    submission: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kuis tidak ditemukan.")

    # Secure server-side evaluation
    user_answers_dict = [{"question_id": a.question_id, "user_answer": a.user_answer} for a in submission.answers]
    attempt = quiz_service.evaluate_quiz_submission(
        db=db,
        quiz=quiz,
        user_id=current_user.id,
        user_answers=user_answers_dict,
    )

    # Record study session duration (10 mins for quiz)
    session = StudySession(
        user_id=current_user.id,
        subject=quiz.subject,
        duration_minutes=10,
        activity_type="quiz",
        notes=f"Kuis {quiz.topic}: Nilai {attempt.percentage}%",
    )
    db.add(session)
    db.commit()

    # Build detailed review response
    answers_review = []
    for ans in attempt.answers:
        q = ans.question
        opts = json.loads(q.options) if q.options else None
        answers_review.append(
            QuizAnswerReview(
                question_id=q.id,
                question_text=q.question_text,
                question_type=q.question_type,
                options=opts,
                user_answer=ans.user_answer,
                correct_answer=q.correct_answer,
                is_correct=ans.is_correct,
                explanation=q.explanation,
                ai_feedback=ans.ai_feedback,
            )
        )

    return QuizAttemptResponse(
        id=attempt.id,
        quiz_id=quiz.id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        total_questions=attempt.total_questions,
        correct_count=attempt.correct_count,
        completed_at=attempt.completed_at,
        answers=answers_review,
    )


@router.get("/{id}/attempts", response_model=List[dict])
def get_quiz_attempts(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "score": a.score,
            "max_score": a.max_score,
            "percentage": a.percentage,
            "total_questions": a.total_questions,
            "correct_count": a.correct_count,
            "completed_at": a.completed_at,
        }
        for a in attempts
    ]
