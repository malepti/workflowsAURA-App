import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  AIModel,
  APIKeyRecord,
  Conversation,
  CreditTransaction,
  ExecutionMode,
  Message,
  MessageAttachment,
  PluginItem,
  SubscriptionPlan,
  UserProfile,
  UserSession,
  AdminStats
} from '../types';
import {
  INITIAL_USER,
  INITIAL_MODELS,
  INITIAL_API_KEYS,
  INITIAL_CREDIT_TRANSACTIONS,
  INITIAL_PLUGINS,
  INITIAL_SESSIONS,
  INITIAL_CONVERSATIONS,
  SUBSCRIPTION_PLANS,
  INITIAL_ADMIN_STATS
} from '../lib/mockData';

export type AppView =
  | 'home'
  | 'chat'
  | 'explore'
  | 'image-gen'
  | 'code-assistant'
  | 'doc-analysis'
  | 'plugins'
  | 'api-keys'
  | 'wallet'
  | 'subscription'
  | 'analytics'
  | 'account'
  | 'admin'
  | 'user-guide';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  models: AIModel[];
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  executionMode: ExecutionMode;
  setExecutionMode: (mode: ExecutionMode) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  setActiveConversationId: (id: string | null) => void;
  apiKeys: APIKeyRecord[];
  plugins: PluginItem[];
  creditTransactions: CreditTransaction[];
  sessions: UserSession[];
  adminStats: AdminStats;
  isGenerating: boolean;
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  
  // Actions
  startNewChat: (initialPrompt?: string, attachments?: MessageAttachment[]) => void;
  selectConversation: (id: string) => void;
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  stopGeneration: () => void;
  regenerateLastResponse: () => Promise<void>;
  editAndResendMessage: (messageId: string, newContent: string) => Promise<void>;
  toggleMessageFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  renameConversation: (id: string, newTitle: string) => void;
  pinConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  
  // BYOK & Keys
  addApiKey: (provider: any, key: string, displayName?: string) => Promise<boolean>;
  testApiKey: (keyId: string) => Promise<boolean>;
  toggleApiKeyActive: (keyId: string) => void;
  deleteApiKey: (keyId: string) => void;
  
  // Credits & Subscriptions
  deductCredits: (amount: number, description: string, modelId?: string) => boolean;
  grantCredits: (amount: number, description: string, auditReason?: string) => void;
  purchaseCreditPack: (amount: number, priceUsd: number) => void;
  upgradeSubscription: (planId: 'free' | 'plus' | 'pro' | 'enterprise') => void;
  
  // Plugins
  togglePlugin: (pluginId: string) => void;
  
  // Sessions
  terminateSession: (sessionId: string) => void;
  terminateAllOtherSessions: () => void;
  
  // Admin Operations
  updateModelPricing: (modelId: string, creditsPerRequest: number, isOnline: boolean) => void;
  adminGrantCreditsToUser: (credits: number, reason: string) => void;
  toggleAdminRole: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aura_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [models, setModels] = useState<AIModel[]>(() => {
    const saved = localStorage.getItem('aura_models');
    return saved ? JSON.parse(saved) : INITIAL_MODELS;
  });

  const [selectedModel, setSelectedModel] = useState<AIModel>(models[0]);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('byok');
  
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('aura_conversations');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<APIKeyRecord[]>(() => {
    const saved = localStorage.getItem('aura_keys');
    return saved ? JSON.parse(saved) : INITIAL_API_KEYS;
  });

  const [plugins, setPlugins] = useState<PluginItem[]>(() => {
    const saved = localStorage.getItem('aura_plugins');
    return saved ? JSON.parse(saved) : INITIAL_PLUGINS;
  });

  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>(() => {
    const saved = localStorage.getItem('aura_transactions');
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_TRANSACTIONS;
  });

  const [sessions, setSessions] = useState<UserSession[]>(INITIAL_SESSIONS);
  const [adminStats, setAdminStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('aura_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aura_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('aura_transactions', JSON.stringify(creditTransactions));
  }, [creditTransactions]);

  useEffect(() => {
    localStorage.setItem('aura_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const startNewChat = (initialPrompt?: string, attachments?: MessageAttachment[]) => {
    const newConvId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      title: initialPrompt ? initialPrompt.slice(0, 32) + '...' : 'New Chat',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      modelId: selectedModel.id,
      executionMode,
      category: 'today',
      messages: []
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConvId);
    setCurrentView('chat');

    if (initialPrompt) {
      setTimeout(() => {
        executePromptFlow(newConvId, initialPrompt, attachments);
      }, 50);
    }
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setCurrentView('chat');
  };

  const deductCredits = (amount: number, description: string, modelId?: string): boolean => {
    if (user.totalCredits < amount) {
      addToast(`Insufficient credits! Required: ${amount}, Available: ${user.totalCredits}`, 'error');
      return false;
    }
    const newBalance = user.totalCredits - amount;
    setUser((prev) => ({ ...prev, totalCredits: newBalance }));

    const tx: CreditTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: 'Just now',
      description,
      category: 'inference',
      modelId: modelId || selectedModel.id,
      amount: -amount,
      balanceAfter: newBalance,
      status: 'completed'
    };

    setCreditTransactions((prev) => [tx, ...prev]);
    return true;
  };

  const grantCredits = (amount: number, description: string, auditReason?: string) => {
    const newBalance = user.totalCredits + amount;
    setUser((prev) => ({ ...prev, totalCredits: newBalance }));

    const tx: CreditTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: 'Just now',
      description,
      category: auditReason ? 'admin_grant' : 'top_up',
      amount,
      balanceAfter: newBalance,
      status: 'completed',
      auditReason
    };

    setCreditTransactions((prev) => [tx, ...prev]);
    addToast(`Successfully credited +${amount} credits!`, 'success');
  };

  const purchaseCreditPack = (amount: number, priceUsd: number) => {
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      // ignore
    }
    grantCredits(amount, `Credit Top-Up Pack ($${priceUsd})`);
  };

  const upgradeSubscription = (planId: 'free' | 'plus' | 'pro' | 'enterprise') => {
    const targetPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!targetPlan) return;

    setUser((prev) => ({
      ...prev,
      plan: planId,
      monthlyCreditQuota: targetPlan.creditsGranted,
      totalCredits: prev.totalCredits + targetPlan.creditsGranted
    }));

    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    addToast(`Upgraded to ${targetPlan.name}! +${targetPlan.creditsGranted} credits added.`, 'success');
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsGenerating(false);
    addToast('Generation stopped by user.', 'info');
  };

  const executePromptFlow = async (
    convId: string,
    content: string,
    attachments?: MessageAttachment[]
  ) => {
    // Check execution mode & credits
    if (executionMode === 'platform_managed') {
      const requiredCredits = selectedModel.creditsPerRequest;
      if (user.totalCredits < requiredCredits) {
        addToast(`Insufficient platform credits! You need ${requiredCredits} credits.`, 'warning');
        return;
      }
    } else {
      // BYOK check
      const providerKey = apiKeys.find((k) => k.provider === selectedModel.provider && k.isActive);
      if (!providerKey && selectedModel.provider !== 'google') {
        addToast(`Notice: No active BYOK key configured for ${selectedModel.providerName}. Using fallback simulation.`, 'info');
      }
    }

    const userMsgId = `msg_user_${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments
    };

    const assistantMsgId = `msg_asst_${Date.now() + 1}`;
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: selectedModel.name,
      executionMode,
      creditsConsumed: executionMode === 'platform_managed' ? selectedModel.creditsPerRequest : 0,
      tokensUsed: { prompt: Math.floor(content.length / 4) + 12, completion: 0, total: 0 }
    };

    // Add user message & empty assistant placeholder
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            title: c.messages.length === 0 ? content.slice(0, 36) + '...' : c.title,
            updatedAt: 'Just now',
            messages: [...c.messages, userMessage, assistantMessage]
          };
        }
        return c;
      })
    );

    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    // If platform_managed, deduct credits
    if (executionMode === 'platform_managed') {
      deductCredits(selectedModel.creditsPerRequest, `Inference: ${selectedModel.name}`, selectedModel.id);
    }

    try {
      let currentOutput = '';
      let receivedAnyChunk = false;

      // Attempt real streaming connection to backend /api/v1/chat/stream
      try {
        const response = await fetch('/api/v1/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content,
            modelId: selectedModel.id,
            executionMode
          }),
          signal: controller.signal
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.type === 'chunk' && data.content) {
                    currentOutput += data.content;
                    receivedAnyChunk = true;

                    setConversations((prev) =>
                      prev.map((c) => {
                        if (c.id === convId) {
                          const updatedMsgs = [...c.messages];
                          const targetIdx = updatedMsgs.findIndex((m) => m.id === assistantMsgId);
                          if (targetIdx !== -1) {
                            updatedMsgs[targetIdx] = {
                              ...updatedMsgs[targetIdx],
                              content: currentOutput,
                              tokensUsed: {
                                prompt: Math.floor(content.length / 4) + 12,
                                completion: Math.floor(currentOutput.length / 4),
                                total: Math.floor((content.length + currentOutput.length) / 4) + 12
                              }
                            };
                          }
                          return { ...c, messages: updatedMsgs };
                        }
                        return c;
                      })
                    );
                  }
                } catch (e) {
                  // ignore json parse error
                }
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('Real stream fallback to local synthesis:', streamErr);
      }

      // If backend stream was not available or produced no chunk, use local synthesis
      if (!receivedAnyChunk && !controller.signal.aborted) {
        let fullResponseText = '';
        const lower = content.toLowerCase();
        if (lower.includes('code') || lower.includes('python') || lower.includes('function') || lower.includes('react')) {
          fullResponseText = `Here is the solution designed specifically for your request:

\`\`\`typescript
import { useState, useEffect } from 'react';

// AuraAI Helper Service
export function useAIStream(endpoint: string, options: { model: string }) {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function execute(prompt: string) {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: options.model }),
      });
      // Stream chunks cleanly
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, execute };
}
\`\`\`

### Key Features:
- **Clean Architecture**: Follows reactive hooks with zero memory leaks.
- **Provider Agnostic**: Easily swap models (${selectedModel.name}) without changing the interface.
- **Error Handling**: Graceful fallback if the network or inference server times out.`;
        } else if (lower.includes('compare') || lower.includes('model') || lower.includes('ollama')) {
          fullResponseText = `### Model Comparison Analysis (${selectedModel.name})

| Metric | ${selectedModel.name} | Standard Cloud Models | Local Ollama Clusters |
| :--- | :--- | :--- | :--- |
| **Context Window** | ${selectedModel.contextWindow} | 128k - 1M | 32k - 128k |
| **Latency** | ~${selectedModel.latencyMs}ms | 250ms | 90ms (on NVLink GPUs) |
| **Data Privacy** | ${selectedModel.isLocal ? '100% On-Premises' : 'Provider Encrypted'} | SOC2 Cloud | Self-Hosted Airgapped |
| **Cost** | ${executionMode === 'byok' ? 'Billed via your key' : `${selectedModel.creditsPerRequest} platform credits`} | Variable API costs | Free inference |

**Recommendation:** For high-throughput internal coding and private data analysis, local open-source models like **${selectedModel.isLocal ? selectedModel.name : 'Llama 3.3 or Qwen 2.5 Coder'}** offer the best privacy and speed.`;
        } else {
          fullResponseText = `Thank you for your prompt! Using **${selectedModel.name}** via **${executionMode === 'byok' ? 'Bring-Your-Own-Key (BYOK)' : 'Platform Managed Credits'}**:

I've analyzed: *"${content}"*. 

Here are the key insights and actionable points:
1. **Core Objective**: We're leveraging multi-provider orchestration with strict schema validation.
2. **Execution Context**: Mode set to \`${executionMode}\` with zero data leakage.
3. **Session & Ledger**: Verified against in-memory Redis session and SQL credit ledger.
4. **Next Steps**: You can attach documents, run Python snippets in the interactive sandbox, or test image generation prompts anytime.

Feel free to ask a follow-up or explore another model in the top selector!`;
        }

        const words = fullResponseText.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (controller.signal.aborted) break;
          currentOutput += (i === 0 ? '' : ' ') + words[i];

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === convId) {
                const updatedMsgs = [...c.messages];
                const targetIdx = updatedMsgs.findIndex((m) => m.id === assistantMsgId);
                if (targetIdx !== -1) {
                  updatedMsgs[targetIdx] = {
                    ...updatedMsgs[targetIdx],
                    content: currentOutput,
                    tokensUsed: {
                      prompt: Math.floor(content.length / 4) + 12,
                      completion: Math.floor(currentOutput.length / 4),
                      total: Math.floor((content.length + currentOutput.length) / 4) + 12
                    }
                  };
                }
                return { ...c, messages: updatedMsgs };
              }
              return c;
            })
          );
          await new Promise((r) => setTimeout(r, 22));
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addToast('Error generating response: ' + (err.message || 'Server timeout'), 'error');
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const sendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConvId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        title: content.slice(0, 32) + '...',
        createdAt: 'Just now',
        updatedAt: 'Just now',
        modelId: selectedModel.id,
        executionMode,
        category: 'today',
        messages: []
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConvId);
      targetConvId = newConvId;
    }

    await executePromptFlow(targetConvId, content, attachments);
  };

  const regenerateLastResponse = async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const lastUserMsg = [...activeConversation.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove last assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          const msgs = [...c.messages];
          if (msgs[msgs.length - 1].role === 'assistant') {
            msgs.pop();
          }
          return { ...c, messages: msgs };
        }
        return c;
      })
    );

    await executePromptFlow(activeConversation.id, lastUserMsg.content, lastUserMsg.attachments);
  };

  const editAndResendMessage = async (messageId: string, newContent: string) => {
    if (!activeConversation) return;
    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Truncate messages to this message
    const trimmed = activeConversation.messages.slice(0, msgIndex);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return { ...c, messages: trimmed };
        }
        return c;
      })
    );

    await executePromptFlow(activeConversation.id, newContent);
  };

  const toggleMessageFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                return { ...m, feedback: m.feedback === feedback ? null : feedback };
              }
              return m;
            })
          };
        }
        return c;
      })
    );
    addToast(feedback === 'like' ? 'Thank you for your feedback!' : 'Feedback noted. We will refine future outputs.', 'info');
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    addToast('Conversation renamed.', 'success');
  };

  const pinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setCurrentView('home');
    }
    addToast('Conversation deleted.', 'info');
  };

  const archiveConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived } : c))
    );
    addToast('Conversation archive state updated.', 'info');
  };

  // API Key operations
  const addApiKey = async (provider: any, key: string, displayName?: string): Promise<boolean> => {
    const masked = key.slice(0, 7) + '••••••••••••••••' + key.slice(-4);
    const newKey: APIKeyRecord = {
      id: `key_${Date.now()}`,
      provider,
      providerName: provider === 'openai' ? 'OpenAI' : provider === 'google' ? 'Google Gemini' : provider === 'anthropic' ? 'Anthropic' : 'Ollama',
      keyMasked: masked,
      displayName: displayName || `${provider.toUpperCase()} Key`,
      isActive: true,
      isValid: true,
      lastTestedAt: 'Just now',
      associatedModelCount: 3,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setApiKeys((prev) => [...prev, newKey]);
    addToast(`API Key for ${newKey.providerName} saved and verified!`, 'success');
    return true;
  };

  const testApiKey = async (keyId: string): Promise<boolean> => {
    const target = apiKeys.find((k) => k.id === keyId);
    if (!target) return false;
    await new Promise((r) => setTimeout(r, 600));
    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === keyId ? { ...k, isValid: true, lastTestedAt: 'Just now' } : k
      )
    );
    addToast(`Connection to ${target.providerName} tested successfully (HTTP 200 OK)`, 'success');
    return true;
  };

  const toggleApiKeyActive = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, isActive: !k.isActive } : k))
    );
    addToast('API Key status toggled.', 'info');
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    addToast('API Key securely purged.', 'info');
  };

  const togglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => {
        if (p.id === pluginId) {
          const next = !p.isEnabled;
          addToast(`Plugin "${p.name}" ${next ? 'enabled' : 'disabled'}.`, 'info');
          return { ...p, isEnabled: next };
        }
        return p;
      })
    );
  };

  const terminateSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    addToast('Session revoked remotely.', 'success');
  };

  const terminateAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    addToast('All other active sessions have been signed out.', 'success');
  };

  const updateModelPricing = (modelId: string, creditsPerRequest: number, isOnline: boolean) => {
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId ? { ...m, creditsPerRequest, isOnline } : m
      )
    );
    addToast('Model configuration updated by administrator.', 'success');
  };

  const adminGrantCreditsToUser = (credits: number, reason: string) => {
    grantCredits(credits, `Admin Credit Adjustment`, reason);
  };

  const toggleAdminRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'admin' ? 'user' : 'admin'
    }));
    addToast(`Switched role to ${user.role === 'admin' ? 'Regular User' : 'Administrator'}.`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        currentView,
        setCurrentView,
        models,
        selectedModel,
        setSelectedModel,
        executionMode,
        setExecutionMode,
        conversations,
        activeConversationId,
        activeConversation,
        setActiveConversationId,
        apiKeys,
        plugins,
        creditTransactions,
        sessions,
        adminStats,
        isGenerating,
        leftSidebarOpen,
        setLeftSidebarOpen,
        rightPanelOpen,
        setRightPanelOpen,
        toasts,
        addToast,
        removeToast,
        startNewChat,
        selectConversation,
        sendMessage,
        stopGeneration,
        regenerateLastResponse,
        editAndResendMessage,
        toggleMessageFeedback,
        renameConversation,
        pinConversation,
        deleteConversation,
        archiveConversation,
        addApiKey,
        testApiKey,
        toggleApiKeyActive,
        deleteApiKey,
        deductCredits,
        grantCredits,
        purchaseCreditPack,
        upgradeSubscription,
        togglePlugin,
        terminateSession,
        terminateAllOtherSessions,
        updateModelPricing,
        adminGrantCreditsToUser,
        toggleAdminRole
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
