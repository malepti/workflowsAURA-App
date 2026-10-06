from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AuraAI — Multi-Model AI Chat Platform"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres123@localhost:5432/MVAI"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "auraai-dev-secret-key-32-chars-minimum-needed!!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    ENCRYPTION_MASTER_KEY: str = "super_secure_master_aes256_key!"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
