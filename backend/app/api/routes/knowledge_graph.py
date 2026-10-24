import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.knowledge_graph import KnowledgeNode, UserKnowledgeState
from app.services.bkt_engine import bkt_engine

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph & BKT"])

# Default seeded nodes if database is fresh
INITIAL_KNOWLEDGE_NODES = [
    {
        "id": "aljabar_dasar",
        "title": "Aljabar & Operasi Dasar",
        "subject": "Matematika",
        "description": "Manipulasi variabel, operasi aljabar, dan pemfaktoran bentuk kuadrat.",
        "difficulty": "beginner",
        "prerequisites": [],
        "tags": ["aljabar", "dasar"],
    },
    {
        "id": "fungsi_kuadrat",
        "title": "Fungsi & Persamaan Kuadrat",
        "subject": "Matematika",
        "description": "Menentukan akar-akar persamaan kuadrat, diskriminan, dan grafik parabola.",
        "difficulty": "intermediate",
        "prerequisites": ["aljabar_dasar"],
        "tags": ["aljabar", "persamaan"],
    },
    {
        "id": "turunan_dasar",
        "title": "Kalkulus: Diferensial (Turunan)",
        "subject": "Matematika",
        "description": "Konsep limit, aturan pangkat turunan, dan laju perubahan seketika.",
        "difficulty": "intermediate",
        "prerequisites": ["fungsi_kuadrat"],
        "tags": ["kalkulus", "turunan"],
    },
    {
        "id": "integral_dasar",
        "title": "Kalkulus: Integral & Anti-Turunan",
        "subject": "Matematika",
        "description": "Integral tak tentu, teorema dasar kalkulus, dan teknik substitusi sederhana.",
        "difficulty": "advanced",
        "prerequisites": ["turunan_dasar"],
        "tags": ["kalkulus", "integral"],
    },
    {
        "id": "integral_parsial",
        "title": "Teknik Lanjutan: Integral Parsial",
        "subject": "Matematika",
        "description": "Metode integrasi parsial udv = uv - vdu untuk fungsi perkalian majemuk.",
        "difficulty": "advanced",
        "prerequisites": ["integral_dasar"],
        "tags": ["kalkulus", "integral_lanjut"],
    },
    {
        "id": "hukum_newton_dasar",
        "title": "Kinematika & Hukum Gerak Newton",
        "subject": "Fisika",
        "description": "Hukum Inersia (I), F = ma (II), dan Aksi-Reaksi (III) dalam sistem mekanika.",
        "difficulty": "beginner",
        "prerequisites": ["aljabar_dasar"],
        "tags": ["mekanika", "gaya"],
    },
    {
        "id": "usaha_energi",
        "title": "Usaha & Kekekalan Energi Mekanik",
        "subject": "Fisika",
        "description": "Energi kinetik, potensial, dan teorema usaha-energi matematis.",
        "difficulty": "intermediate",
        "prerequisites": ["hukum_newton_dasar"],
        "tags": ["mekanika", "energi"],
    },
]


def seed_default_nodes_if_needed(db: Session):
    existing = db.query(KnowledgeNode).first()
    if not existing:
        for node_data in INITIAL_KNOWLEDGE_NODES:
            n = KnowledgeNode(
                id=node_data["id"],
                title=node_data["title"],
                subject=node_data["subject"],
                description=node_data["description"],
                difficulty=node_data["difficulty"],
                prerequisites=node_data["prerequisites"],
                tags=node_data["tags"],
            )
            db.add(n)
        db.commit()


class UpdateMasteryRequest(BaseModel):
    node_id: str
    is_correct: bool


@router.get("/nodes")
def get_knowledge_graph(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all knowledge nodes, their prerequisite graph, and current user BKT mastery."""
    seed_default_nodes_if_needed(db)

    query = db.query(KnowledgeNode)
    if subject and subject.lower() != "semua":
        query = query.filter(KnowledgeNode.subject.ilike(f"%{subject}%"))
    nodes = query.all()

    # Get user mastery states
    user_states = (
        db.query(UserKnowledgeState)
        .filter(UserKnowledgeState.user_id == current_user.id)
        .all()
    )
    states_dict = {s.node_id: s.p_know for s in user_states}

    nodes_list = []
    for n in nodes:
        p_know = states_dict.get(n.id, 0.15)
        nodes_list.append({
            "id": n.id,
            "title": n.title,
            "subject": n.subject,
            "description": n.description,
            "difficulty": n.difficulty,
            "prerequisites": n.prerequisites or [],
            "tags": n.tags or [],
            "p_know": p_know,
            "status": bkt_engine.classify_status(p_know),
        })

    # Recommended learning path
    recommended_path = bkt_engine.generate_recommended_path(nodes_list, states_dict)

    return {
        "nodes": nodes_list,
        "recommended_path": recommended_path,
        "total_concepts": len(nodes_list),
        "mastered_count": sum(1 for n in nodes_list if n["status"] == "mastered"),
    }


@router.post("/update-mastery")
def update_node_mastery(
    req: UpdateMasteryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates concept mastery via Bayesian Knowledge Tracing (BKT) engine."""
    node = db.query(KnowledgeNode).filter(KnowledgeNode.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node konsep tidak ditemukan.")

    state = (
        db.query(UserKnowledgeState)
        .filter(
            UserKnowledgeState.user_id == current_user.id,
            UserKnowledgeState.node_id == req.node_id,
        )
        .first()
    )

    if not state:
        state = UserKnowledgeState(
            user_id=current_user.id,
            node_id=req.node_id,
            p_know=0.15,
        )
        db.add(state)

    state.total_attempts += 1
    if req.is_correct:
        state.correct_attempts += 1

    # Execute BKT calculation
    updated_p = bkt_engine.update_mastery(
        current_p_know=state.p_know,
        is_correct=req.is_correct,
        p_slip=state.p_slip,
        p_guess=state.p_guess,
        p_transit=state.p_transit,
    )
    state.p_know = updated_p
    db.commit()
    db.refresh(state)

    return {
        "node_id": state.node_id,
        "title": node.title,
        "previous_mastery": state.p_know,
        "updated_mastery": updated_p,
        "status": bkt_engine.classify_status(updated_p),
        "total_attempts": state.total_attempts,
    }


@router.get("/diagnose/{node_id}")
def diagnose_node_weakness(
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backtracks prerequisite graph to find upstream bottleneck concepts."""
    nodes = db.query(KnowledgeNode).all()
    nodes_dict = {
        n.id: {
            "id": n.id,
            "title": n.title,
            "prerequisites": n.prerequisites or [],
            "difficulty": n.difficulty,
        }
        for n in nodes
    }

    user_states = (
        db.query(UserKnowledgeState)
        .filter(UserKnowledgeState.user_id == current_user.id)
        .all()
    )
    states_dict = {s.node_id: s.p_know for s in user_states}

    bottlenecks = bkt_engine.backtrack_weak_prerequisites(node_id, nodes_dict, states_dict)
    target_node = nodes_dict.get(node_id, {"title": node_id})

    return {
        "target_node": target_node,
        "target_mastery": states_dict.get(node_id, 0.15),
        "bottlenecks": bottlenecks,
        "diagnosis_summary": (
            f"Ditemukan {len(bottlenecks)} prasyarat rapuh yang menghambat penguasaan '{target_node.get('title')}'."
            if bottlenecks
            else f"Fondasi prasyarat untuk '{target_node.get('title')}' dalam kondisi solid!"
        ),
    }
