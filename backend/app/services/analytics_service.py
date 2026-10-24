from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.session import StudySession
from app.models.quiz import Quiz, QuizAttempt
from app.models.review import ReviewCard
from app.models.study_plan import StudyGoal, StudyTask
from app.schemas.analytics import AnalyticsOverviewResponse, DailyStudyTime, SubjectAccuracy, WeakTopic


class AnalyticsService:
    @staticmethod
    def get_user_overview(db: Session, user_id: str) -> AnalyticsOverviewResponse:
        now = datetime.now(timezone.utc)

        # 1. Total Study Minutes & Sessions
        sessions = db.query(StudySession).filter(StudySession.user_id == user_id).all()
        total_study_minutes = sum(s.duration_minutes for s in sessions)
        total_sessions_count = len(sessions)

        # 2. Quiz Performance & Attempts
        attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()
        quizzes_taken_count = len(attempts)
        avg_score = (
            sum(a.percentage for a in attempts) / quizzes_taken_count
            if quizzes_taken_count > 0
            else 0.0
        )

        # 3. Spaced Repetition Cards Due & Total
        all_cards = db.query(ReviewCard).filter(ReviewCard.user_id == user_id).all()
        total_cards_count = len(all_cards)
        cards_due_for_review = len([c for c in all_cards if c.next_review_at <= now])

        # 4. Study Goals
        goals = db.query(StudyGoal).filter(StudyGoal.user_id == user_id).all()
        goals_active = len([g for g in goals if g.status == "active"])
        goals_completed = len([g for g in goals if g.status == "completed"])

        # 5. Weekly Study Trends (past 7 days)
        day_names = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
        weekly_trends: List[DailyStudyTime] = []
        for i in range(6, -1, -1):
            target_date = (now - timedelta(days=i)).date()
            day_str = day_names[target_date.weekday()]
            day_minutes = 0
            for s in sessions:
                if s.created_at.date() == target_date:
                    day_minutes += s.duration_minutes
            weekly_trends.append(
                DailyStudyTime(
                    day=day_str,
                    date=target_date.isoformat(),
                    minutes=day_minutes,
                )
            )

        # 6. Accuracy by Subject
        # Group attempts by quiz subject
        subject_stats: Dict[str, Dict[str, Any]] = {}
        for a in attempts:
            sub = a.quiz.subject if a.quiz else "Umum"
            if sub not in subject_stats:
                subject_stats[sub] = {"total_pct": 0.0, "count": 0}
            subject_stats[sub]["total_pct"] += a.percentage
            subject_stats[sub]["count"] += 1

        accuracy_by_subject = [
            SubjectAccuracy(
                subject=sub,
                accuracy_percentage=round(data["total_pct"] / data["count"], 1),
                total_quizzes=data["count"],
            )
            for sub, data in subject_stats.items()
        ]

        # 7. Weak Topics (from failed ReviewCards)
        weak_cards = [c for c in all_cards if c.failure_count > 0]
        weak_cards.sort(key=lambda x: x.failure_count, reverse=True)
        weak_topics = [
            WeakTopic(
                topic=c.topic or c.question[:40],
                subject=c.subject,
                failure_count=c.failure_count,
            )
            for c in weak_cards[:5]
        ]

        # 8. Consistency Score (percentage of days with study sessions in last 14 days)
        fourteen_days_ago = (now - timedelta(days=14)).date()
        active_days = set()
        for s in sessions:
            if s.created_at.date() >= fourteen_days_ago:
                active_days.add(s.created_at.date())
        consistency_score = min(100, int((len(active_days) / 14.0) * 100))

        # 9. Dynamic Actionable Recommendations
        recommendations = []
        if cards_due_for_review > 0:
            recommendations.append(f"Ada {cards_due_for_review} kartu materi yang jatuh tempo untuk diulang hari ini.")
        if weak_topics:
            recommendations.append(f"Perkuat pemahaman pada topik '{weak_topics[0].topic}' di mata pelajaran {weak_topics[0].subject}.")
        if quizzes_taken_count == 0:
            recommendations.append("Coba kerjakan kuis pertamamu untuk menguji pemahaman materi.")
        if not recommendations:
            recommendations.append("Pertahankan konsistensi belajar dan buat target belajar baru untuk minggu ini!")

        return AnalyticsOverviewResponse(
            total_study_minutes=total_study_minutes,
            total_sessions_count=total_sessions_count,
            average_quiz_score=round(avg_score, 1),
            quizzes_taken_count=quizzes_taken_count,
            cards_due_for_review=cards_due_for_review,
            total_cards_count=total_cards_count,
            study_goals_active=goals_active,
            study_goals_completed=goals_completed,
            weekly_study_trends=weekly_trends,
            accuracy_by_subject=accuracy_by_subject,
            weak_topics=weak_topics,
            consistency_score=consistency_score,
            recommendations=recommendations,
        )


analytics_service = AnalyticsService()
