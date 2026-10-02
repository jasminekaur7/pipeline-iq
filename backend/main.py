import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.models.database import init_db, SessionLocal
from backend.seed.seed_data import seed_database
from backend.api import (
    dashboard, accounts, decision_debt, decision_contracts,
    actions, self_audit, ai_copilot, decisions
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic Decision-Intelligence Platform for Business Pipelines — Find the decisions your business is quietly paying for.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure database is created and seeded
@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        seed_database(db, force=False)
    finally:
        db.close()

# Include Routers (API prefix: /api/...)
app.include_router(dashboard.router)
app.include_router(accounts.router)
app.include_router(decisions.router)
app.include_router(decision_debt.router)
app.include_router(decision_contracts.router)
app.include_router(actions.router)
app.include_router(self_audit.router)
app.include_router(self_audit.predictions_router)
app.include_router(ai_copilot.router)
app.include_router(ai_copilot.ask_router)

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "tagline": settings.PROJECT_TAGLINE
    }

# Check for production frontend build (e.g. on Railway or local preview)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_dir = os.path.join(base_dir, "frontend", "dist")
if not os.path.exists(dist_dir):
    dist_dir = os.path.abspath("frontend/dist")

if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not catch API or docs routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found")
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "tagline": settings.PROJECT_TAGLINE,
            "docs_url": "/docs",
            "health_url": "/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)

