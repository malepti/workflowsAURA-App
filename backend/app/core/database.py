import os
import ssl
from typing import Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

# Convert standard postgres URL prefixes to postgresql+asyncpg for async SQLAlchemy
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# On cloud deployments (e.g. Render), fallback to SQLite if default localhost PostgreSQL is specified
is_cloud = os.getenv("RENDER") is not None or os.getenv("PORT") is not None
if is_cloud and "localhost:5432" in db_url:
    print("Cloud deployment detected with localhost DATABASE_URL. Falling back to SQLite.")
    db_url = "sqlite+aiosqlite:///./sql_app.db"

engine_kwargs: Dict[str, Any] = {"echo": False, "future": True}


if db_url.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True
    })
    # If connecting to external cloud PostgreSQL (e.g. Render / Neon / Supabase), configure SSL
    if "localhost" not in db_url and "127.0.0.1" not in db_url:
        if "sslmode=" not in db_url and "ssl=" not in db_url:
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
            engine_kwargs["connect_args"] = {"ssl": ssl_ctx}

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


