import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.review import ReviewCard
from app.ai.guts_client import guts_client, GutsAIError
from app.ai.prompts import QUIZ_GENERATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class QuizService:
    @staticmethod
    async def generate_quiz_questions(
        subject: str,
        topic: str,
        difficulty: str = "intermediate",
        question_count: int = 5,
        document_context: Optional[str] = None,
        model: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Generate quiz questions using GutsAI with structured format."""
        
        user_prompt = f"""Mata Pelajaran: {subject}
Topik: {topic}
Tingkat Kesulitan: {difficulty}
Jumlah Soal: {question_count}
"""
        if document_context:
            user_prompt += f"\nGunakan referensi materi dokumen berikut sebagai acuan soal:\n{document_context[:5000]}\n"

        user_prompt += "\nBuatkan soal kuis yang mendalam dan relevan dalam format JSON sesuai spesifikasi."

        messages = [
            {"role": "system", "content": QUIZ_GENERATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        resp = await guts_client.chat_completion(
            messages=messages,
            model=model,
            temperature=0.6,
            max_tokens=3000,
        )

        content = resp["content"].strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        try:
            data = json.loads(content)
            questions = data.get("questions", [])
            if not questions:
                raise ValueError("Format JSON kuis tidak memuat daftar pertanyaan.")
            return questions
        except Exception as e:
            logger.error(f"Failed to parse generated quiz JSON: {e}\nRaw content: {content}")
            raise GutsAIError("Format kuis yang dihasilkan AI tidak valid. Silakan coba kembali.", status_code=502)

    @staticmethod
    def evaluate_quiz_submission(
        db: Session,
        quiz: Quiz,
        user_id: str,
        user_answers: List[Dict[str, str]],
    ) -> QuizAttempt:
        """
        Evaluate student answers on backend securely.
        Calculates score and automatically schedules missed items for Smart Review.
        """
        answer_map = {ans["question_id"]: ans["user_answer"] for ans in user_answers}
        
        correct_count = 0
        total_questions = len(quiz.questions)
        max_score = 100.0

        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=user_id,
            total_questions=total_questions,
            max_score=max_score,
        )
        db.add(attempt)
        db.flush()

        for question in quiz.questions:
            student_answer = answer_map.get(question.id, "").strip()
            correct_answer = question.correct_answer.strip()
            
            # Normalization for objective checking
            is_correct = False
            if question.question_type in ["multiple_choice", "true_false"]:
                # Check case-insensitive match or letter choice match
                if student_answer.lower() == correct_answer.lower():
                    is_correct = True
                elif len(student_answer) == 1 and correct_answer.lower().startswith(student_answer.lower()):
                    is_correct = True
            else:
                # Short answer / text match
                if student_answer.lower() == correct_answer.lower():
                    is_correct = True
                elif correct_answer.lower() in student_answer.lower() and len(student_answer) > 0:
                    is_correct = True

            feedback = question.explanation if is_correct else f"Jawaban yang tepat: {correct_answer}. {question.explanation or ''}"

            if is_correct:
                correct_count += 1
            else:
                # Add to Spaced Repetition ReviewCards automatically for Smart Review!
                existing_card = db.query(ReviewCard).filter(
                    ReviewCard.user_id == user_id,
                    ReviewCard.question == question.question_text,
                ).first()

                if existing_card:
                    existing_card.failure_count += 1
                else:
                    new_card = ReviewCard(
                        user_id=user_id,
                        subject=quiz.subject,
                        topic=quiz.topic,
                        question=question.question_text,
                        answer=correct_answer,
                        explanation=question.explanation,
                        difficulty_level=quiz.difficulty,
                        failure_count=1,
                    )
                    db.add(new_card)

            qa = QuizAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                user_answer=student_answer,
                is_correct=is_correct,
                ai_feedback=feedback,
            )
            db.add(qa)

        percentage = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0
        score = (correct_count / total_questions * max_score) if total_questions > 0 else 0.0

        attempt.score = round(score, 1)
        attempt.percentage = round(percentage, 1)
        attempt.correct_count = correct_count

        db.commit()
        db.refresh(attempt)
        return attempt


quiz_service = QuizService()
