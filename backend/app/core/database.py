import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL or "sqlite+aiosqlite:///./sql_app.db"

# If postgresql URL points to localhost and we are in production on Render without local postgres, fall back to SQLite
if "localhost:5432" in db_url or "127.0.0.1:5432" in db_url:
    db_url = "sqlite+aiosqlite:///./sql_app.db"

engine_kwargs = {"echo": False, "future": True}

if db_url.startswith("postgresql"):
    engine_kwargs.update({"pool_size": 20, "max_overflow": 10})

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
