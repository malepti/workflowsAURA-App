import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Coins,
  Zap,
  Clock,
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AnalyticsView: React.FC = () => {
  const { user, creditTransactions } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Daily consumption mock bars
  const dailyData = [
    { day: 'Mon', credits: 18, tokens: 4200, byok: 6 },
    { day: 'Tue', credits: 24, tokens: 5800, byok: 12 },
    { day: 'Wed', credits: 12, tokens: 2900, byok: 4 },
    { day: 'Thu', credits: 35, tokens: 8400, byok: 15 },
    { day: 'Fri', credits: 42, tokens: 10200, byok: 22 },
    { day: 'Sat', credits: 15, tokens: 3600, byok: 8 },
    { day: 'Sun', credits: 28, tokens: 6900, byok: 14 }
  ];

  const maxCredits = Math.max(...dailyData.map((d) => d.credits));

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>CONSUMPTION & TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Usage Analytics</h1>
          <p className="text-xs text-slate-500">
            Real-time breakdown of platform credit burn, token throughput, and BYOK execution frequency.
          </p>
        </div>

        {/* Time range switcher */}
        <div className="flex rounded-xl bg-white border border-slate-200 p-1 text-xs shadow-2xs">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                timeRange === r ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Requests</span>
          <span className="text-2xl font-extrabold text-slate-900">142</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-medium">↑ 18% vs last week</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Tokens Processed</span>
          <span className="text-2xl font-extrabold text-slate-900">42,000</span>
          <span className="text-[10px] text-slate-400 block mt-1">Prompt + Completion</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Platform Credits Burned</span>
          <span className="text-2xl font-extrabold text-amber-600">174 cr</span>
          <span className="text-[10px] text-slate-400 block mt-1">Avg 2.4 cr / request</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Estimated Cost Savings (BYOK)</span>
          <span className="text-2xl font-extrabold text-indigo-700">$18.40</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-medium">Zero markup direct routing</span>
        </div>
      </div>

      {/* Interactive Bar Chart for Daily Credit Burn */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Credit Consumption</h3>
            <p className="text-xs text-slate-500">Credits debited for local inference and sandbox runtimes</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600">Last 7 Days</span>
        </div>

        <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 px-2 border-b border-slate-100">
          {dailyData.map((d, i) => {
            const heightPercent = Math.round((d.credits / maxCredits) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.credits}cr
                </span>
                <div className="w-full max-w-[40px] rounded-t-xl bg-slate-100 h-36 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all rounded-t-xl"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown: Model Share & Execution Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Volume by Model</h3>
          <div className="space-y-2.5 text-xs">
            {[
              { name: 'Gemini 2.5 Flash', share: 44, color: 'bg-blue-500' },
              { name: 'Llama 3.3 70B (Local Ollama)', share: 26, color: 'bg-purple-500' },
              { name: 'GPT-4o', share: 18, color: 'bg-emerald-500' },
              { name: 'Qwen 2.5 Coder', share: 12, color: 'bg-amber-500' }
            ].map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700">{m.name}</span>
                  <span className="text-slate-500">{m.share}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${m.color}`} style={{ width: `${m.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mode Comparison: BYOK vs Platform Credits */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Execution Mode Breakdown</h3>
          <div className="space-y-3 text-xs">
            <div className="rounded-xl bg-blue-50 p-3 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block">Bring-Your-Own-Key (BYOK)</span>
                <span className="text-blue-700 text-[11px]">84 requests (59%) • 0 credits billed</span>
              </div>
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>

            <div className="rounded-xl bg-purple-50 p-3 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-900 block">Platform Credits (Local/Managed)</span>
                <span className="text-purple-700 text-[11px]">58 requests (41%) • 174 credits consumed</span>
              </div>
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
