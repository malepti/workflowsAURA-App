import React, { useState } from 'react';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  CreditCard,
  FileCheck2,
  Receipt,
  Download,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreditWalletView: React.FC = () => {
  const {
    user,
    creditTransactions,
    purchaseCreditPack,
    setCurrentView,
    addToast
  } = useApp();

  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  const packs = [
    { credits: 500, price: 5, popular: false, bonus: '' },
    { credits: 2000, price: 15, popular: true, bonus: '+25% Extra Value' },
    { credits: 5000, price: 35, popular: false, bonus: '+45% Mega Pack' }
  ];

  const handleBuy = (credits: number, price: number) => {
    purchaseCreditPack(credits, price);
    setTopUpModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <Wallet className="h-4 w-4" />
            <span>FINANCIAL LEDGER & BILLING</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Credit Wallet & Ledger</h1>
          <p className="text-xs text-slate-500">
            Platform credits are consumed for admin-managed local models, code sandboxes, and file vectors.
          </p>
        </div>

        <button
          onClick={() => setTopUpModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:from-indigo-500 hover:to-indigo-600 transition-all"
        >
          <Coins className="h-4 w-4 text-amber-300" />
          Top-Up Credits
        </button>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Balance */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Available Credits</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-900">{user.totalCredits.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">credits</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Approx. <span className="font-semibold text-slate-700">{Math.floor(user.totalCredits / 2)}</span> requests on Gemini / Local models.
          </p>
        </div>

        {/* Plan Allowance */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Monthly Quota</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
              {user.plan}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-900">{user.monthlyCreditQuota}</span>
            <span className="text-xs text-slate-400 font-medium">credits/month</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Next renewal on <span className="font-semibold text-slate-700">{user.planRenewalDate}</span>
          </p>
        </div>

        {/* BYOK Status */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">BYOK Unlimited Mode</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-blue-700">0 Credits Charged</span>
          </div>
          <p className="text-[11px] text-slate-500">
            When using personal API keys, platform fees are strictly waived.
          </p>
        </div>
      </div>

      {/* Top-up Packs Preview */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Instant Credit Top-Up Packs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {packs.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 bg-white shadow-2xs relative flex flex-col justify-between ${
                p.popular ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-slate-200'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-xs">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900">{p.credits.toLocaleString()} Credits</span>
                  <span className="text-lg font-extrabold text-indigo-700">${p.price}</span>
                </div>
                {p.bonus && (
                  <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 mb-2">
                    {p.bonus}
                  </span>
                )}
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Credits never expire and roll over automatically with active accounts.
                </p>
              </div>

              <button
                onClick={() => handleBuy(p.credits, p.price)}
                className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
              >
                Purchase Pack
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Auditable Credit Ledger Table matching Section 7 & 8 */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Auditable Credit Transaction Ledger</h3>
            <p className="text-xs text-slate-500">
              Immutable record of all credit allocations, inference debits, and administrative adjustments.
            </p>
          </div>
          <button
            onClick={() => addToast('Exporting transaction ledger CSV...', 'info')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFF] text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Balance After</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {creditTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{tx.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{tx.description}</span>
                      {tx.auditReason && (
                        <span className="block text-[10px] text-slate-400">
                          Audit reason: {tx.auditReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                        {tx.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        isPositive ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isPositive ? `+${tx.amount}` : tx.amount} cr
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {tx.balanceAfter} cr
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top up modal */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Platform Credits</h3>
              <button
                onClick={() => setTopUpModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {packs.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleBuy(p.credits, p.price)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">
                      +{p.credits.toLocaleString()} Credits
                    </span>
                    <span className="text-xs text-slate-500">{p.bonus || 'Standard Top-Up'}</span>
                  </div>
                  <span className="text-sm font-extrabold text-indigo-700">${p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
