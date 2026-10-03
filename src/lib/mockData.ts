import {
  AIModel,
  APIKeyRecord,
  Conversation,
  CreditTransaction,
  PluginItem,
  SubscriptionPlan,
  UserProfile,
  UserSession,
  AdminStats
} from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_rupasree_01',
  name: 'Rupasree Kamineni',
  email: 'rupasreekamineni@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  role: 'admin', // Admin access available for full console testing
  plan: 'free',
  planRenewalDate: '2026-11-01',
  totalCredits: 250,
  monthlyCreditQuota: 250,
  twoFactorEnabled: true,
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    priceMonthly: 0,
    priceAnnual: 0,
    creditsGranted: 250,
    description: 'Perfect for exploring multi-model AI, testing BYOK, and basic daily questions.',
    features: [
      '250 monthly platform credits',
      'Unlimited Bring-Your-Own-Key (BYOK)',
      'Access to standard local & cloud models',
      'Basic chat history (up to 30 days)',
      'Standard rate limits (10 req/min)',
      'File uploads up to 5MB'
    ],
    maxRequestsPerMin: 10,
    maxFileSizeMb: 5,
    rolloverSupported: false
  },
  {
    id: 'plus',
    name: 'Plus Plan',
    priceMonthly: 15,
    priceAnnual: 144,
    creditsGranted: 1500,
    description: 'For active creators, coders, and power users needing higher credit limits.',
    features: [
      '1,500 monthly platform credits',
      'All local Ollama models (Llama 3.3, Qwen Coder)',
      'Faster priority inference queue',
      'Uncapped chat history & instant export',
      'Rate limits up to 30 req/min',
      'File & document uploads up to 25MB',
      'Unused credits rollover (up to 3,000)'
    ],
    maxRequestsPerMin: 30,
    maxFileSizeMb: 25,
    rolloverSupported: true,
    badge: 'Popular'
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    priceMonthly: 30,
    priceAnnual: 288,
    creditsGranted: 4000,
    description: 'Full horsepower for engineers and researchers demanding reasoning models and vision.',
    features: [
      '4,000 monthly platform credits',
      'Access to DeepSeek R1 & GPT-4o Platform Managed',
      'High-throughput local GPU priority',
      'Advanced Code Sandbox & Document vector Q&A',
      'High rate limits (60 req/min)',
      'Large uploads up to 100MB',
      'Full credit rollover & priority email support'
    ],
    maxRequestsPerMin: 60,
    maxFileSizeMb: 100,
    rolloverSupported: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 99,
    priceAnnual: 950,
    creditsGranted: 15000,
    description: 'Organization-grade AI workspace with team controls, custom inference endpoints, and SSO.',
    features: [
      '15,000+ monthly credits or custom billing',
      'Dedicated private Ollama cluster integration',
      'SSO (SAML, Okta, Google Workspace)',
      'Custom usage policies & role-based permissions',
      'Audit log exports and SOC2 compliance',
      'Dedicated account manager & 99.9% uptime SLA'
    ],
    maxRequestsPerMin: 120,
    maxFileSizeMb: 500,
    rolloverSupported: true
  }
];

export const INITIAL_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    providerName: 'Google Gemini',
    description: 'Ultra-fast multimodal model with 1M context window. Excellent for writing, analysis, and rapid chats.',
    contextWindow: '1M tokens',
    creditsPerRequest: 2,
    estimatedCostUsd: 0.0004,
    isLocal: false,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: true,
      reasoning: true,
      webSearch: true,
      functionCalling: true
    },
    allowedPlans: ['free', 'plus', 'pro', 'enterprise'],
    latencyMs: 140,
    badge: 'Recommended'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    providerName: 'OpenAI',
    description: 'Flagship omni model with strong reasoning, vision, and natural conversational depth.',
    contextWindow: '128k tokens',
    creditsPerRequest: 4,
    estimatedCostUsd: 0.005,
    isLocal: false,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: true,
      reasoning: true,
      webSearch: true,
      functionCalling: true
    },
    allowedPlans: ['free', 'plus', 'pro', 'enterprise'],
    latencyMs: 220,
    badge: 'Flagship'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    description: 'Industry-leading intelligence for coding, nuanced writing, and complex multi-step reasoning.',
    contextWindow: '200k tokens',
    creditsPerRequest: 5,
    estimatedCostUsd: 0.006,
    isLocal: false,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: true,
      reasoning: true,
      webSearch: false,
      functionCalling: true
    },
    allowedPlans: ['plus', 'pro', 'enterprise'],
    latencyMs: 280
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B Instruct',
    provider: 'ollama',
    providerName: 'Admin Local / Ollama',
    description: 'State-of-the-art open source model hosted on internal Ollama cluster. Fully private and fast.',
    contextWindow: '128k tokens',
    creditsPerRequest: 3,
    estimatedCostUsd: 0.0,
    isLocal: true,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: false,
      reasoning: true,
      webSearch: false,
      functionCalling: true
    },
    allowedPlans: ['free', 'plus', 'pro', 'enterprise'],
    latencyMs: 180,
    badge: 'Local Cluster'
  },
  {
    id: 'deepseek-r1-distill',
    name: 'DeepSeek R1 Distill',
    provider: 'ollama',
    providerName: 'Admin Local / Ollama',
    description: 'Powerful reasoning and chain-of-thought model specialized in math, logic puzzles, and algorithmic code.',
    contextWindow: '64k tokens',
    creditsPerRequest: 3,
    estimatedCostUsd: 0.0,
    isLocal: true,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: false,
      reasoning: true,
      webSearch: false,
      functionCalling: false
    },
    allowedPlans: ['plus', 'pro', 'enterprise'],
    latencyMs: 310,
    badge: 'Reasoning'
  },
  {
    id: 'qwen-2-5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'ollama',
    providerName: 'Admin Local / Ollama',
    description: 'Local code generation powerhouse. Rivals leading proprietary models in refactoring and debugging.',
    contextWindow: '32k tokens',
    creditsPerRequest: 2,
    estimatedCostUsd: 0.0,
    isLocal: true,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: false,
      reasoning: true,
      webSearch: false,
      functionCalling: true
    },
    allowedPlans: ['free', 'plus', 'pro', 'enterprise'],
    latencyMs: 160,
    badge: 'Code Expert'
  },
  {
    id: 'mistral-nemo-12b',
    name: 'Mistral NeMo 12B',
    provider: 'ollama',
    providerName: 'Admin Local / Ollama',
    description: 'Lightweight local workhorse for summarization, quick translations, and low-latency workflows.',
    contextWindow: '128k tokens',
    creditsPerRequest: 1,
    estimatedCostUsd: 0.0,
    isLocal: true,
    isOnline: true,
    status: 'active',
    capabilities: {
      code: true,
      vision: false,
      reasoning: false,
      webSearch: false,
      functionCalling: true
    },
    allowedPlans: ['free', 'plus', 'pro', 'enterprise'],
    latencyMs: 95
  }
];

export const INITIAL_API_KEYS: APIKeyRecord[] = [
  {
    id: 'key_openai_1',
    provider: 'openai',
    providerName: 'OpenAI',
    keyMasked: 'sk-proj-••••••••••••••••4829',
    displayName: 'Personal OpenAI Key',
    isActive: true,
    isValid: true,
    lastTestedAt: '2026-10-02 18:40',
    associatedModelCount: 4,
    createdAt: '2026-09-15'
  },
  {
    id: 'key_google_1',
    provider: 'google',
    providerName: 'Google Gemini',
    keyMasked: 'AIzaSy••••••••••••••••8912',
    displayName: 'Google Studio Key',
    isActive: true,
    isValid: true,
    lastTestedAt: '2026-10-03 01:10',
    associatedModelCount: 3,
    createdAt: '2026-09-20'
  },
  {
    id: 'key_anthropic_1',
    provider: 'anthropic',
    providerName: 'Anthropic',
    keyMasked: 'sk-ant-api03-••••••••••7721',
    displayName: 'Anthropic Claude Key',
    isActive: false,
    isValid: true,
    lastTestedAt: '2026-09-28 14:15',
    associatedModelCount: 2,
    createdAt: '2026-09-22'
  },
  {
    id: 'key_ollama_1',
    provider: 'ollama',
    providerName: 'Local Ollama Server',
    keyMasked: 'http://localhost:11434 (No Auth)',
    displayName: 'Internal Ollama Endpoint',
    isActive: true,
    isValid: true,
    lastTestedAt: '2026-10-03 01:50',
    associatedModelCount: 4,
    createdAt: '2026-08-10'
  }
];

export const INITIAL_CREDIT_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx_01',
    timestamp: '2026-10-03 01:45',
    description: 'Local Model Inference: Llama 3.3 70B',
    category: 'inference',
    modelId: 'llama-3-3-70b',
    amount: -3,
    balanceAfter: 250,
    status: 'completed'
  },
  {
    id: 'tx_02',
    timestamp: '2026-10-02 21:12',
    description: 'Python Sandbox Code Execution (Analysis Plugin)',
    category: 'code_execution',
    amount: -2,
    balanceAfter: 253,
    status: 'completed'
  },
  {
    id: 'tx_03',
    timestamp: '2026-10-02 16:30',
    description: 'Image Generation Studio (Aura Vector Art)',
    category: 'image_gen',
    amount: -5,
    balanceAfter: 255,
    status: 'completed'
  },
  {
    id: 'tx_04',
    timestamp: '2026-10-01 09:00',
    description: 'Monthly Free Plan Credit Allocation',
    category: 'subscription_grant',
    amount: 250,
    balanceAfter: 260,
    status: 'completed'
  },
  {
    id: 'tx_05',
    timestamp: '2026-09-24 11:20',
    description: 'Admin Welcome Bonus Grant',
    category: 'admin_grant',
    amount: 50,
    balanceAfter: 270,
    status: 'completed',
    auditReason: 'Early Access Community Grant'
  }
];

export const INITIAL_PLUGINS: PluginItem[] = [
  {
    id: 'plug_search',
    name: 'Web Search & Grounding',
    category: 'Search',
    description: 'Enables live internet browsing, duckduckgo search, and automated citation retrieval for real-time news.',
    isEnabled: true,
    isBuiltIn: true,
    iconName: 'Globe',
    permissions: ['Network outbound', 'Extract URLs'],
    status: 'connected',
    author: 'AuraAI Official',
    usageCount: 1420
  },
  {
    id: 'plug_doc',
    name: 'File & Document Analysis',
    category: 'Developer',
    description: 'Parses PDFs, spreadsheets, Word docs, and codebases with deep vector semantic search and summarization.',
    isEnabled: true,
    isBuiltIn: true,
    iconName: 'FileText',
    permissions: ['Read uploaded files', 'Extract text'],
    status: 'connected',
    author: 'AuraAI Official',
    usageCount: 890
  },
  {
    id: 'plug_code',
    name: 'Code Sandbox & Execution',
    category: 'Developer',
    description: 'Secure, sandboxed interpreter for Python, JavaScript, and shell snippets with instant stdout and chart outputs.',
    isEnabled: true,
    isBuiltIn: true,
    iconName: 'Terminal',
    permissions: ['Isolated VM runner', 'Capture standard output'],
    status: 'connected',
    author: 'AuraAI Official',
    usageCount: 1105
  },
  {
    id: 'plug_image',
    name: 'Image Generation Studio',
    category: 'Creative',
    description: 'Text-to-image prompt engine with aspect ratio controls, lighting styles, and artistic rendering presets.',
    isEnabled: true,
    isBuiltIn: true,
    iconName: 'Sparkles',
    permissions: ['Asset generation', 'Export PNG/WebP'],
    status: 'connected',
    author: 'AuraAI Official',
    usageCount: 640
  },
  {
    id: 'plug_gdrive',
    name: 'Google Drive Integration',
    category: 'Productivity',
    description: 'Directly browse and import your Google Docs, Sheets, and Slides into the chat workspace.',
    isEnabled: false,
    isBuiltIn: false,
    iconName: 'HardDrive',
    permissions: ['Read Drive metadata', 'Import file stream'],
    status: 'needs_auth',
    author: 'Google Workspace',
    usageCount: 310
  },
  {
    id: 'plug_calendar',
    name: 'Calendar & Event Scheduler',
    category: 'Productivity',
    description: 'Automates scheduling, checks attendee availability, and drafts event summaries from conversations.',
    isEnabled: false,
    isBuiltIn: false,
    iconName: 'Calendar',
    permissions: ['Read calendar events', 'Create appointment draft'],
    status: 'needs_auth',
    author: 'AuraAI Official',
    usageCount: 195
  }
];

export const INITIAL_SESSIONS: UserSession[] = [
  {
    id: 'sess_01',
    device: 'MacBook Pro 16" (macOS Sonoma)',
    browser: 'Chrome 124.0',
    ipAddress: '198.51.100.42',
    location: 'San Francisco, CA, USA',
    isCurrent: true,
    lastActive: 'Active Now',
    createdAt: '2026-10-02 08:30'
  },
  {
    id: 'sess_02',
    device: 'iPhone 15 Pro (iOS 18)',
    browser: 'Mobile Safari 18.0',
    ipAddress: '198.51.100.89',
    location: 'San Francisco, CA, USA',
    isCurrent: false,
    lastActive: '2 hours ago',
    createdAt: '2026-10-01 19:15'
  },
  {
    id: 'sess_03',
    device: 'Dell XPS 15 (Windows 11)',
    browser: 'Microsoft Edge 123.0',
    ipAddress: '203.0.113.19',
    location: 'Austin, TX, USA',
    isCurrent: false,
    lastActive: '3 days ago',
    createdAt: '2026-09-29 11:42'
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_01',
    title: 'AI Agent Architecture Guide',
    createdAt: '2026-10-03 01:20',
    updatedAt: '2026-10-03 01:45',
    modelId: 'llama-3-3-70b',
    executionMode: 'platform_managed',
    isPinned: true,
    category: 'today',
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Explain how to design an AI Agent system with tool orchestration, provider adapters, and credit metering.',
        timestamp: '01:20'
      },
      {
        id: 'msg_2',
        role: 'assistant',
        content: `### Multi-Model Agent Architecture with Tool Orchestration

Building a modern AI platform like **AuraAI** requires separating concerns into modular architectural pillars:

1. **Provider Adapter Layer**:
   - Normalize requests across OpenAI, Anthropic, Gemini, and local Ollama inference servers.
   - Standardize streaming output via Server-Sent Events (SSE).
   
2. **Execution & Billing Isolation**:
   - **Mode A (BYOK)**: User brings their own API key. Inference is billed directly to the provider. Platform credit charge: **0**.
   - **Mode B (Platform Managed)**: The platform provides GPU power or managed endpoints, debiting internal credits atomically from the ledger.

3. **Tool & Plugin Sandbox**:
   - Web search for fresh data retrieval.
   - Sandboxed Python runtime for data visualization.
   - Enforce strict permission grants and timeouts.

\`\`\`typescript
interface AgentExecutionPlan {
  modelId: string;
  executionMode: 'byok' | 'platform_managed';
  tools: ('web_search' | 'code_sandbox')[];
  maxCreditsAllocated: number;
}
\`\`\`

Would you like to explore setting up an Ollama local cluster or testing BYOK keys?`,
        timestamp: '01:21',
        modelUsed: 'Llama 3.3 70B Instruct',
        executionMode: 'platform_managed',
        creditsConsumed: 3,
        tokensUsed: { prompt: 142, completion: 285, total: 427 }
      }
    ]
  },
  {
    id: 'conv_02',
    title: 'React & Tailwind Animations',
    createdAt: '2026-10-03 00:30',
    updatedAt: '2026-10-03 00:45',
    modelId: 'gemini-2.5-flash',
    executionMode: 'byok',
    category: 'today',
    messages: [
      {
        id: 'msg_3',
        role: 'user',
        content: 'Give me a clean Tailwind CSS card design with soft borders, subtle lavender accents, and smooth hover elevation.',
        timestamp: '00:30'
      },
      {
        id: 'msg_4',
        role: 'assistant',
        content: `Here is a lightweight card component tailored to our design system:

\`\`\`html
<div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
      ✦
    </div>
    <div>
      <h3 class="font-semibold text-slate-900">Modern SaaS Card</h3>
      <p class="text-xs text-slate-500">Subtle accents and clear hierarchy</p>
    </div>
  </div>
</div>
\`\`\``,
        timestamp: '00:31',
        modelUsed: 'Gemini 2.5 Flash',
        executionMode: 'byok',
        creditsConsumed: 0,
        tokensUsed: { prompt: 58, completion: 140, total: 198 }
      }
    ]
  },
  {
    id: 'conv_03',
    title: 'Ollama Local Model Setup',
    createdAt: '2026-10-02 18:10',
    updatedAt: '2026-10-02 18:35',
    modelId: 'qwen-2-5-coder-32b',
    executionMode: 'platform_managed',
    category: 'yesterday',
    messages: [
      {
        id: 'msg_5',
        role: 'user',
        content: 'How do we connect our local Ollama inference server at http://localhost:11434 to AuraAI?',
        timestamp: '18:10'
      },
      {
        id: 'msg_6',
        role: 'assistant',
        content: `You can configure your local Ollama instance in the **Admin Console** or under **API Keys & Endpoints**:

1. Ensure Ollama is running: \`ollama serve\`
2. Verify \`OLLAMA_ORIGINS=* ollama serve\` if making cross-origin browser calls, or route through our FastAPI / Express backend proxy at \`/api/v1/ollama\`.
3. Pull desired models: \`ollama pull llama3.3\` and \`ollama pull qwen2.5-coder:32b\`.`,
        timestamp: '18:11',
        modelUsed: 'Qwen 2.5 Coder 32B',
        executionMode: 'platform_managed',
        creditsConsumed: 2,
        tokensUsed: { prompt: 75, completion: 160, total: 235 }
      }
    ]
  },
  {
    id: 'conv_04',
    title: 'Database Schema for Credit Ledger',
    createdAt: '2026-09-29 14:00',
    updatedAt: '2026-09-29 14:20',
    modelId: 'gpt-4o',
    executionMode: 'byok',
    category: 'previous_7_days',
    messages: [
      {
        id: 'msg_7',
        role: 'user',
        content: 'Write an auditable PostgreSQL credit ledger table schema with idempotency keys and row locking.',
        timestamp: '14:00'
      },
      {
        id: 'msg_8',
        role: 'assistant',
        content: `Here is the production-grade PostgreSQL credit ledger schema:

\`\`\`sql
CREATE TABLE credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- negative for deduction, positive for grant
  category VARCHAR(64) NOT NULL,
  idempotency_key VARCHAR(128) UNIQUE,
  balance_after INTEGER NOT NULL,
  audit_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
\`\`\``,
        timestamp: '14:02',
        modelUsed: 'GPT-4o',
        executionMode: 'byok',
        creditsConsumed: 0
      }
    ]
  }
];

export const INITIAL_ADMIN_STATS: AdminStats = {
  totalUsers: 1482,
  activeUsers: 842,
  requestVolume: 48250,
  totalCreditsConsumed: 182500,
  providerCostsUsd: 324.50,
  localOllamaStatus: {
    status: 'healthy',
    modelsLoaded: 4,
    avgLatencyMs: 142,
    serverUrl: 'http://cluster-gpu.internal:11434'
  },
  errorRatePercent: 0.12
};
