import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db
from app.ai.guts_client import GutsAIError

# Route imports
from app.api.routes import (
    auth,
    ai,
    conversations,
    materials,
    notes,
    quizzes,
    reviews,
    study_plans,
    memory,
    analytics,
    settings as app_settings,
    knowledge_graph,
    cat_exam,
    agent_copilot,
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO if settings.APP_DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ai_study_companion")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database tables...")
    init_db()
    logger.info("Application startup complete.")
    yield
    # Shutdown actions
    logger.info("Application shutdown.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Modern, AI-powered Personal Study Platform with GutsAI Gateway Integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"(http://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?)|(https://.*\.netlify\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(GutsAIError)
async def guts_ai_exception_handler(request: Request, exc: GutsAIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "GutsAI Gateway Error",
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "Terjadi kesalahan internal pada server. Silakan coba kembali nanti.",
        },
    )


# Health Check
@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint without leaking secrets."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "gateway": "GutsAI v1",
    }


# Include Modular Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(materials.router, prefix=settings.API_V1_STR)
app.include_router(notes.router, prefix=settings.API_V1_STR)
app.include_router(quizzes.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(study_plans.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(app_settings.router, prefix=settings.API_V1_STR)
app.include_router(knowledge_graph.router, prefix=settings.API_V1_STR)
app.include_router(cat_exam.router, prefix=settings.API_V1_STR)
app.include_router(agent_copilot.router, prefix=settings.API_V1_STR)
