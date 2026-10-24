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

# ----------------------------------------------------------------------
# Mount and Serve Unified Next.js Frontend (Single-Host Deployment)
# ----------------------------------------------------------------------
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check possible locations for exported Next.js frontend
possible_paths = [
    os.getenv("FRONTEND_DIST"),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/out")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend/out")),
    os.path.abspath(os.path.join(os.getcwd(), "out")),
]

frontend_dist = next((p for p in possible_paths if p and os.path.exists(p)), None)

if frontend_dist and os.path.exists(frontend_dist):
    # Mount _next static folder (chunks, css, images)
    _next_dist = os.path.join(frontend_dist, "_next")
    if os.path.exists(_next_dist):
        app.mount("/_next", StaticFiles(directory=_next_dist), name="next_static")

    @app.get("/{full_path:path}")
    async def serve_frontend_spa(full_path: str):
        # Exclude API endpoints, Swagger, and OpenAPI schema
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Check for direct file match (e.g. favicon.ico, file.svg)
        direct_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(direct_file):
            return FileResponse(direct_file)

        # Check for page.html match (e.g. /tutor -> tutor.html)
        html_file = os.path.join(frontend_dist, f"{full_path}.html")
        if full_path and os.path.isfile(html_file):
            return FileResponse(html_file)

        # Fallback to index.html (Dashboard SPA root)
        index_html = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_html):
            return FileResponse(index_html)

        return JSONResponse(
            status_code=404,
            content={"detail": "Frontend page not found in build directory"},
        )
