import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, CheckConstraint
)
from typing import Optional
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

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
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts = relationship("ConnectedOAuth", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("EncryptedApiKey", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    credit_account = relationship("CreditAccount", uselist=False, back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("UserSubscription", back_populates="user", cascade="all, delete-orphan")
    generated_images = relationship("GeneratedImage", back_populates="user", cascade="all, delete-orphan")
    developer_api_keys = relationship("DeveloperApiKey", back_populates="user", cascade="all, delete-orphan")
    prompt_projects = relationship("PromptProject", back_populates="user", cascade="all, delete-orphan")

class GeneratedImage(Base):
    __tablename__ = "generated_images"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    prompt = Column(Text, nullable=False)
    aspect_ratio = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="generated_images")

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
    last_active_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="sessions")

class ConnectedOAuth(Base):
    __tablename__ = "connected_oauth_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(64), nullable=False) # 'google', 'github'
    oauth_uid = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    scopes = Column(JSON, default=list)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="oauth_accounts")

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(String(64), primary_key=True) # 'openai', 'google', 'anthropic', 'ollama'
    name = Column(String(128), nullable=False)
    website_url = Column(String(255), nullable=False)
    supports_byok = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

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
    created_at = Column(DateTime, default=get_utc_now)

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
    created_at = Column(DateTime, default=get_utc_now)

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
    current_period_start = Column(DateTime, default=get_utc_now)
    current_period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="subscriptions")

class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Float, default=250.0, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    __table_args__ = (
        CheckConstraint('balance >= 0', name='check_positive_credit_balance'),
    )

    user = relationship("User", back_populates="credit_account")

class CreditLedgerEntry(Base):
    __tablename__ = "credit_ledger_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False) # Negative for debit, positive for grant
    category = Column(String(64), nullable=False) # 'inference', 'image_gen', 'top_up', 'admin_grant'
    model_id = Column(String(64), nullable=True)
    balance_after = Column(Float, nullable=False)
    idempotency_key = Column(String(128), unique=True, nullable=True)
    audit_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    model_id = Column(String(64), nullable=False)
    execution_mode = Column(String(32), default="byok")
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

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
    credits_consumed = Column(Float, default=0.0)
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    feedback = Column(String(16), nullable=True)
    attachments = Column(JSON, default=list)
    created_at = Column(DateTime, default=get_utc_now)

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
    created_at = Column(DateTime, default=get_utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(255), nullable=False)
    action = Column(String(128), nullable=False)
    target = Column(String(255), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)

class DeveloperApiKey(Base):
    __tablename__ = "developer_api_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    api_key = Column(String(128), unique=True, nullable=False, index=True)
    key_masked = Column(String(64), nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="developer_api_keys")

# ==========================================
# PROMPT TESTING & VERSIONING STUDIO MODELS
# ==========================================

class PromptProject(Base):
    __tablename__ = "prompt_projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    slug = Column(String(128), index=True, nullable=False)
    description = Column(Text, nullable=True)
    active_production_version_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="prompt_projects")
    versions = relationship("PromptVersion", back_populates="project", cascade="all, delete-orphan", order_by="desc(PromptVersion.created_at)")
    test_cases = relationship("PromptTestCase", back_populates="project", cascade="all, delete-orphan", order_by="PromptTestCase.created_at")
    test_runs = relationship("PromptTestRun", back_populates="project", cascade="all, delete-orphan", order_by="desc(PromptTestRun.created_at)")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("prompt_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version_tag = Column(String(32), nullable=False) # e.g. "v1.0.0", "v1.1.0"
    system_prompt = Column(Text, nullable=False)
    user_template = Column(Text, nullable=False) # e.g. "Customer query: {{customer_query}}"
    model_id = Column(String(64), default="llama-3-3-70b")
    temperature = Column(Float, default=0.7)
    variables_schema = Column(JSON, default=list) # e.g. ["customer_query", "tier"]
    change_log = Column(Text, nullable=True)
    status = Column(String(32), default="draft") # 'production', 'staging', 'draft'
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("PromptProject", back_populates="versions")
    test_results = relationship("PromptTestResult", back_populates="version", cascade="all, delete-orphan")

class PromptTestCase(Base):
    __tablename__ = "prompt_test_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("prompt_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    input_variables = Column(JSON, default=dict) # e.g. {"customer_query": "Refund my order", "tier": "gold"}
    expected_output = Column(Text, nullable=True)
    assertion_type = Column(String(32), default="contains") # 'contains', 'not_contains', 'json_valid', 'regex', 'llm_judge'
    assertion_value = Column(String(255), nullable=True)
    tags = Column(JSON, default=list) # e.g. ["happy_path", "refund", "angry_customer"]
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("PromptProject", back_populates="test_cases")
    test_results = relationship("PromptTestResult", back_populates="test_case", cascade="all, delete-orphan")

class PromptTestRun(Base):
    __tablename__ = "prompt_test_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("prompt_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), default="completed") # 'running', 'completed', 'failed'
    total_cases = Column(Integer, default=0)
    completed_cases = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    total_cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("PromptProject", back_populates="test_runs")
    results = relationship("PromptTestResult", back_populates="run", cascade="all, delete-orphan")

class PromptTestResult(Base):
    __tablename__ = "prompt_test_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("prompt_test_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id = Column(String(36), ForeignKey("prompt_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    test_case_id = Column(String(36), ForeignKey("prompt_test_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String(64), nullable=False)
    rendered_prompt = Column(Text, nullable=False)
    actual_output = Column(Text, nullable=False)
    latency_ms = Column(Float, default=0.0)
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    passed = Column(Boolean, default=True)
    eval_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    run = relationship("PromptTestRun", back_populates="results")
    version = relationship("PromptVersion", back_populates="test_results")
    test_case = relationship("PromptTestCase", back_populates="test_results")


