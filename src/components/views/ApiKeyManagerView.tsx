import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, ShieldCheck, Cpu, Code2, 
  Terminal, ExternalLink, AlertTriangle, Eye, EyeOff, Lock, CheckCircle2, RefreshCw,
  Activity, Clock, Layers, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DeveloperKey {
  id: string;
  name: string;
  apiKey?: string;
  keyMasked: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export const ApiKeyManagerView: React.FC = () => {
  const { apiKeys, addApiKey, deleteApiKey, setCurrentView, creditTransactions } = useApp();
  const [activeTab, setActiveTab] = useState<'byok' | 'developer'>('developer');

  // BYOK Modal state
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);
  const [byokProvider, setByokProvider] = useState('openai');
  const [byokKey, setByokKey] = useState('');
  const [byokName, setByokName] = useState('');

  // Developer Key Modal state
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [devKeyName, setDevKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [developerKeys, setDeveloperKeys] = useState<DeveloperKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Snippet language tab
  const [snippetTab, setSnippetTab] = useState<'python' | 'node' | 'curl' | 'langchain'>('python');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Fetch developer keys on mount
  useEffect(() => {
    fetchDeveloperKeys();
  }, []);

  const rawApiBase = import.meta.env.VITE_API_URL || '';
  const apiBase = (!rawApiBase || rawApiBase.includes('workflowsaura-backend.onrender.com'))
    ? 'https://workflowsaura-app.onrender.com'
    : rawApiBase.replace(/\/+$/, '');

  const fetchDeveloperKeys = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('aura_token');
      const res = await fetch(`${apiBase}/api/v1/developer-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDeveloperKeys(data);
      }
    } catch (e) {
      console.error('Failed to fetch developer keys:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeveloperKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devKeyName.trim()) return;

    try {
      const token = localStorage.getItem('aura_token');
      const res = await fetch(`${apiBase}/api/v1/developer-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: devKeyName })
      });

      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.apiKey || null);
        setDeveloperKeys([data, ...developerKeys]);
        setDevKeyName('');
        setIsDevModalOpen(false);
      }
    } catch (e) {
      console.error('Error creating developer key:', e);
    }
  };

  const handleRevokeDeveloperKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this Developer API Key? Any external applications using it will lose access immediately.')) return;

    try {
      const token = localStorage.getItem('aura_token');
      const res = await fetch(`${apiBase}/api/v1/developer-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setDeveloperKeys(developerKeys.filter(k => k.id !== id));
      }
    } catch (e) {
      console.error('Error revoking developer key:', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAddByokKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!byokKey.trim()) return;

    await addApiKey(byokProvider, byokKey, byokName || `${byokProvider.toUpperCase()} Key`);
    setByokKey('');
    setByokName('');
    setIsByokModalOpen(false);
  };

  const baseUrl = `${apiBase || 'http://localhost:8000'}/v1`;


  // Compute key monitoring stats
  const activeKeysCount = developerKeys.filter(k => k.isActive).length;
  const lastActiveKey = developerKeys.find(k => k.lastUsedAt);

  const codeSnippets = {
    python: `import openai

# Connect external Python app to AuraAI Platform Local Ollama Model
client = openai.OpenAI(
    base_url="${baseUrl}",
    api_key="${developerKeys[0]?.keyMasked || 'sk-aura-your-developer-key'}"
)

response = client.chat.completions.create(
    model="qwen2.5-coder:32b", # Local Ollama Model
    messages=[
        {"role": "system", "content": "You are an AI coding assistant."},
        {"role": "user", "content": "Write a fast Python binary search implementation."}
    ],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`,

    node: `import OpenAI from 'openai';

// Connect external Node.js app to AuraAI Platform Local Ollama Model
const openai = new OpenAI({
  baseURL: '${baseUrl}',
  apiKey: '${developerKeys[0]?.keyMasked || 'sk-aura-your-developer-key'}',
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello from cross-platform Node.js!' }],
    model: 'qwen2.5-coder:32b',
  });

  console.log(completion.choices[0].message.content);
}

main();`,

    curl: `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${developerKeys[0]?.keyMasked || 'sk-aura-your-developer-key'}" \\
  -d '{
    "model": "qwen2.5-coder:32b",
    "messages": [{"role": "user", "content": "Hello cross-platform local model!"}]
  }'`,

    langchain: `from langchain_openai import ChatOpenAI

# Connect LangChain agents to Local Ollama via AuraAI Developer Key
llm = ChatOpenAI(
    openai_api_base="${baseUrl}",
    openai_api_key="${developerKeys[0]?.keyMasked || 'sk-aura-your-developer-key'}",
    model_name="qwen2.5-coder:32b"
)

response = llm.invoke("Explain microservices architecture in 3 bullet points")
print(response.content)`
  };

  return (
    <div className="flex-1 bg-[#F8FAFF] text-slate-800 min-h-screen overflow-y-auto p-6 md:p-8">
      {/* Header section */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Key className="w-4 h-4" />
              API Key & Integration Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">API Key Management & Monitoring</h1>
            <p className="text-sm text-slate-500 mt-1">
              Issue cross-platform Developer Keys to connect external apps (VSCode, LangChain, Python) to your Local Ollama model.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-[#131927] p-1.5 rounded-xl border border-gray-800/80 shadow-inner">
            <button
              onClick={() => setActiveTab('developer')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'developer'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              AuraAI Developer Keys
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                Platform
              </span>
            </button>

            <button
              onClick={() => setActiveTab('byok')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'byok'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              External Keys (BYOK)
            </button>
          </div>
        </div>

        {/* ================= TAB 1: AURA AI DEVELOPER KEYS ================= */}
        {activeTab === 'developer' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Developer Key Monitoring KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#131825] border border-gray-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Issued Developer Keys</div>
                  <div className="text-xl font-bold text-white mt-0.5">{developerKeys.length} Keys</div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-0.5">{activeKeysCount} Active</div>
                </div>
              </div>

              <div className="bg-[#131825] border border-gray-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Live Key Activity Monitoring</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Tracking Active API Calls
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {lastActiveKey?.lastUsedAt 
                      ? `Last API Call: ${new Date(lastActiveKey.lastUsedAt).toLocaleTimeString()}`
                      : 'Awaiting First API Call'}
                  </div>
                </div>
              </div>

              <div className="bg-[#131825] border border-gray-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Usage & Credit Audit</div>
                    <div className="text-xs text-gray-300 font-semibold mt-0.5">Token Deduction Logs</div>
                    <div className="text-[11px] text-indigo-400 mt-0.5">Real-time ledger tracking</div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('wallet')}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs"
                >
                  View Ledger <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-gray-900 border border-indigo-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-xl">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  Cross-Platform Access to Local Ollama & Cloud Models
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-normal border border-emerald-500/30">
                    OpenAI Compatible Base URL
                  </span>
                </h3>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Use your developer keys (<code className="text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">sk-aura-...</code>) to connect external tools (VSCode, LangChain, Cursor, Python scripts) directly to our local Ollama model (<code className="text-indigo-300">qwen2.5-coder:32b</code>). Every request automatically monitors token usage and updates key activity logs.
                </p>
              </div>
              <button
                onClick={() => setIsDevModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Developer Key
              </button>
            </div>

            {/* Keys Table Card */}
            <div className="bg-[#131825] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Your Active Developer Keys & Monitoring Log ({developerKeys.length})
                </h2>
                <button
                  onClick={fetchDeveloperKeys}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-800/50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Key Status
                </button>
              </div>

              {developerKeys.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto text-gray-500">
                    <Key className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-300">No Developer Keys Generated Yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Create a developer key to connect your local applications, scripts, or IDE extensions to our local models.
                  </p>
                  <button
                    onClick={() => setIsDevModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Key
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/60 overflow-x-auto">
                  {developerKeys.map((key) => (
                    <div key={key.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-800/20 transition-all">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{key.name}</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active & Monitored
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                            <code className="font-mono text-indigo-300 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                              {key.keyMasked}
                            </code>
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                            <span className="text-emerald-400 font-medium">
                              • Last API Call: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never used yet'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => copyToClipboard(key.keyMasked, key.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                          title="Copy Masked Key"
                        >
                          {copiedIndex === key.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRevokeDeveloperKey(key.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quickstart Integration Guide */}
            <div className="bg-[#131825] border border-gray-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    Cross-Platform Local Model Connection
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Use your Developer Key with our OpenAI-compatible base URL: <code className="text-indigo-300 font-mono">{baseUrl}</code>
                  </p>
                </div>
              </div>

              {/* Code Snippet Tabs */}
              <div className="flex gap-2 border-b border-gray-800/60 pb-2">
                {[
                  { id: 'python', label: 'Python (OpenAI SDK)' },
                  { id: 'node', label: 'Node.js (OpenAI SDK)' },
                  { id: 'curl', label: 'cURL / HTTP' },
                  { id: 'langchain', label: 'LangChain' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSnippetTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      snippetTab === tab.id
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Snippet Display */}
              <div className="relative bg-[#0A0D14] border border-gray-800/80 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                <button
                  onClick={() => copyToClipboard(codeSnippets[snippetTab], snippetTab)}
                  className="absolute top-3 right-3 p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-md transition-all flex items-center gap-1 text-[11px]"
                >
                  {copiedIndex === snippetTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedIndex === snippetTab ? 'Copied' : 'Copy Code'}
                </button>
                <pre className="pr-20 leading-relaxed">{codeSnippets[snippetTab]}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BYOK (BRING YOUR OWN KEY) ================= */}
        {activeTab === 'byok' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Zero Credit Policy Header Card */}
            <div className="bg-gradient-to-r from-emerald-950/30 via-teal-950/20 to-gray-900 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-xl">
              <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">
                  Zero Credit Deduction Policy & Encryption at Rest
                </h3>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  When using your own provider key (BYOK mode), requests route directly to providers (OpenAI, Gemini, Anthropic). AuraAI charges <strong className="text-emerald-400">0 platform credits</strong> for BYOK inference. All credentials are AES-256 encrypted at rest and masked in the UI.
                </p>
              </div>
              <button
                onClick={() => setIsByokModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Provider Key
              </button>
            </div>

            {/* BYOK Keys Table */}
            <div className="bg-[#131825] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Your Connected Provider Credentials ({apiKeys.length})
                </h2>
              </div>

              {apiKeys.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto text-gray-500">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-300">No External Provider Keys Added</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Add your personal OpenAI, Gemini, or Anthropic keys to use cloud models without consuming platform credits.
                  </p>
                  <button
                    onClick={() => setIsByokModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-emerald-600/20 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Provider Key
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/60">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-800/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{key.displayName}</span>
                            <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full uppercase tracking-wider border border-gray-700">
                              {key.provider}
                            </span>
                          </div>
                          <code className="font-mono text-xs text-gray-400 mt-1 block">
                            {key.keyMasked}
                          </code>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remove Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: NEWLY CREATED DEVELOPER KEY POPUP ================= */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#131825] border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Developer API Key Created!</h3>
                <p className="text-xs text-gray-400">Please copy and save your secret key now.</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                For security reasons, this raw API key will <strong>never be shown again</strong>. Store it securely in your environment variables.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Secret Key</label>
              <div className="flex items-center gap-2 bg-[#0A0D14] border border-indigo-500/30 rounded-xl p-3 font-mono text-xs text-indigo-300 select-all">
                <span className="flex-1 break-all">{newlyCreatedKey}</span>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey, 'new-key')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all flex items-center gap-1 shrink-0 text-xs font-sans font-semibold"
                >
                  {copiedIndex === 'new-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedIndex === 'new-key' ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
            >
              I Have Saved My Key
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CREATE DEVELOPER KEY FORM ================= */}
      {isDevModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleCreateDeveloperKey} className="bg-[#131825] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Generate AuraAI Developer Key
              </h3>
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Key Description / Name</label>
              <input
                type="text"
                placeholder="e.g. VSCode Extension, Python Server, Cursor IDE"
                value={devKeyName}
                onChange={(e) => setDevKeyName(e.target.value)}
                required
                className="w-full bg-[#0A0D14] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                Generate Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 3: ADD BYOK PROVIDER KEY FORM ================= */}
      {isByokModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddByokKey} className="bg-[#131825] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Add Provider Key (BYOK)
              </h3>
              <button
                type="button"
                onClick={() => setIsByokModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Provider</label>
              <select
                value={byokProvider}
                onChange={(e) => setByokProvider(e.target.value)}
                className="w-full bg-[#0A0D14] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="openai">OpenAI (GPT-4o, o1)</option>
                <option value="google">Google Gemini (Gemini 2.5 Flash, Pro)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Key Name / Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. My Personal OpenAI Key"
                value={byokName}
                onChange={(e) => setByokName(e.target.value)}
                className="w-full bg-[#0A0D14] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">API Secret Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={byokKey}
                onChange={(e) => setByokKey(e.target.value)}
                required
                className="w-full bg-[#0A0D14] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsByokModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                Save Key
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
