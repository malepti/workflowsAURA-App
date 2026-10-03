export type ExecutionMode = 'byok' | 'platform_managed';

export type AIProvider = 'openai' | 'google' | 'anthropic' | 'ollama' | 'groq' | 'mistral';

export interface ModelCapability {
  code: boolean;
  vision: boolean;
  reasoning: boolean;
  webSearch: boolean;
  functionCalling: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  providerName: string;
  description: string;
  contextWindow: string;
  creditsPerRequest: number; // For platform_managed
  estimatedCostUsd: number; // For BYOK tracking
  isLocal: boolean;
  isOnline: boolean;
  status: 'active' | 'beta' | 'maintenance' | 'offline';
  capabilities: ModelCapability;
  allowedPlans: ('free' | 'plus' | 'pro' | 'enterprise')[];
  latencyMs: number;
  badge?: string;
}

export interface APIKeyRecord {
  id: string;
  provider: AIProvider;
  providerName: string;
  keyMasked: string;
  displayName: string;
  isActive: boolean;
  isValid: boolean;
  lastTestedAt: string;
  associatedModelCount: number;
  createdAt: string;
}

export interface MessageAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  executionMode?: ExecutionMode;
  creditsConsumed?: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  attachments?: MessageAttachment[];
  feedback?: 'like' | 'dislike' | null;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  modelId: string;
  executionMode: ExecutionMode;
  isPinned?: boolean;
  isArchived?: boolean;
  category: 'today' | 'yesterday' | 'previous_7_days' | 'older';
  messages: Message[];
}

export interface CreditTransaction {
  id: string;
  timestamp: string;
  description: string;
  category: 'inference' | 'image_gen' | 'code_execution' | 'subscription_grant' | 'top_up' | 'admin_grant' | 'admin_revoke';
  modelId?: string;
  amount: number; // positive or negative
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed';
  auditReason?: string;
}

export interface SubscriptionPlan {
  id: 'free' | 'plus' | 'pro' | 'enterprise';
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  creditsGranted: number;
  description: string;
  features: string[];
  maxRequestsPerMin: number;
  maxFileSizeMb: number;
  rolloverSupported: boolean;
  badge?: string;
}

export interface PluginItem {
  id: string;
  name: string;
  category: 'Developer' | 'Search' | 'Productivity' | 'Creative' | 'Data';
  description: string;
  isEnabled: boolean;
  isBuiltIn: boolean;
  iconName: string;
  permissions: string[];
  status: 'connected' | 'needs_auth' | 'coming_soon';
  author: string;
  usageCount: number;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  plan: 'free' | 'plus' | 'pro' | 'enterprise';
  planRenewalDate: string;
  totalCredits: number;
  monthlyCreditQuota: number;
  twoFactorEnabled: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  requestVolume: number;
  totalCreditsConsumed: number;
  providerCostsUsd: number;
  localOllamaStatus: {
    status: 'healthy' | 'degraded' | 'offline';
    modelsLoaded: number;
    avgLatencyMs: number;
    serverUrl: string;
  };
  errorRatePercent: number;
}
