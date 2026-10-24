from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.study_plan import StudyGoal, StudyTask
from app.models.session import StudySession
from app.schemas.study_plan import (
    GoalCreate,
    GoalResponse,
    TaskCreate,
    TaskResponse,
    AISuggestPlanRequest,
)
from app.services.planner_service import planner_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/study-plans", tags=["Study Planner"])


@router.get("/goals", response_model=List[GoalResponse])
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = (
        db.query(StudyGoal)
        .filter(StudyGoal.user_id == current_user.id)
        .order_by(StudyGoal.created_at.desc())
        .all()
    )
    # Recalculate progress
    for g in goals:
        if g.tasks:
            completed_count = sum(1 for t in g.tasks if t.is_completed)
            g.progress_percentage = int((completed_count / len(g.tasks)) * 100)
    db.commit()
    return goals


@router.post("/goals", response_model=GoalResponse)
def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = StudyGoal(
        user_id=current_user.id,
        title=goal_in.title,
        description=goal_in.description,
        target_date=goal_in.target_date,
        status="active",
        progress_percentage=0,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{id}")
def delete_goal(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(StudyGoal).filter(StudyGoal.id == id, StudyGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target belajar tidak ditemukan.")
    db.delete(goal)
    db.commit()
    return {"message": "Target belajar berhasil dihapus."}


@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    goal_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudyTask).filter(StudyTask.user_id == current_user.id)
    if goal_id:
        query = query.filter(StudyTask.goal_id == goal_id)
    return query.order_by(StudyTask.is_completed.asc(), StudyTask.due_date.asc()).all()


@router.post("/tasks", response_model=TaskResponse)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = StudyTask(
        user_id=current_user.id,
        goal_id=task_in.goal_id,
        title=task_in.title,
        subject=task_in.subject,
        duration_minutes=task_in.duration_minutes or 30,
        due_date=task_in.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{id}/toggle", response_model=TaskResponse)
def toggle_task(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(StudyTask).filter(StudyTask.id == id, StudyTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tugas tidak ditemukan.")

    now = datetime.now(timezone.utc)
    task.is_completed = not task.is_completed
    task.completed_at = now if task.is_completed else None

    # If completed, automatically record a study session for the duration!
    if task.is_completed:
        session = StudySession(
            user_id=current_user.id,
            subject=task.subject or "Tugas Mandiri",
            duration_minutes=task.duration_minutes,
            activity_type="task",
            notes=f"Menyelesaikan tugas: {task.title}",
        )
        db.add(session)

    # Update goal progress
    if task.goal_id:
        goal = db.query(StudyGoal).filter(StudyGoal.id == task.goal_id).first()
        if goal and goal.tasks:
            completed_count = sum(1 for t in goal.tasks if t.is_completed)
            goal.progress_percentage = int((completed_count / len(goal.tasks)) * 100)
            if goal.progress_percentage == 100:
                goal.status = "completed"
            elif goal.status == "completed":
                goal.status = "active"

    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{id}")
def delete_task(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(StudyTask).filter(StudyTask.id == id, StudyTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tugas tidak ditemukan.")
    db.delete(task)
    db.commit()
    return {"message": "Tugas berhasil dihapus."}


@router.post("/suggest")
async def suggest_plan(
    req: AISuggestPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI suggests daily study tasks breakdown and optionally creates goal."""
    plan = await planner_service.suggest_study_plan(
        subject=req.subject,
        goal_description=req.goal_description,
        days_available=req.days_available or 7,
        hours_per_day=req.hours_per_day or 2.0,
        model=req.model,
    )
    return plan
