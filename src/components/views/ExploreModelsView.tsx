import React, { useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  Check,
  Server,
  Zap,
  Cpu,
  Eye,
  Code2,
  Brain,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIModel } from '../../types';

export const ExploreModelsView: React.FC = () => {
  const {
    user,
    models,
    selectedModel,
    setSelectedModel,
    executionMode,
    setExecutionMode,
    setCurrentView,
    addToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'local' | 'cloud' | 'coding' | 'reasoning'>('all');

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.providerName.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'local') return m.isLocal;
    if (filterType === 'cloud') return !m.isLocal;
    if (filterType === 'coding') return m.capabilities.code;
    if (filterType === 'reasoning') return m.capabilities.reasoning;

    return true;
  });

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    if (model.isLocal) {
      setExecutionMode('platform_managed');
      addToast(`Selected ${model.name} via local Ollama cluster (${model.creditsPerRequest} cr/req).`, 'info');
    } else {
      addToast(`Selected ${model.name}.`, 'info');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <Compass className="h-4 w-4" />
            <span>MODEL REGISTRY & CAPABILITIES</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Explore AI Models</h1>
          <p className="text-xs text-slate-500">
            Browse state-of-the-art cloud LLMs and private admin-managed Ollama inference models.
          </p>
        </div>

        {/* Current Active Model pill */}
        <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white p-2.5 shadow-2xs">
          <span className="text-xs text-slate-500">Active Model:</span>
          <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {selectedModel.name}
          </span>
          <button
            onClick={() => setCurrentView('chat')}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Chat Now
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model name, provider, or capability (e.g. Llama, Vision, Reasoning)..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-3 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Models' },
            { id: 'local', label: 'Ollama Local' },
            { id: 'cloud', label: 'Cloud Providers' },
            { id: 'coding', label: 'Code Optimized' },
            { id: 'reasoning', label: 'Reasoning & Math' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => {
          const isSelected = selectedModel.id === model.id;
          const isUserPlanAllowed = model.allowedPlans.includes(user.plan);

          return (
            <div
              key={model.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Provider & Status Bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        model.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-600">{model.providerName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {model.badge && (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                        {model.badge}
                      </span>
                    )}
                    {model.isLocal ? (
                      <span className="flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                        <Server className="h-3 w-3" /> Local
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        <Radio className="h-3 w-3" /> Cloud
                      </span>
                    )}
                  </div>
                </div>

                {/* Model Title & Description */}
                <h3 className="text-base font-bold text-slate-900 mb-1">{model.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 min-h-[36px]">
                  {model.description}
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-medium">
                  <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-normal">Context Window</span>
                    <span className="text-slate-800 font-semibold">{model.contextWindow}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-normal">Avg Latency</span>
                    <span className="text-slate-800 font-semibold">~{model.latencyMs}ms</span>
                  </div>
                </div>

                {/* Capabilities tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {model.capabilities.code && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                      <Code2 className="h-3 w-3" /> Code
                    </span>
                  )}
                  {model.capabilities.reasoning && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-100">
                      <Brain className="h-3 w-3" /> Reasoning
                    </span>
                  )}
                  {model.capabilities.vision && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-700 border border-pink-100">
                      <Eye className="h-3 w-3" /> Vision
                    </span>
                  )}
                  {model.capabilities.webSearch && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                      <Globe className="h-3 w-3" /> Web
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing & Selection Footer */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Platform Cost</span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {model.creditsPerRequest} credits / req
                  </span>
                </div>

                {isUserPlanAllowed ? (
                  <button
                    onClick={() => handleSelectModel(model)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs flex items-center gap-1'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Selected
                      </>
                    ) : (
                      'Select Model'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('subscription')}
                    className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <Lock className="h-3 w-3" /> Upgrade
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
