import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Power,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIProvider } from '../../types';

export const ApiKeyManagerView: React.FC = () => {
  const {
    apiKeys,
    addApiKey,
    testApiKey,
    toggleApiKeyActive,
    deleteApiKey,
    addToast
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [rawKey, setRawKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawKey.trim()) {
      addToast('Please enter an API key.', 'warning');
      return;
    }

    await addApiKey(provider, rawKey.trim(), displayName.trim() || undefined);
    setRawKey('');
    setDisplayName('');
    setModalOpen(false);
  };

  const handleTestKey = async (id: string) => {
    setTestingId(id);
    await testApiKey(id);
    setTestingId(null);
  };

  const providerLinks: Record<string, { url: string; label: string }> = {
    openai: { url: 'https://platform.openai.com/api-keys', label: 'platform.openai.com' },
    google: { url: 'https://aistudio.google.com/app/apikey', label: 'aistudio.google.com' },
    anthropic: { url: 'https://console.anthropic.com/settings/keys', label: 'console.anthropic.com' },
    ollama: { url: 'https://ollama.com', label: 'ollama.com (Local)' },
    groq: { url: 'https://console.groq.com/keys', label: 'console.groq.com' }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <KeyRound className="h-4 w-4" />
            <span>CREDENTIAL VAULT & ENCRYPTION</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">API Key Management (BYOK)</h1>
          <p className="text-xs text-slate-500">
            Securely connect your own AI provider keys. When active, requests bypass platform credit charges.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add API Key
        </button>
      </div>

      {/* Security & BYOK Explanation Banner matching Section 8 */}
      <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-slate-900">Zero Credit Deduction Policy & Encryption at Rest</h3>
            <p className="text-slate-500 leading-relaxed">
              When using your own provider key (BYOK mode), you pay the provider directly through your account.
              <strong> AuraAI charges 0 platform credits for provider inference.</strong> All credentials are AES-256 encrypted at rest, masked in the UI, and never transmitted back in raw plaintext.
            </p>
          </div>
        </div>
      </div>

      {/* API Key Cards Grid matching Section 8 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apiKeys.map((key) => {
          const isTesting = testingId === key.id;
          const link = providerLinks[key.provider] || { url: '#', label: 'Provider Portal' };

          return (
            <div
              key={key.id}
              className={`rounded-2xl border bg-white p-5 shadow-2xs transition-all flex flex-col justify-between ${
                key.isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-75'
              }`}
            >
              <div>
                {/* Provider Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                      {key.provider.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{key.displayName}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {key.providerName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        key.isValid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {key.isValid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {key.isValid ? 'Verified' : 'Invalid'}
                    </span>
                  </div>
                </div>

                {/* Key Masked Box */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3">
                  <span className="text-[10px] text-slate-400 font-medium block mb-1">
                    MASKED KEY IDENTIFIER
                  </span>
                  <div className="flex items-center justify-between font-mono text-xs text-slate-700 font-medium">
                    <span className="truncate">{key.keyMasked}</span>
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                  </div>
                </div>

                {/* Key Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Last Tested</span>
                    <span className="font-semibold text-slate-700">{key.lastTestedAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Associated Models</span>
                    <span className="font-semibold text-slate-700">{key.associatedModelCount} models</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestKey(key.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Test connection"
                  >
                    <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Test</span>
                  </button>

                  <button
                    onClick={() => toggleApiKeyActive(key.id)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      key.isActive
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    }`}
                    title={key.isActive ? 'Deactivate key' : 'Activate key'}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => deleteApiKey(key.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Purge key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add API Key Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Provider API Key</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AIProvider)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="openai">OpenAI (GPT-4o, o3-mini)</option>
                  <option value="google">Google Gemini (Gemini 2.5 Flash / Pro)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="groq">Groq (Llama, Mistral Ultra-Fast)</option>
                  <option value="ollama">Ollama (Custom Host Endpoint)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. My Production OpenAI Key"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key Secret
                </label>
                <input
                  type="password"
                  value={rawKey}
                  onChange={(e) => setRawKey(e.target.value)}
                  placeholder="Paste sk-..., AIza..., or endpoint URL"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-400 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Obtain keys exclusively from official provider dashboards.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Encrypted using client-side ephemeral exchange & server-side AES-GCM. We never log or expose raw keys.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
                >
                  Save & Validate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
