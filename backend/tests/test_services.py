import pytest
from app.models.quiz import Quiz, QuizQuestion
from app.models.review import ReviewCard
from app.models.session import StudySession
from app.services.quiz_service import quiz_service
from app.services.review_service import review_service
from app.services.document_service import document_service
from app.services.analytics_service import analytics_service


def test_sm2_spaced_repetition_logic(db_session):
    """Test SM-2 spaced repetition calculation on correct and incorrect recall."""
    card = ReviewCard(
        user_id="test-user-1",
        subject="Matematika",
        question="Berapa turunan dari sin(x)?",
        answer="cos(x)",
        repetitions=0,
        interval_days=1,
        ease_factor=2.5,
    )
    db_session.add(card)
    db_session.commit()

    # 1. Successful recall (Rating 5)
    res1 = review_service.process_review_attempt(db_session, card, rating=5)
    assert res1["repetitions"] == 1
    assert res1["interval_days"] == 1
    assert res1["ease_factor"] >= 2.5

    # 2. Second successful recall (Rating 4)
    res2 = review_service.process_review_attempt(db_session, card, rating=4)
    assert res2["repetitions"] == 2
    assert res2["interval_days"] == 6

    # 3. Failed recall (Rating 1)
    res3 = review_service.process_review_attempt(db_session, card, rating=1)
    assert res3["repetitions"] == 0
    assert res3["interval_days"] == 1
    assert card.failure_count == 1


def test_quiz_evaluation_and_review_card_creation(db_session):
    """Test backend quiz scoring and automatic creation of review cards for missed questions."""
    quiz = Quiz(
        user_id="test-user-2",
        subject="Fisika",
        topic="Hukum Newton",
        difficulty="beginner",
        question_count=2,
    )
    db_session.add(quiz)
    db_session.flush()

    q1 = QuizQuestion(
        quiz_id=quiz.id,
        order_index=1,
        question_type="multiple_choice",
        question_text="Satuan gaya menurut SI adalah?",
        correct_answer="Newton",
        explanation="Satuan SI gaya adalah Newton (N).",
    )
    q2 = QuizQuestion(
        quiz_id=quiz.id,
        order_index=2,
        question_type="multiple_choice",
        question_text="Hukum Newton I dikenal juga sebagai hukum?",
        correct_answer="Kelembaman",
        explanation="Hukum Newton I disebut juga hukum kelembaman (inersia).",
    )
    db_session.add_all([q1, q2])
    db_session.commit()

    # Submit 1 correct and 1 wrong answer
    user_answers = [
        {"question_id": q1.id, "user_answer": "Newton"},  # Correct
        {"question_id": q2.id, "user_answer": "Akselerasi"},  # Incorrect
    ]

    attempt = quiz_service.evaluate_quiz_submission(
        db=db_session,
        quiz=quiz,
        user_id="test-user-2",
        user_answers=user_answers,
    )

    assert attempt.total_questions == 2
    assert attempt.correct_count == 1
    assert attempt.percentage == 50.0

    # Verify that the incorrect question automatically created a review card
    created_card = db_session.query(ReviewCard).filter(
        ReviewCard.user_id == "test-user-2",
        ReviewCard.question == q2.question_text,
    ).first()
    assert created_card is not None
    assert created_card.answer == "Kelembaman"
    assert created_card.failure_count == 1


def test_document_chunking_and_keyword_search():
    """Test text chunking with overlap and keyword fallback retrieval."""
    sample_pages = [
        (1, "Sistem saraf manusia terdiri dari sistem saraf pusat dan sistem saraf tepi."),
        (2, "Otak besar dan sumsum tulang belakang adalah bagian dari sistem saraf pusat."),
    ]

    chunks = document_service.chunk_text(sample_pages, chunk_size=50, overlap=10)
    assert len(chunks) >= 2
    assert chunks[0]["page_number"] == 1

    # Mock chunk objects for search
    class MockChunk:
        def __init__(self, content, page):
            self.content = content
            self.page_number = page

    mock_chunks = [MockChunk(c["content"], c["page_number"]) for c in chunks]
    results = document_service.search_chunks(mock_chunks, "otak besar", top_k=2)
    assert len(results) > 0
    assert any("Otak" in r or "otak" in r for r in results)


def test_analytics_metrics_calculation(db_session):
    """Test that analytics calculates real session durations, consistency, and empty states."""
    # Seed 2 study sessions
    s1 = StudySession(user_id="test-user-3", subject="Biologi", duration_minutes=30)
    s2 = StudySession(user_id="test-user-3", subject="Biologi", duration_minutes=45)
    db_session.add_all([s1, s2])
    db_session.commit()

    overview = analytics_service.get_user_overview(db_session, "test-user-3")
    assert overview.total_study_minutes == 75
    assert overview.total_sessions_count == 2
    assert len(overview.weekly_study_trends) == 7
    assert overview.consistency_score > 0
