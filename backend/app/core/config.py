import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AI Study Companion"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    API_V1_STR: str = "/api"

    # Security
    AUTH_SECRET: str = "ai-study-companion-super-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # GutsAI Gateway Configuration
    # Official endpoint: https://api.gutsai.id/v1
    GUTS_API_KEY: str = ""
    GUTSAI_BASE_URL: str = "https://api.gutsai.id/v1"
    GUTSAI_DEFAULT_MODEL: str = "gemini-3.8-flash"
    GUTSAI_TIMEOUT_SECONDS: int = 60
    GUTSAI_MAX_RETRIES: int = 2

    # Database
    DATABASE_URL: str = "sqlite:///./study_companion.db"

    # Storage
    STORAGE_PROVIDER: str = "local"  # 'local' or 'supabase' / 's3'
    STORAGE_LOCAL_DIR: str = "./uploads"
    STORAGE_BUCKET: str = "study-companion-storage"
    MAX_UPLOAD_SIZE_MB: int = 25

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    def assemble_database_url(cls, v: str) -> str:
        # If PostgreSQL URL provided (e.g. Neon.tech), normalize dialect to postgresql+psycopg2://
        if v and ("postgres" in str(v)):
            url_str = str(v)
            if url_str.startswith("postgres://"):
                url_str = url_str.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url_str.startswith("postgresql://"):
                url_str = url_str.replace("postgresql://", "postgresql+psycopg2://", 1)
            return url_str
        # In Vercel serverless environment without Postgres, only /tmp is writable
        if os.getenv("VERCEL") == "1" and ("sqlite" in str(v) or not v):
            return "sqlite:////tmp/study_companion.db"
        return v or "sqlite:///./study_companion.db"

    @field_validator("STORAGE_LOCAL_DIR", mode="before")
    def assemble_storage_dir(cls, v: str) -> str:
        if os.getenv("VERCEL") == "1":
            return "/tmp/uploads"
        return v or "./uploads"

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
