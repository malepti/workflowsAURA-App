import asyncio
from sqlalchemy import text
from app.core.database import engine

async def alter_tables():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE credit_accounts ALTER COLUMN balance TYPE FLOAT;"))
        await conn.execute(text("ALTER TABLE credit_ledger_entries ALTER COLUMN amount TYPE FLOAT;"))
        await conn.execute(text("ALTER TABLE credit_ledger_entries ALTER COLUMN balance_after TYPE FLOAT;"))
        await conn.execute(text("ALTER TABLE messages ALTER COLUMN credits_consumed TYPE FLOAT;"))
    print("Tables altered successfully!")

if __name__ == "__main__":
    asyncio.run(alter_tables())
