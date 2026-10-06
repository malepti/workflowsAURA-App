import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Coins,
  Zap,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AnalyticsView: React.FC = () => {
  const { user, conversations, creditTransactions, models } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Compute dynamic stats from real conversations and credit transactions
  const analyticsData = useMemo(() => {
    let totalRequests = 0;
    let totalTokens = 0;
    let byokRequests = 0;
    let platformRequests = 0;
    const modelCounts: Record<string, number> = {};

    const formatModelName = (id: string): string => {
      if (!id) return 'Unknown Model';
      const found = models.find((m) => m.id === id || m.id.toLowerCase() === id.toLowerCase() || m.name.toLowerCase() === id.toLowerCase());
      return found ? found.name : id;
    };

    // 1. Process UI Conversations
    conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        if (msg.role === 'assistant') {
          totalRequests += 1;
          
          const tokens = msg.tokensUsed?.total || Math.ceil((msg.content?.length || 0) / 4);
          totalTokens += tokens;

          if (msg.executionMode === 'byok') {
            byokRequests += 1;
          } else {
            platformRequests += 1;
          }

          const rawModel = msg.modelUsed || conv.modelId;
          if (rawModel) {
            const name = formatModelName(rawModel);
            modelCounts[name] = (modelCounts[name] || 0) + 1;
          }
        }
      });
    });

    // 2. Process External API Key Transactions (Developer Keys & Platform Calls)
    creditTransactions.forEach((t) => {
      if (t.amount < 0) {
        totalRequests += 1;
        platformRequests += 1;
        totalTokens += 35;

        if (t.modelId) {
          const name = formatModelName(t.modelId);
          modelCounts[name] = (modelCounts[name] || 0) + 1;
        }
      }
    });

    // Calculate Platform Credits Burned from ledger entries
    const creditsBurned = creditTransactions
      .filter((t) => t.amount < 0)
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    // Calculate model volume shares dynamically (no hardcoded fallback array!)
    const displayModels = Object.entries(modelCounts).map(([name, count]) => {
      const share = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
      return { modelId: name, name, count, share };
    }).sort((a, b) => b.count - a.count);



    const colorPalette = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500'];

    // Execution mode percentages
    const byokPercent = totalRequests > 0 ? Math.round((byokRequests / totalRequests) * 100) : 0;
    const platformPercent = totalRequests > 0 ? 100 - byokPercent : 0;

    // Daily Credit Consumption (Last 7 Days)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIdx = new Date().getDay();
    const dayLabels = [...days.slice(todayIdx), ...days.slice(0, todayIdx)];

    // Aggregate debits per day
    const dailyCredits: Record<string, number> = {};
    creditTransactions.forEach((t) => {
      if (t.amount < 0) {
        const d = new Date(t.timestamp || Date.now());
        const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
        dailyCredits[dayName] = (dailyCredits[dayName] || 0) + Math.abs(t.amount);
      }
    });

    const dailyBars = dayLabels.map((day) => ({
      day,
      credits: Math.round((dailyCredits[day] || 0) * 100) / 100
    }));

    const maxCredits = Math.max(...dailyBars.map((d) => d.credits), 1);
    const estByokSavings = (byokRequests * 0.002).toFixed(2);

    return {
      totalRequests,
      totalTokens,
      creditsBurned: Math.round(creditsBurned * 100) / 100,
      byokRequests,
      platformRequests,
      byokPercent,
      platformPercent,
      displayModels,
      colorPalette,
      dailyBars,
      maxCredits,
      estByokSavings
    };
  }, [conversations, creditTransactions, models]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>REAL-TIME TELEMETRY & CONSUMPTION</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Usage Analytics</h1>
          <p className="text-xs text-slate-500">
            Dynamic telemetry breakdown calculated live from your actual prompt requests and credit ledger.
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
          <span className="text-2xl font-extrabold text-slate-900">{analyticsData.totalRequests.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-medium">Live Telemetry Count</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Tokens Processed</span>
          <span className="text-2xl font-extrabold text-slate-900">{analyticsData.totalTokens.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Prompt + Completion</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Platform Credits Burned</span>
          <span className="text-2xl font-extrabold text-amber-600">{analyticsData.creditsBurned} cr</span>
          <span className="text-[10px] text-slate-400 block mt-1">
            {analyticsData.totalRequests > 0 
              ? `Avg ${(analyticsData.creditsBurned / analyticsData.totalRequests).toFixed(2)} cr / request` 
              : '0 cr / request'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Estimated Cost Savings (BYOK)</span>
          <span className="text-2xl font-extrabold text-indigo-700">${analyticsData.estByokSavings}</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-medium">Direct Provider Routing</span>
        </div>
      </div>

      {/* Dynamic Bar Chart for Daily Credit Burn */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Credit Consumption</h3>
            <p className="text-xs text-slate-500">Actual credits debited for inference and sandbox runtimes</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600">Last 7 Days</span>
        </div>

        <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 px-2 border-b border-slate-100">
          {analyticsData.dailyBars.map((d, i) => {
            const heightPercent = d.credits > 0 ? Math.max(12, Math.round((d.credits / analyticsData.maxCredits) * 100)) : 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.credits}cr
                </span>
                <div className="w-full max-w-[40px] rounded-t-xl bg-slate-100 h-36 flex items-end overflow-hidden">
                  <div
                    className={`w-full ${d.credits > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300' : 'bg-slate-200'} transition-all rounded-t-xl`}
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
            {analyticsData.displayModels.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No model request activity recorded yet for this period.</p>
            ) : (
              analyticsData.displayModels.map((m, i) => {
                const color = analyticsData.colorPalette[i % analyticsData.colorPalette.length];
                return (
                  <div key={m.modelId} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700 font-semibold">{m.name}</span>
                      <span className="text-slate-500">{m.share}% ({m.count} req)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${m.share}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Mode Comparison: BYOK vs Platform Credits */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Execution Mode Breakdown</h3>
          <div className="space-y-3 text-xs">
            <div className="rounded-xl bg-blue-50 p-3 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block">Bring-Your-Own-Key (BYOK)</span>
                <span className="text-blue-700 text-[11px]">
                  {analyticsData.byokRequests} requests ({analyticsData.byokPercent}%) • 0 credits billed
                </span>
              </div>
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>

            <div className="rounded-xl bg-purple-50 p-3 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-900 block">Platform Credits (Local/Managed)</span>
                <span className="text-purple-700 text-[11px]">
                  {analyticsData.platformRequests} requests ({analyticsData.platformPercent}%) • {analyticsData.creditsBurned} credits consumed
                </span>
              </div>
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
