import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "LeaveDesk - HR Leave Management & AI Policy Assistant"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "leavedesk-super-secret-jwt-key-2026-production-ready")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database: Supports PostgreSQL (default in Docker/Production) and SQLite (easy local dev)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./leavedesk.db")
    
    # RAG / LLM Settings (optional API key; intelligent fallback built-in)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    POLICY_FILE_PATH: str = os.getenv("POLICY_FILE_PATH", "../policies/LeaveDesk_Employee_Handbook_2026.md")

settings = Settings()
