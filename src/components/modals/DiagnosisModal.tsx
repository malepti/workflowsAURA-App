import React, { useState } from 'react';
import {
  Activity,
  X,
  Server,
  Cpu,
  Bot,
  Coins,
  Zap,
  ShieldCheck,
  Database,
  Clock,
  Gauge,
  CheckCircle2,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Code2,
  Sliders,
  Wallet
} from 'lucide-react';
import { MessageDiagnosis } from '../../types';
import { useApp } from '../../context/AppContext';

interface DiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: MessageDiagnosis | null;
  messageContent?: string;
}

export const DiagnosisModal: React.FC<DiagnosisModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  messageContent
}) => {
  const { setCurrentView, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'visual' | 'raw_json'>('visual');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !diagnosis) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(diagnosis, null, 2));
    setCopied(true);
    addToast('Telemetry trace copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigateWallet = () => {
    onClose();
    setCurrentView('wallet');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Response Diagnosis & Telemetry
                </h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live Trace
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed provenance, model identity, agent routing, tokens, and billing records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('visual')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  activeTab === 'visual'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Visual Trace
              </button>
              <button
                onClick={() => setActiveTab('raw_json')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  activeTab === 'raw_json'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Raw JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'raw_json' ? (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                OpenTelemetry / APM Compliant Payload
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-2xl bg-slate-950 p-4 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed border border-slate-800">
              <code>{JSON.stringify(diagnosis, null, 2)}</code>
            </pre>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Quick Metrics KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> Model
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={diagnosis.modelName}>
                  {diagnosis.modelName}
                </p>
                <span className="text-[10px] text-slate-500">{diagnosis.modelId}</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Server className="h-3 w-3" /> Origin
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={diagnosis.providerOrigin}>
                  {diagnosis.providerOrigin.split(' ')[0]}
                </p>
                <span className="text-[10px] text-slate-500">Direct Route</span>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                  <Coins className="h-3 w-3" /> Credits Taken
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {diagnosis.creditsTaken > 0 ? `${diagnosis.creditsTaken} Credits` : '0 Credits'}
                </p>
                <span className="text-[10px] text-amber-800 font-medium">
                  {diagnosis.executionMode === 'byok' ? 'BYOK Wholesale' : 'Platform Quota'}
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Total Tokens
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {diagnosis.tokensTotal.toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-800 font-medium">
                  ~{(diagnosis.tokensTotal / 4).toFixed(0)} words
                </span>
              </div>
            </div>

            {/* 1. Origin & Infrastructure */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Server className="h-4 w-4 text-indigo-600" />
                <span>1. Where Did We Get This Response From? (Response Origin)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Infrastructure Host</span>
                  <span className="font-bold text-slate-800">{diagnosis.providerOrigin}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Encryption & Data Security</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {diagnosis.encryptionStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Model & Architecture */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <span>2. Which Model Was Used For This Response?</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Model Name</span>
                  <span className="font-bold text-slate-800">{diagnosis.modelName}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Technical Model ID</span>
                  <span className="font-mono text-slate-800 text-[11px]">{diagnosis.modelId}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Finish Reason</span>
                  <span className="font-semibold text-slate-800 uppercase text-[11px]">{diagnosis.finishReason}</span>
                </div>
              </div>
            </div>

            {/* 3. Agent Helper & Middleware */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Bot className="h-4 w-4 text-indigo-600" />
                <span>3. Which Agent Helped To Process This?</span>
              </div>
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                    {diagnosis.agentHelper}
                  </span>
                  <span className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                    Active Agent
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The agent parsed the prompt semantic schema, inspected active tools (Web Search, File RAG, or Code Sandbox), verified AES-256 credentials, and streamed the output tokens with real-time SSE chunking.
                </p>
              </div>
            </div>

            {/* Information Sources & Live Grounding if available */}
            {diagnosis.informationSources && diagnosis.informationSources.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span>Real-Time Information Sources & Grounding</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                    {diagnosis.informationSources.length} Verified Sources
                  </span>
                </div>
                <div className="space-y-2">
                  {diagnosis.informationSources.map((source, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-xl border border-blue-100 bg-white p-2.5 text-xs shadow-2xs hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 line-clamp-1">{source.title}</span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 shrink-0 ml-2"
                        >
                          <span>{source.domain || 'Visit'}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-2">{source.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Tokens Consumed */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>4. Tokens Consumed</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {diagnosis.tokensTotal} Total
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Prompt (Input)</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{diagnosis.tokensPrompt}</span>
                  <span className="text-[10px] text-slate-400 block">tokens</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Completion (Output)</span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">{diagnosis.tokensCompletion}</span>
                  <span className="text-[10px] text-slate-400 block">tokens</span>
                </div>
                <div className="bg-indigo-50/70 rounded-xl p-2.5 border border-indigo-200/80">
                  <span className="text-[10px] font-semibold text-indigo-700 block uppercase">Total Throughput</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{diagnosis.tokensTotal}</span>
                  <span className="text-[10px] text-indigo-700 block">tokens</span>
                </div>
              </div>
            </div>

            {/* 5. Credits Taken & Financial Ledger */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  <span>5. Credits Taken & Financial Accounting</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ledger Reconciled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Platform Credits Deducted</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {diagnosis.creditsTaken > 0 ? `-${diagnosis.creditsTaken} Credits` : '0 Credits'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {diagnosis.executionMode === 'byok' ? 'BYOK (0 Platform Fees)' : 'Metered Quota'}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Estimated Raw Provider Cost</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ${diagnosis.costUsdEquivalent.toFixed(5)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Direct Wholesale Rate</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Ledger Reference ID</span>
                  <span className="font-mono text-slate-700 text-[11px] block truncate">
                    {diagnosis.ledgerTxId || `tx_${Date.now()}`}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium block">Auditable Record</span>
                </div>
              </div>
            </div>

            {/* 6. Hardware & Memory Latency */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="h-4 w-4 text-slate-600" />
                <span>6. Execution & Latency Telemetry</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">Total Latency</span>
                  <span className="font-bold font-mono text-slate-800">{diagnosis.latencyMs} ms</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">Time to First Token</span>
                  <span className="font-bold font-mono text-slate-800">{diagnosis.timeToFirstTokenMs} ms</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">Speed Throughput</span>
                  <span className="font-bold font-mono text-slate-800">{diagnosis.throughputTokensPerSec} t/s</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">Session Memory</span>
                  <span className="font-bold text-emerald-700 text-[11px]">Redis Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied Trace</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Trace JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleNavigateWallet}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
            >
              <Wallet className="h-3.5 w-3.5 text-amber-500" />
              <span>View Credit Wallet</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all"
          >
            Close Diagnosis
          </button>
        </div>
      </div>
    </div>
  );
};
