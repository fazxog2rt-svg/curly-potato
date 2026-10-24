import json
import logging
from typing import List, Dict, Any, Optional
from app.ai.guts_client import guts_client

logger = logging.getLogger(__name__)

PLANNER_PROMPT_SYSTEM = """Anda adalah Expert Study Strategist & Learning Architect.
Tugas Anda adalah memecah target belajar besar menjadi langkah-langkah tugas harian yang realistis, terstruktur, dan terukur.

Format Keluaran Wajib (JSON murni):
{
  "tasks": [
    {
      "title": "Judul tugas langkah kecil",
      "subject": "Nama mata pelajaran",
      "duration_minutes": 30,
      "day_offset": 0 // 0 untuk hari pertama, 1 untuk hari kedua, dst.
    }
  ],
  "advice": "Tips strategis untuk menyelesaikan rencana belajar ini."
}
"""


class PlannerService:
    @staticmethod
    async def suggest_study_plan(
        subject: str,
        goal_description: str,
        days_available: int = 7,
        hours_per_day: float = 2.0,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured milestone tasks to achieve a study goal using GutsAI."""
        user_prompt = f"""Mata Pelajaran: {subject}
Target Belajar: {goal_description}
Waktu Tersedia: {days_available} hari
Durasi per Hari: {hours_per_day} jam

Pecah target belajar ini menjadi serangkaian tugas belajar terperinci dan spesifik per hari."""

        messages = [
            {"role": "system", "content": PLANNER_PROMPT_SYSTEM},
            {"role": "user", "content": user_prompt},
        ]

        resp = await guts_client.chat_completion(
            messages=messages,
            model=model,
            temperature=0.5,
            max_tokens=2000,
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
            return json.loads(content)
        except Exception as e:
            logger.error(f"Failed to parse study plan JSON: {e}")
            return {
                "tasks": [
                    {
                        "title": f"Mempelajari konsep dasar {subject}",
                        "subject": subject,
                        "duration_minutes": 45,
                        "day_offset": 0,
                    },
                    {
                        "title": f"Mengerjakan latihan soal {subject}",
                        "subject": subject,
                        "duration_minutes": 45,
                        "day_offset": 1,
                    },
                ],
                "advice": "Pelajari materi secara bertahap dan rutin lakukan evaluasi kuis.",
            }


planner_service = PlannerService()
