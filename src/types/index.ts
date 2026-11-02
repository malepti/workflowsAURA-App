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
  isLive?: boolean;
  requiresKey?: boolean;
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

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
  sourceType: 'live_web_search' | 'document_rag' | 'knowledge_base';
}

export interface PreResponseValidation {
  inputIntent: string;
  ambiguityScore: number;
  safetyCheckPassed: boolean;
  factualityConfidence: number;
  hallucinationRisk: 'Minimal' | 'Low' | 'Medium';
  groundingStatus: 'Live Web Grounded' | 'Internal Knowledge Verified' | 'Document RAG Grounded';
  validationTimestamp: string;
}

export interface WhyResponseRationale {
  userIntentSummary: string;
  responseStrategy: string;
  decisionDrivers: string[];
  alternativeApproachesConsidered?: string;
}

export interface MessageDiagnosis {
  providerOrigin: string;
  modelId: string;
  modelName: string;
  agentHelper: string;
  executionMode: ExecutionMode;
  encryptionStatus?: string;
  
  // Mandatory Information Sources & Live Search Provenance
  informationSources?: SearchSource[];
  searchQueryExecuted?: string;
  searchEngineUsed?: string;
  
  // Why We Gave That Response
  whyResponse?: WhyResponseRationale;
  
  // Pre-Response Validation & Guardrail Checks
  preResponseValidation?: PreResponseValidation;
  
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  creditsTaken: number;
  costUsdEquivalent: number;
  latencyMs: number;
  timeToFirstTokenMs: number;
  throughputTokensPerSec: number;
  finishReason: string;
  cacheHit: boolean;
  ledgerTxId?: string;
}

export interface HITLOption {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface HITLQuestion {
  id: string;
  prompt: string;
  options: HITLOption[];
  allowCustomText?: boolean;
  multiSelect?: boolean;
  status: 'pending' | 'answered' | 'skipped';
  selectedOptionIds?: string[];
  selectedOptionLabels?: string[];
  customResponse?: string;
  answeredAt?: string;
}

export interface HITLResponsePayload {
  conversationId: string;
  questionId: string;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  customText?: string;
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
  diagnosis?: MessageDiagnosis;
  hitlQuestion?: HITLQuestion;
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

export interface PromptVersion {
  id: string;
  versionTag: string;
  systemPrompt: string;
  userTemplate: string;
  modelId: string;
  temperature: number;
  variablesSchema: string[];
  changeLog?: string;
  status: 'production' | 'staging' | 'draft';
  createdAt?: string;
}

export interface PromptTestCase {
  id: string;
  name: string;
  inputVariables: Record<string, any>;
  expectedOutput?: string;
  assertionType: 'contains' | 'not_contains' | 'json_valid' | 'regex' | 'llm_judge';
  assertionValue?: string;
  tags?: string[];
  createdAt?: string;
}

export interface PromptTestResult {
  id: string;
  versionId: string;
  versionTag: string;
  testCaseId: string;
  testCaseName: string;
  modelId: string;
  renderedPrompt: string;
  actualOutput: string;
  latencyMs: number;
  tokensPrompt: number;
  tokensCompletion: number;
  costUsd: number;
  passed: boolean;
  evalNotes?: string;
  executionMode?: 'live_gemini' | 'live_ollama' | 'simulated';
}

export interface PromptTestRun {
  id: string;
  status: string;
  totalCases: number;
  completedCases: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  createdAt?: string;
}

export interface PromptProject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  activeProductionVersionId?: string;
  versionsCount: number;
  testCasesCount: number;
  createdAt?: string;
  updatedAt?: string;
}

