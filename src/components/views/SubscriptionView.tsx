import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION_PLANS } from '../../lib/mockData';

export const SubscriptionView: React.FC = () => {
  const { user, upgradeSubscription, addToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (planId: 'free' | 'plus' | 'pro' | 'enterprise') => {
    if (planId === user.plan) {
      addToast('You are already on this plan.', 'info');
      return;
    }
    upgradeSubscription(planId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header & Billing Cycle Switch */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Zap className="h-3.5 w-3.5 fill-indigo-600" />
          <span>Flexible Plans with Full BYOK Support</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
          Choose the Perfect AI Workspace Plan
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Platform credits grant access to admin-managed local models, high-performance GPU clusters, and tool executions. Unlimited BYOK is supported on all tiers.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-lg px-4 py-1.5 font-semibold transition-all ${
              billingCycle === 'monthly' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`rounded-lg px-4 py-1.5 font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Annual Billing
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Subscription Cards Grid matching Section 7 & 8 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = user.plan === plan.id;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.floor(plan.priceAnnual / 12);

          return (
            <div
              key={plan.id}
              className={`rounded-3xl border bg-white p-6 shadow-2xs flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-xs'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  {plan.badge}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Current Plan
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900">${price}</span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>

                <p className="text-xs text-slate-500 mb-4 min-h-[36px]">{plan.description}</p>

                {/* Key stats */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 mb-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Monthly Credits</span>
                    <span className="font-bold text-slate-800">{plan.creditsGranted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Max Rate Limit</span>
                    <span className="font-semibold text-slate-700">{plan.maxRequestsPerMin} req/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Credit Rollover</span>
                    <span className="font-semibold text-slate-700">{plan.rolloverSupported ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isCurrent}
                className={`w-full rounded-xl py-2.5 text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700'
                }`}
              >
                {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice & Billing History Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Invoices & Payment History</h3>
            <p className="text-xs text-slate-500">View and download previous billing receipts.</p>
          </div>
          <button
            onClick={() => addToast('Receipt downloaded.', 'success')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <Download className="h-3.5 w-3.5" /> Download Latest
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {[
            { id: 'INV-2026-001', date: '2026-10-01', amount: '$0.00', status: 'Paid', desc: 'Free Plan Monthly Cycle' },
            { id: 'INV-2026-002', date: '2026-09-01', amount: '$0.00', status: 'Paid', desc: 'Free Plan Monthly Cycle' }
          ].map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 font-medium"
            >
              <div>
                <span className="font-bold text-slate-800 mr-2">{inv.id}</span>
                <span className="text-slate-500">{inv.desc}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px]">{inv.date}</span>
                <span className="font-bold text-slate-800">{inv.amount}</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
