import React from 'react';
import {
  KeyRound,
  Plus,
  CheckCircle2,
  ExternalLink,
  Zap,
  CreditCard,
  User,
  Shield,
  Smartphone,
  Laptop,
  ChevronRight,
  Sparkles,
  Server,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RightPanel: React.FC = () => {
  const {
    user,
    apiKeys,
    conversations,
    selectConversation,
    setCurrentView,
    rightPanelOpen,
    setRightPanelOpen,
    sessions
  } = useApp();

  if (!rightPanelOpen) return null;

  const activeKeys = apiKeys.filter((k) => k.isActive);

  return (
    <aside className="w-80 shrink-0 border-l border-[#E2E8F0] bg-white h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-5 transition-all">
      {/* 1. My API Keys Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFF] p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">My API Keys</h3>
          </div>
          <button
            onClick={() => setCurrentView('api-keys')}
            className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-indigo-600 border border-slate-200 hover:bg-indigo-50 shadow-2xs transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Key
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {activeKeys.slice(0, 3).map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200/70 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-[11px] truncate">
                    {key.providerName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {key.keyMasked}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                Active
              </span>
            </div>
          ))}

          {activeKeys.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-2">
              No API keys configured yet.
            </p>
          )}
        </div>

        <button
          onClick={() => setCurrentView('api-keys')}
          className="w-full text-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 py-1 transition-colors flex items-center justify-center gap-1"
        >
          Manage All Keys <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* 2. Subscription & Credits Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFF] p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h3 className="text-xs font-bold text-slate-800">Subscription & Credits</h3>
          </div>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
            {user.plan}
          </span>
        </div>

        <div className="mb-3 space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/70">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500">Monthly Credits</span>
            <span className="font-bold text-slate-800">
              {user.totalCredits} / {user.monthlyCreditQuota}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(10, (user.totalCredits / user.monthlyCreditQuota) * 100))}%`
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Renews on <span className="text-slate-600 font-medium">{user.planRenewalDate}</span>
          </p>
        </div>

        <button
          onClick={() => setCurrentView('subscription')}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2 text-xs font-semibold text-white hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-xs mb-2 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade Plan
        </button>

        <button
          onClick={() => setCurrentView('wallet')}
          className="w-full text-center text-[11px] font-semibold text-slate-600 hover:text-indigo-600 py-1 transition-colors flex items-center justify-center gap-1"
        >
          View Plans & Billing <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* 3. Account & Sessions Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFF] p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">Account & Sessions</h3>
          </div>
          <button
            onClick={() => setCurrentView('account')}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Manage
          </button>
        </div>

        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/70 mb-2.5">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Laptop className="h-3.5 w-3.5 text-slate-400" /> Active Sessions
            </span>
            <span className="font-semibold text-emerald-600 text-[11px]">
              {sessions.length} devices
            </span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Shield className="h-3.5 w-3.5 text-slate-400" /> 2FA Protection
            </span>
            <span className="font-semibold text-emerald-600 text-[11px]">Enabled</span>
          </div>
        </div>
      </div>

      {/* 4. Local Inference Status Card */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-3.5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Server className="h-4 w-4 text-indigo-600" />
          <h4 className="text-xs font-bold text-indigo-950">Local Ollama Cluster</h4>
        </div>
        <p className="text-[11px] text-slate-600 mb-2">
          Private cluster connected: <span className="font-mono font-medium text-indigo-700">4 local models ready</span>
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-indigo-100/80 pt-2">
          <span>Latency: ~140ms</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online
          </span>
        </div>
      </div>
    </aside>
  );
};
