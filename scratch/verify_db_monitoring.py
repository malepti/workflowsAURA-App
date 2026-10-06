import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal

from app.models.all_models import DeveloperApiKey, User, CreditAccount, CreditLedgerEntry

async def check():
    async with AsyncSessionLocal() as session:
        # Check Key
        res = await session.execute(
            select(DeveloperApiKey).where(DeveloperApiKey.api_key == "sk-aura-01ee1b723c5e65a2d02321f1dba7b928b380a0ee")
        )
        key_obj = res.scalar_one_or_none()
        if key_obj:
            print(f"[Key Monitor] Key Name: {key_obj.name}")
            print(f"[Key Monitor] Key Masked: {key_obj.key_masked}")
            print(f"[Key Monitor] Is Active: {key_obj.is_active}")
            print(f"[Key Monitor] Created At: {key_obj.created_at}")
            print(f"[Key Monitor] Last Used At (Updated!): {key_obj.last_used_at}")

            # Check User & Balance
            u_res = await session.execute(select(User).where(User.id == key_obj.user_id))
            user = u_res.scalar_one_or_none()
            if user:
                print(f"[Key Monitor] Associated User: {user.full_name} ({user.email})")

            c_res = await session.execute(select(CreditAccount).where(CreditAccount.user_id == key_obj.user_id))
            acc = c_res.scalar_one_or_none()
            if acc:
                print(f"[Key Monitor] Current Credit Balance: {acc.balance}")

            # Check Ledger
            l_res = await session.execute(
                select(CreditLedgerEntry)
                .where(CreditLedgerEntry.user_id == key_obj.user_id)
                .order_by(CreditLedgerEntry.created_at.desc())
            )
            entries = l_res.scalars().all()
            print(f"[Key Monitor] Total Usage Transactions Recorded: {len(entries)}")
            if entries:
                latest = entries[0]
                print(f"[Key Monitor] Latest Audit Entry: Amount={latest.amount}, Reason='{latest.audit_reason}', Balance After={latest.balance_after}")

asyncio.run(check())
