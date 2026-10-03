# AuraAI — Multi-Model AI Chat Platform (FastAPI Backend)

A production-grade Python backend architecture for multi-model AI orchestration, Bring-Your-Own-Key (BYOK) credential encryption, admin-managed Ollama inference, and atomic credit ledger accounting.

## Architecture Highlights
- **Framework**: FastAPI with asynchronous routing (`async def`) and Pydantic V2 validation.
- **Database**: PostgreSQL with SQLAlchemy 2.0 async engine and Alembic migrations.
- **Cache & Rate Limiting**: Redis for session caching and rate limits.
- **AI Streaming**: Server-Sent Events (SSE) streaming with provider adapters.
- **Security**: AES-256-GCM encryption at rest for user API keys, Bcrypt password hashing, and HttpOnly session cookies.
- **Credit Accounting**: Auditable credit ledger preventing negative balances via PostgreSQL database-level `CHECK (balance >= 0)` constraints.

## Quickstart

### 1. Using Docker Compose
```bash
docker-compose up -d
```
This boots up:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379
- Ollama inference server on port 11434
- FastAPI application on port 8000

Interactive Swagger API docs will be accessible at: `http://localhost:8000/api/docs`.

### 2. Manual Local Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

### 3. Running Pytest Suite
```bash
pytest
```
