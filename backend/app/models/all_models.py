import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(128), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    role = Column(String(32), default="user") # 'user' or 'admin'
    is_active = Column(Boolean, default=True)
    two_factor_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts = relationship("ConnectedOAuth", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("EncryptedApiKey", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    credit_account = relationship("CreditAccount", uselist=False, back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("UserSubscription", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_info = Column(String(255), nullable=False)
    browser_info = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=False)
    location = Column(String(128), nullable=True)
    refresh_token_hash = Column(String(255), nullable=True)
    is_current = Column(Boolean, default=False)
    last_active_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")

class ConnectedOAuth(Base):
    __tablename__ = "connected_oauth_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(64), nullable=False) # 'google', 'github'
    oauth_uid = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    scopes = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="oauth_accounts")

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(String(64), primary_key=True) # 'openai', 'google', 'anthropic', 'ollama'
    name = Column(String(128), nullable=False)
    website_url = Column(String(255), nullable=False)
    supports_byok = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(64), primary_key=True)
    provider_id = Column(String(64), ForeignKey("ai_providers.id"), nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    context_window = Column(String(64), default="128k")
    credits_per_request = Column(Integer, default=2)
    is_local = Column(Boolean, default=False)
    is_online = Column(Boolean, default=True)
    capabilities = Column(JSON, default=dict)
    allowed_plans = Column(JSON, default=list)
    latency_ms = Column(Integer, default=150)
    created_at = Column(DateTime, default=datetime.utcnow)

class EncryptedApiKey(Base):
    __tablename__ = "encrypted_api_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(String(64), ForeignKey("ai_providers.id"), nullable=False)
    display_name = Column(String(128), nullable=True)
    key_masked = Column(String(64), nullable=False)
    ciphertext_encrypted = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    is_valid = Column(Boolean, default=True)
    last_tested_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="api_keys")

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(32), primary_key=True) # 'free', 'plus', 'pro', 'enterprise'
    name = Column(String(64), nullable=False)
    price_monthly = Column(Float, default=0.0)
    price_annual = Column(Float, default=0.0)
    credits_granted = Column(Integer, default=250)
    max_requests_per_min = Column(Integer, default=10)
    max_file_size_mb = Column(Integer, default=5)
    rollover_supported = Column(Boolean, default=False)
    features = Column(JSON, default=list)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(32), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(32), default="active") # 'active', 'cancelled', 'past_due'
    current_period_start = Column(DateTime, default=datetime.utcnow)
    current_period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")

class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Integer, default=250, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('balance >= 0', name='check_positive_credit_balance'),
    )

    user = relationship("User", back_populates="credit_account")

class CreditLedgerEntry(Base):
    __tablename__ = "credit_ledger_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False) # Negative for debit, positive for grant
    category = Column(String(64), nullable=False) # 'inference', 'image_gen', 'top_up', 'admin_grant'
    model_id = Column(String(64), nullable=True)
    balance_after = Column(Integer, nullable=False)
    idempotency_key = Column(String(128), unique=True, nullable=True)
    audit_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    model_id = Column(String(64), nullable=False)
    execution_mode = Column(String(32), default="byok")
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(16), nullable=False) # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    model_used = Column(String(64), nullable=True)
    execution_mode = Column(String(32), nullable=True)
    credits_consumed = Column(Integer, default=0)
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    feedback = Column(String(16), nullable=True)
    attachments = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class PluginRegistry(Base):
    __tablename__ = "plugin_registry"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    is_built_in = Column(Boolean, default=True)
    icon_name = Column(String(64), default="Boxes")
    author = Column(String(128), default="AuraAI")
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(255), nullable=False)
    action = Column(String(128), nullable=False)
    target = Column(String(255), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
