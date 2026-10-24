import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.study_plan import StudyGoal, StudyTask
from app.models.review import ReviewCard
from app.services.agent_service import study_agent

router = APIRouter(prefix="/agent-copilot", tags=["Autonomous Multi-Agent Co-Pilot"])


class ExecuteMissionRequest(BaseModel):
    user_prompt: str = Field(..., description="Instruksi misi belajar bebas dari pengguna")
    model: Optional[str] = None


class ApplyMissionPlanRequest(BaseModel):
    mission_title: str
    actionable_plan: List[Dict[str, Any]]
    generated_flashcards: Optional[List[Dict[str, Any]]] = None


@router.post("/execute")
async def execute_copilot_mission(
    req: ExecuteMissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Executes an autonomous ReAct loop study co-pilot mission."""
    if not req.user_prompt.strip():
        raise HTTPException(status_code=400, detail="Instruksi misi tidak boleh kosong.")

    result = await study_agent.run_mission(
        user_prompt=req.user_prompt,
        user_id=current_user.id,
        db=db,
        model=req.model,
    )
    return result


@router.post("/apply-mission")
def apply_mission_to_study_plan(
    req: ApplyMissionPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Converts co-pilot mission output into actual StudyGoal, StudyTasks, and ReviewCards."""
    # 1. Create Study Goal
    goal = StudyGoal(
        user_id=current_user.id,
        title=req.mission_title,
        target_minutes=sum(d.get("recommended_duration_minutes", 30) for d in req.actionable_plan),
        current_minutes=0,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    # 2. Create Study Tasks
    task_count = 0
    for day_plan in req.actionable_plan:
        day_label = day_plan.get("day", "Hari")
        focus = day_plan.get("focus", "")
        for t_text in day_plan.get("tasks", []):
            task = StudyTask(
                user_id=current_user.id,
                goal_id=goal.id,
                title=f"[{day_label}] {t_text} ({focus})",
                is_completed=False,
            )
            db.add(task)
            task_count += 1

    # 3. Create Flashcards if provided
    card_count = 0
    if req.generated_flashcards:
        for card_data in req.generated_flashcards:
            front = card_data.get("front", "").strip()
            back = card_data.get("back", "").strip()
            if front and back:
                card = ReviewCard(
                    user_id=current_user.id,
                    front=front,
                    back=back,
                    subject="Co-Pilot Mission",
                    tags=["co-pilot", "agent-generated"],
                    ease_factor=2.5,
                    interval_days=1,
                    repetitions=0,
                )
                db.add(card)
                card_count += 1

    db.commit()

    return {
        "success": True,
        "goal_id": goal.id,
        "tasks_created": task_count,
        "flashcards_created": card_count,
        "message": f"Berhasil menjadwalkan {task_count} tugas belajar dan {card_count} kartu memori!",
    }
