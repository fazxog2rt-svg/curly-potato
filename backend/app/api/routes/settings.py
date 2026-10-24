from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.config import settings
from app.ai.guts_client import guts_client, GutsAIError

router = APIRouter(prefix="/settings", tags=["Application Settings"])


class TestAIResponse(BaseModel):
    success: bool
    message: str
    model: str
    latency_ms: Optional[float] = None


@router.get("")
def get_system_settings():
    # Mask API key safely: show only prefix and length if present, never full key
    api_key_configured = bool(settings.GUTS_API_KEY and settings.GUTS_API_KEY.strip())
    masked_key = ""
    if api_key_configured:
        key = settings.GUTS_API_KEY.strip()
        masked_key = key[:7] + "..." + key[-4:] if len(key) > 12 else "sk-guts-***"

    db_type = "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite"

    return {
        "app_name": settings.APP_NAME,
        "app_env": settings.APP_ENV,
        "gutsai_base_url": settings.GUTSAI_BASE_URL,
        "gutsai_api_key_configured": api_key_configured,
        "gutsai_masked_key": masked_key,
        "gutsai_default_model": settings.GUTSAI_DEFAULT_MODEL,
        "database_type": db_type,
        "storage_provider": settings.STORAGE_PROVIDER,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
    }


@router.post("/test-ai", response_model=TestAIResponse)
async def test_ai_connection():
    if not settings.GUTS_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="GUTS_API_KEY belum dikonfigurasi di file .env backend.",
        )

    try:
        res = await guts_client.chat_completion(
            messages=[
                {"role": "system", "content": "You are a test agent."},
                {"role": "user", "content": "Katakan 'Koneksi Berhasil' dalam 2 kata."},
            ],
            model=settings.GUTSAI_DEFAULT_MODEL,
            max_tokens=20,
        )
        return TestAIResponse(
            success=True,
            message=f"Koneksi ke GutsAI berhasil! Respons: {res['content'].strip()}",
            model=res["model"],
            latency_ms=res["latency_ms"],
        )
    except GutsAIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menguji koneksi: {str(e)}")
