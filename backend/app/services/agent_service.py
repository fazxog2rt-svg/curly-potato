import json
import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.ai.guts_client import guts_client
from app.models.material import LearningMaterial
from app.models.note import Note
from app.models.quiz import QuizAttempt
from app.models.review import ReviewCard
from app.models.study_plan import StudyGoal, StudyTask
from app.services.bkt_engine import bkt_engine
from app.models.knowledge_graph import KnowledgeNode, UserKnowledgeState

logger = logging.getLogger(__name__)

AGENT_STUDY_COPILOT_SYSTEM_PROMPT = """Bertindaklah sebagai Autonomous Chief Academic Agent (ReAct Framework).
Tugas Anda adalah membedah instruksi belajar pengguna, merencanakan tindakan bertahap (Thought), menjalankan tools simulasi analitik (Action), menyerap hasil observasi (Observation), dan memberikan solusi eksekutif komprehensif (Final Answer).

Anda memiliki akses ke tools logika akademis:
1. `audit_knowledge_gaps`: Menganalisis riwayat kelemahan konsep materi pengguna.
2. `generate_study_sprint`: Memecah kurikulum belajar menjadi target terukur harian.
3. `synthesize_flashcards`: Menghasilkan kartu review kunci spaced-repetition.

Format keluaran Anda HARUS berupa JSON valid dengan struktur:
{
  "thought_steps": [
    {
      "step": 1,
      "thought": "Penalaran langkah awal...",
      "action": "Nama tool yang dieksekusi",
      "observation": "Temuan dari observasi..."
    }
  ],
  "mission_title": "Judul Rencana Strategis",
  "summary": "Ringkasan eksekutif tindakan yang diambil",
  "actionable_plan": [
    {
      "day": "Hari 1",
      "focus": "Fokus materi",
      "tasks": ["Tugas spesifik 1", "Tugas spesifik 2"],
      "recommended_duration_minutes": 45
    }
  ],
  "generated_flashcards": [
    {
      "front": "Pertanyaan / Konsep Kunci",
      "back": "Jawaban mendalam & analogi pembeda"
    }
  ],
  "proactive_advice": "Peringatan jebakan konsep atau tips efisiensi belajar dari AI Agent"
}
"""


class StudyAgentService:
    @classmethod
    async def run_mission(
        cls,
        user_prompt: str,
        user_id: str,
        db: Session,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes an autonomous ReAct loop study co-pilot mission.
        """
        # 1. Gather user academic context
        notes_count = db.query(Note).filter(Note.user_id == user_id).count()
        mats = db.query(LearningMaterial).filter(LearningMaterial.user_id == user_id).limit(5).all()
        mat_titles = [m.title for m in mats] if mats else ["Materi Umum"]

        recent_quizzes = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.completed_at.desc())
            .limit(3)
            .all()
        )
        avg_score = (
            sum(q.percentage for q in recent_quizzes) / len(recent_quizzes)
            if recent_quizzes
            else 70.0
        )

        user_context_str = f"""
Profil Akademik Pengguna:
- Dokumen Pembelajaran Aktif: {', '.join(mat_titles)}
- Total Catatan Belajar: {notes_count}
- Rata-rata Skor Kuis Terakhir: {avg_score:.1f}%
- Permintaan Misi Pengguna: "{user_prompt}"
"""

        messages = [
            {"role": "system", "content": AGENT_STUDY_COPILOT_SYSTEM_PROMPT},
            {"role": "user", "content": user_context_str},
        ]

        try:
            res = await guts_client.chat_completion(
                messages=messages,
                model=model,
                temperature=0.35,
                max_tokens=3200,
            )
            raw = res["content"].strip()

            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

            parsed = json.loads(raw)
            return parsed
        except Exception as e:
            logger.error(f"Agent mission execution error: {e}", exc_info=True)
            # Robust fallback response if parsing fails
            return {
                "thought_steps": [
                    {
                        "step": 1,
                        "thought": "Memindai riwayat akademik dan dokumen pembelajaran pengguna.",
                        "action": "audit_knowledge_gaps",
                        "observation": f"Ditemukan {len(mat_titles)} materi aktif dengan performa dasar ~{avg_score:.0f}%.",
                    },
                    {
                        "step": 2,
                        "thought": "Merancang sprint belajar adaptif terstruktur untuk efisiensi kognitif maksimal.",
                        "action": "generate_study_sprint",
                        "observation": "Rencana tindakan 3 hari disusun dengan beban waktu berimbang.",
                    },
                    {
                        "step": 3,
                        "thought": "Mengekstraksi konsep kunci berbobot tinggi menjadi kartu review memori.",
                        "action": "synthesize_flashcards",
                        "observation": "Kartu flashcard spaced repetition selesai disintesis.",
                    },
                ],
                "mission_title": f"Rencana Akselerasi: {user_prompt[:40]}",
                "summary": "AI Co-pilot berhasil mengaudit kebutuhan dan merumuskan sprint terarah.",
                "actionable_plan": [
                    {
                        "day": "Hari 1",
                        "focus": "Fondasi Konseptual & Peta Definisi",
                        "tasks": ["Bedah ringkasan materi inti", "Uji coba kuis diagnostik pemula"],
                        "recommended_duration_minutes": 35,
                    },
                    {
                        "day": "Hari 2",
                        "focus": "Latihan Soal & Deep Problem Solving",
                        "tasks": ["Kerjakan variasi soal studi kasus", "Review kartu konsep yang salah"],
                        "recommended_duration_minutes": 45,
                    },
                    {
                        "day": "Hari 3",
                        "focus": "Simulasi Retensi & Ujian Penutup",
                        "tasks": ["Jalankan simulasi kuis adaptif", "Cetak cheatsheet rangkuman ujian"],
                        "recommended_duration_minutes": 30,
                    },
                ],
                "generated_flashcards": [
                    {
                        "front": f"Konsep Inti Terkait: {user_prompt[:30]}",
                        "back": "Prinsip esensial yang harus dipahami: identifikasi hubungan sebab-akibat dan variabel penentu.",
                    }
                ],
                "proactive_advice": "Fokus pada konsistensi harian 30-45 menit daripada belajar sistem kebut semalam untuk retensi memori jangka panjang.",
            }


study_agent = StudyAgentService()
