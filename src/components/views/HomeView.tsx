import React, { useState } from 'react';
import {
  Sparkles,
  KeyRound,
  Server,
  Compass,
  ArrowRight,
  Globe,
  FileText,
  Image as ImageIcon,
  Terminal,
  HardDrive,
  Calendar,
  Send,
  Paperclip,
  Code2,
  Coins,
  CheckCircle,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExecutionMode } from '../../types';

export const HomeView: React.FC = () => {
  const {
    user,
    models,
    selectedModel,
    setSelectedModel,
    executionMode,
    setExecutionMode,
    startNewChat,
    setCurrentView,
    purchaseCreditPack,
    addToast
  } = useApp();

  const [promptText, setPromptText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'write' | 'code' | 'charts' | 'doc' | 'research'>('all');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableCodeRunner, setEnableCodeRunner] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    startNewChat(promptText.trim());
    setPromptText('');
  };

  const actionTabs = [
    { id: 'all', label: 'All' },
    { id: 'write', label: 'Write' },
    { id: 'code', label: 'Code' },
    { id: 'charts', label: 'Charts & Data' },
    { id: 'doc', label: 'Document Analysis' },
    { id: 'research', label: 'Research' }
  ];

  const popularPrompts = [
    {
      title: 'Kubernetes Cluster Architecture',
      desc: 'Design a resilient multi-region k8s cluster with ingress & cert-manager.',
      category: 'code',
      prompt: 'Explain how to design an enterprise Kubernetes multi-region architecture with GitOps, Ingress-NGINX, and automated SSL certs.'
    },
    {
      title: 'Full-Stack SaaS Product Roadmap',
      desc: 'Generate a 6-month launch plan with milestones and pricing strategy.',
      category: 'write',
      prompt: 'Create a comprehensive 6-month product roadmap for a multi-model AI SaaS startup, detailing MVP launch, pricing tiers, and BYOK architecture.'
    },
    {
      title: 'Analyze Ollama Local Performance',
      desc: 'Benchmark Llama 3.3 vs DeepSeek R1 for logic puzzles and coding.',
      category: 'research',
      prompt: 'Compare Llama 3.3 70B and DeepSeek R1 in terms of reasoning depth, coding accuracy, token speed, and VRAM memory requirements on Ollama.'
    },
    {
      title: 'Modern Responsive UI Component',
      desc: 'Tailwind CSS animated modal with accessibility and dark-mode tokens.',
      category: 'code',
      prompt: 'Write a high-performance React component with Tailwind CSS for a credit top-up modal including accessible keyboard focus and subtle transitions.'
    }
  ];

  const quickAccessItems = [
    {
      id: 'web',
      name: 'Web Search',
      icon: Globe,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      action: () => {
        setEnableWebSearch(true);
        addToast('Web search enabled for next query.', 'info');
      }
    },
    {
      id: 'doc',
      name: 'File & Document',
      icon: FileText,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
      action: () => setCurrentView('doc-analysis')
    },
    {
      id: 'charts',
      name: 'Charts & Data',
      icon: BarChart3,
      color: 'text-pink-600 bg-pink-50 border-pink-100',
      action: () => setCurrentView('charts')
    },
    {
      id: 'code',
      name: 'Code Runner',
      icon: Terminal,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      action: () => setCurrentView('code-assistant')
    },
    {
      id: 'drive',
      name: 'Google Drive',
      icon: HardDrive,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      action: () => setCurrentView('plugins')
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: Calendar,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      action: () => setCurrentView('plugins')
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. Hero Welcoming Section matching Page 1 screenshot */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/50 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/80 px-3 py-1 text-xs font-semibold text-indigo-800">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Multi-Model AI Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172554]">
              Good Afternoon, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Choose a model, bring your own API key, or use our admin-managed local model.
              Start chatting, coding, or exploring!
            </p>
          </div>

          {/* Cute mascot / badge representation from screenshot */}
          <div className="shrink-0 flex items-center gap-3 bg-white/90 border border-indigo-100/90 rounded-2xl p-3 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-[11px] text-indigo-600 font-semibold uppercase tracking-wider block">
                How can I help you today?
              </span>
              <span className="text-xs font-bold text-slate-800">
                Aura Assistant 3.5 Ready
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Bar: Model Selection, Execution Mode & Credits */}
        <div className="mt-6 pt-5 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Select Model Dropdown */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Model
            </label>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`h-2 w-2 rounded-full ${selectedModel.isLocal ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                <span className="truncate">{selectedModel.name}</span>
                {selectedModel.badge && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-normal">
                    {selectedModel.badge}
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m);
                      setModelDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                      selectedModel.id === m.id
                        ? 'bg-indigo-50 font-bold text-indigo-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left truncate">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${m.isLocal ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                      <div className="truncate">
                        <p className="truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal truncate">{m.providerName} • {m.contextWindow}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {m.isLocal ? `${m.creditsPerRequest} cr` : `$${m.estimatedCostUsd}/req`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Execution Mode / API Key Source Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              API Key / Model Source
            </label>
            <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs">
              <button
                onClick={() => setExecutionMode('byok')}
                className={`flex-1 rounded-lg py-1.5 px-2 font-medium transition-all ${
                  executionMode === 'byok'
                    ? 'bg-white text-indigo-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Billed through user's key - 0 platform credits"
              >
                Use My API Key
              </button>
              <button
                onClick={() => setExecutionMode('platform_managed')}
                className={`flex-1 rounded-lg py-1.5 px-2 font-medium transition-all ${
                  executionMode === 'platform_managed'
                    ? 'bg-white text-indigo-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Admin-managed local or cloud model using platform credits"
              >
                Platform Credits
              </button>
            </div>
          </div>

          {/* Credits & Buy Button */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Credits Balance
            </label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-extrabold">{user.totalCredits}</span>
                <span className="text-slate-400 font-normal text-[11px]">available</span>
              </div>
              <button
                onClick={() => setCurrentView('wallet')}
                className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                Buy Credits
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Central Prompt Composer with Action Tabs */}
      <div className="space-y-3">
        {/* Action Tabs / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {actionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Central Composer Box */}
        <form
          onSubmit={handlePromptSubmit}
          className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-300 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100"
        >
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePromptSubmit(e);
              }
            }}
            placeholder={`Ask anything with ${selectedModel.name}... (Press Enter to send, Shift+Enter for newline)`}
            rows={3}
            className="w-full resize-none bg-transparent p-2 text-sm text-[#172554] placeholder-slate-400 focus:outline-none"
          />

          {/* Bottom toolbar inside composer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => addToast('File upload picker triggered. Ready for PDF, TXT, or Code.', 'info')}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                title="Attach Document or Image"
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnableWebSearch(!enableWebSearch);
                  addToast(`Web Search ${!enableWebSearch ? 'enabled' : 'disabled'} for this prompt.`, 'info');
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  enableWebSearch
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Toggle Web Search grounding"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Web Search</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnableCodeRunner(!enableCodeRunner);
                  addToast(`Code Sandbox ${!enableCodeRunner ? 'enabled' : 'disabled'}.`, 'info');
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  enableCodeRunner
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Run in Code Interpreter"
              >
                <Terminal className="h-4 w-4" />
                <span className="hidden sm:inline">Code Runner</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                <span className="font-semibold">{selectedModel.name}</span>
                {executionMode === 'byok' && (
                  <>
                    <span>•</span>
                    <span>BYOK (0 cr)</span>
                  </>
                )}
              </span>

              <button
                type="submit"
                disabled={!promptText.trim()}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  promptText.trim()
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 scale-100'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Three Primary Setup Cards matching Section 4 requirements */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Getting Started: Three Execution Paths
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: BYOK */}
          <div
            onClick={() => setCurrentView('api-keys')}
            className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                1. Use Your Own API Key (BYOK)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Connect your OpenAI, Claude, or Gemini keys directly. You pay the provider at cost; zero platform inference credits are charged.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              Configure Keys <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: Admin-Managed Local Models */}
          <div
            onClick={() => {
              setExecutionMode('platform_managed');
              addToast('Switched to Admin-Managed Local models (Ollama).', 'info');
              setCurrentView('explore');
            }}
            className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                2. Use an Admin-Managed Local Model
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Run private local models like Llama 3.3, DeepSeek R1, or Qwen Coder hosted on Ollama clusters. Deducts transparent platform credits.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
              View Local Models <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Explore Available Models */}
          <div
            onClick={() => setCurrentView('explore')}
            className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                3. Explore Available Models
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Compare benchmark speed, context length, multimodal support, and plan availability across all integrated AI engines.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              Explore Gallery <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Access Grid matching Page 1 screenshot */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Access Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all group"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.color} mb-2 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Popular Prompts Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Popular Prompts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularPrompts.map((p, idx) => (
            <div
              key={idx}
              onClick={() => startNewChat(p.prompt)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {p.title}
                  </h4>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{p.desc}</p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                Run prompt <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
