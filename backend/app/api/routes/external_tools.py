import re
import httpx
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/tools", tags=["External Learning Tools"])


# --- Schemas ---

class CodeExecuteRequest(BaseModel):
    language: str
    code: str
    stdin: Optional[str] = ""

class CodeExecuteResponse(BaseModel):
    language: str
    version: Optional[str] = ""
    stdout: str
    stderr: str
    exit_code: int

class YouTubeAnalyzeRequest(BaseModel):
    url: str

class VisionSolveRequest(BaseModel):
    image_base64: str
    prompt: Optional[str] = "Pecahkan soal ini langkah demi langkah dengan rumus matematis dan penjelasan konseptual yang jelas."


# --- 1. Semantic Scholar Academic Paper Search API ---

@router.get("/academic/search")
async def search_academic_papers(
    query: str = Query(..., min_length=2, description="Kata kunci topik atau judul jurnal"),
    limit: int = Query(5, ge=1, le=10)
):
    """
    Search real peer-reviewed scientific papers via Semantic Scholar Graph API & OpenAlex.
    Includes automatic failover to OpenAlex (250M+ indexed research papers) if Semantic Scholar is rate-limited.
    """
    papers = []

    # 1. Try Semantic Scholar
    ss_url = "https://api.semanticscholar.org/graph/v1/paper/search"
    ss_params = {
        "query": query,
        "limit": limit,
        "fields": "title,authors,year,abstract,openAccessPdf,citationCount,url,fieldsOfStudy"
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(ss_url, params=ss_params, headers={"User-Agent": "EduApp/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("data", []):
                    authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
                    pdf_url = item.get("openAccessPdf", {}).get("url") if item.get("openAccessPdf") else None
                    first_author = authors[0].split()[-1] if authors else "Anonim"
                    year = item.get("year") or "n.d."
                    apa_citation = f"{first_author} et al. ({year}). {item.get('title')}."

                    papers.append({
                        "id": item.get("paperId"),
                        "title": item.get("title"),
                        "authors": authors[:4],
                        "year": item.get("year"),
                        "abstract": item.get("abstract") or "Abstrak tidak tersedia secara publik.",
                        "citation_count": item.get("citationCount", 0),
                        "url": item.get("url"),
                        "pdf_url": pdf_url,
                        "apa_citation": apa_citation,
                        "fields": item.get("fieldsOfStudy") or []
                    })
    except Exception:
        pass

    # 2. Resilient Fallback to OpenAlex if Semantic Scholar returned 0 or was rate-limited (429)
    if not papers:
        try:
            alex_url = "https://api.openalex.org/works"
            alex_params = {
                "search": query,
                "per_page": limit,
                "sort": "relevance_score:desc"
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                alex_resp = await client.get(alex_url, params=alex_params, headers={"User-Agent": "EduApp-Academic/1.0 (mailto:support@eduapp.local)"})
                if alex_resp.status_code == 200:
                    alex_data = alex_resp.json()
                    for item in alex_data.get("results", []):
                        authors = [
                            a.get("author", {}).get("display_name")
                            for a in item.get("authorships", [])
                            if a.get("author", {}).get("display_name")
                        ]
                        first_author = authors[0].split()[-1] if authors else "Anonim"
                        year = item.get("publication_year") or "n.d."
                        title = item.get("title") or "Untitled Academic Work"
                        apa_citation = f"{first_author} et al. ({year}). {title}."

                        # Reconstruct abstract from OpenAlex inverted index
                        abstract = ""
                        inv_index = item.get("abstract_inverted_index")
                        if inv_index and isinstance(inv_index, dict):
                            words_pos = {}
                            for w, positions in inv_index.items():
                                for pos in positions:
                                    words_pos[pos] = w
                            abstract = " ".join(words_pos[p] for p in sorted(words_pos.keys()))
                        if not abstract:
                            abstract = "Abstrak ringkas tersedia melalui tautan publikasi DOI."

                        pdf_url = item.get("open_access", {}).get("oa_url")
                        url = item.get("doi") or f"https://openalex.org/{item.get('id', '')}"

                        papers.append({
                            "id": item.get("id"),
                            "title": title,
                            "authors": authors[:4],
                            "year": year,
                            "abstract": abstract,
                            "citation_count": item.get("cited_by_count", 0),
                            "url": url,
                            "pdf_url": pdf_url,
                            "apa_citation": apa_citation,
                            "fields": [c.get("display_name") for c in item.get("concepts", [])[:3]]
                        })
        except Exception as e:
            return {"query": query, "total": 0, "papers": [], "error": str(e)}

    return {"query": query, "total": len(papers), "papers": papers}


# --- 2. Wikipedia Live Knowledge Enrichment API ---

@router.get("/wikipedia/summary")
async def get_wikipedia_summary(
    term: str = Query(..., min_length=1, description="Istilah atau nama tokoh yang ingin dicari"),
    lang: str = Query("id", pattern="^(id|en)$")
):
    """
    Fetch instant verified encyclopedic summary from Wikipedia REST API.
    """
    clean_term = term.strip().replace(" ", "_")
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{clean_term}"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers={"User-Agent": "AIStudyCompanion/2.0 (edtech; contact@studycompanion.id)"})
            if resp.status_code == 404 and lang == "id":
                # Fallback to English if not found in Indonesian
                fallback_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{clean_term}"
                resp = await client.get(fallback_url, headers={"User-Agent": "AIStudyCompanion/2.0"})

            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Informasi ensiklopedia tidak ditemukan.")

            data = resp.json()
            return {
                "title": data.get("title"),
                "extract": data.get("extract"),
                "description": data.get("description"),
                "thumbnail": data.get("thumbnail", {}).get("source") if data.get("thumbnail") else None,
                "page_url": data.get("content_urls", {}).get("desktop", {}).get("page")
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memuat Wikipedia: {str(e)}")


# --- 3. Interactive Code Runner API (Piston Sandbox API) ---

LANGUAGE_MAP = {
    "python": {"name": "python", "version": "3.10.0"},
    "py": {"name": "python", "version": "3.10.0"},
    "javascript": {"name": "javascript", "version": "18.15.0"},
    "js": {"name": "javascript", "version": "18.15.0"},
    "typescript": {"name": "typescript", "version": "5.0.3"},
    "ts": {"name": "typescript", "version": "5.0.3"},
    "c": {"name": "c", "version": "10.2.0"},
    "cpp": {"name": "c++", "version": "10.2.0"},
    "c++": {"name": "c++", "version": "10.2.0"},
    "java": {"name": "java", "version": "15.0.2"},
    "bash": {"name": "bash", "version": "5.2.0"},
    "sh": {"name": "bash", "version": "5.2.0"},
    "php": {"name": "php", "version": "8.2.3"},
    "go": {"name": "go", "version": "1.16.2"},
    "rust": {"name": "rust", "version": "1.68.2"},
}

@router.post("/code/execute", response_model=CodeExecuteResponse)
async def execute_code(req: CodeExecuteRequest):
    """
    Executes student programming code in a secure sandboxed environment via Piston API.
    Supports Python, JavaScript, TypeScript, C++, Java, Go, Rust, and more.
    """
    lang_key = req.language.lower().strip()
    config = LANGUAGE_MAP.get(lang_key, {"name": lang_key, "version": "*"})

    payload = {
        "language": config["name"],
        "version": config["version"],
        "files": [{"name": f"main.{lang_key}", "content": req.code}],
        "stdin": req.stdin or "",
        "run_timeout": 5000,
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post("https://emkc.org/api/v2/piston/execute", json=payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=500, detail="Mesin kompilasi sedang sibuk.")

            data = resp.json()
            run_data = data.get("run", {})
            return CodeExecuteResponse(
                language=data.get("language", config["name"]),
                version=data.get("version", ""),
                stdout=run_data.get("stdout", ""),
                stderr=run_data.get("stderr", ""),
                exit_code=run_data.get("code", 0)
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengeksekusi kode: {str(e)}")


# --- 4. YouTube Video Educational Analyzer & Summarizer ---

@router.post("/youtube/analyze")
async def analyze_youtube_video(req: YouTubeAnalyzeRequest, current_user: User = Depends(get_current_user)):
    """
    Analyzes YouTube video URL, fetches official video metadata, and synthesizes key takeaways & study flashcards.
    """
    # Extract video ID
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", req.url)
    if not match:
        raise HTTPException(status_code=400, detail="URL YouTube tidak valid. Gunakan format youtube.com/watch?v=... atau youtu.be/...")

    video_id = match.group(1)

    # 1. Fetch metadata via YouTube oEmbed
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    title = "Video Pembelajaran YouTube"
    author = "YouTube Educator"
    thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            oembed_resp = await client.get(oembed_url)
            if oembed_resp.status_code == 200:
                oembed_data = oembed_resp.json()
                title = oembed_data.get("title", title)
                author = oembed_data.get("author_name", author)
    except Exception:
        pass

    # 2. Call GutsAI LLM to produce deep academic summary & quiz from the video title & context
    prompt = f"""Kamu adalah pakar pedagogi AI Study Companion.
Seorang pelajar ingin mempelajari materi dari video YouTube berikut:
Judul Video: "{title}"
Pemateri / Channel: "{author}"
Tautan Video: https://www.youtube.com/watch?v={video_id}

Buatlah konten belajar komprehensif dalam format JSON murni:
{{
  "summary": "Ringkasan konsep utama dalam 3-4 kalimat mendalam.",
  "key_takeaways": [
    "Poin kunci 1",
    "Poin kunci 2",
    "Poin kunci 3",
    "Poin kunci 4"
  ],
  "quiz_questions": [
    {{
      "question": "Pertanyaan evaluasi 1",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correct_answer": "Pilihan A",
      "explanation": "Alasan mengapa pilihan A benar."
    }},
    {{
      "question": "Pertanyaan evaluasi 2",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correct_answer": "Pilihan B",
      "explanation": "Penjelasan konsep."
    }}
  ]
}}
Hanya kirimkan JSON murni tanpa markdown wrapper."""

    # Call GutsAI / LLM
    try:
        import json
        headers = {
            "Authorization": f"Bearer {settings.GUTS_API_KEY}",
            "Content-Type": "application/json",
        }
        llm_payload = {
            "model": settings.GUTSAI_DEFAULT_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4,
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            ai_resp = await client.post(f"{settings.GUTSAI_BASE_URL}/chat/completions", headers=headers, json=llm_payload)
            if ai_resp.status_code == 200:
                raw_content = ai_resp.json()["choices"][0]["message"]["content"].strip()
                cleaned_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_content, flags=re.MULTILINE).strip()
                parsed = json.loads(cleaned_json)
                return {
                    "video_id": video_id,
                    "title": title,
                    "author": author,
                    "thumbnail_url": thumbnail_url,
                    "summary": parsed.get("summary", ""),
                    "key_takeaways": parsed.get("key_takeaways", []),
                    "quiz_questions": parsed.get("quiz_questions", [])
                }
    except Exception as err:
        pass

    # Fallback response
    return {
        "video_id": video_id,
        "title": title,
        "author": author,
        "thumbnail_url": thumbnail_url,
        "summary": f"Video pembelajaran ini mengulas topik fundamental terkait {title}. Disajikan oleh {author} untuk membantu memperdalam penguasaan konsep.",
        "key_takeaways": [
            f"Memahami definisi dasar dari {title}",
            "Menganalisis prinsip kerja dan penerapannya dalam studi",
            "Mengevaluasi studi kasus dan latihan soal terkait"
        ],
        "quiz_questions": [
            {
                "question": f"Apa fokus utama dari pembahasan {title}?",
                "options": ["Memahami konsep inti dan aplikasi", "Menghafal rumus saja", "Melewatkan teori dasar", "Tidak berkaitan dengan studi"],
                "correct_answer": "Memahami konsep inti dan aplikasi",
                "explanation": "Fokus video adalah membangun pemahaman konseptual yang kokoh."
            }
        ]
    }


# --- 5. Snap & Solve (Multimodal Vision Problem Solver) ---

@router.post("/vision/solve")
async def solve_vision_problem(req: VisionSolveRequest, current_user: User = Depends(get_current_user)):
    """
    Receives image (base64) of handwritten notes, textbook questions, or math diagrams.
    Uses Multimodal Vision LLM to return step-by-step reasoning with formulas in LaTeX.
    """
    if not req.image_base64:
        raise HTTPException(status_code=400, detail="Data gambar base64 wajib diisi.")

    # Prepare Multimodal Payload for GutsAI
    image_url = req.image_base64
    if not image_url.startswith("data:"):
        image_url = f"data:image/jpeg;base64,{req.image_base64}"

    system_prompt = (
        "Kamu adalah AI Tutor Jenius dalam memecahkan soal matematika, fisika, kimia, biologi, dan sains. "
        "Baca soal atau catatan dalam gambar dengan teliti. "
        "Tuliskan:\n"
        "1. **Identifikasi Soal:** Transkripsikan isi soal secara tepat.\n"
        "2. **Konsep & Rumus Kunci:** Jelaskan teorema atau rumus yang relevan (gunakan LaTeX $$...$$ atau $...$).\n"
        "3. **Penyelesaian Langkah demi Langkah:** Tunjukkan setiap tahapan perhitungan dan penalaran dengan sangat jelas.\n"
        "4. **Jawaban Akhir & Kesimpulan:** Sorot jawaban akhir dalam kotak atau tebal.\n"
        "5. **Tips Belajar:** Berikan 1 tips agar tidak terjebak kesalahan umum pada tipe soal ini."
    )

    headers = {
        "Authorization": f"Bearer {settings.GUTS_API_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": settings.GUTSAI_DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": req.prompt or "Pecahkan soal ini langkah demi langkah."},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }
        ],
        "temperature": 0.2
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{settings.GUTSAI_BASE_URL}/chat/completions", headers=headers, json=payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Gagal memproses gambar dengan model Vision.")

            data = resp.json()
            solution = data["choices"][0]["message"]["content"]
            return {"solution": solution, "model": settings.GUTSAI_DEFAULT_MODEL}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kesalahan analisis gambar: {str(e)}")
