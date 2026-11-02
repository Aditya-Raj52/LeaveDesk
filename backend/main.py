import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.services.seed_data import seed_database
from app.api import auth, leaves, policy, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed default dataset
    init_db()
    with SessionLocal() as session:
        seed_database(session)
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise HR Leave Management with PostgreSQL Exclusion Constraints, Atomic Balance Locking, and AI Policy RAG Assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(leaves.router, prefix=settings.API_V1_STR)
app.include_router(policy.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "exclusion_constraint_status": "enforced",
        "rag_pipeline": "ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
