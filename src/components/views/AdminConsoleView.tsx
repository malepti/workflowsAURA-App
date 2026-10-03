import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Activity,
  Coins,
  DollarSign,
  Server,
  AlertCircle,
  Plus,
  Sliders,
  Power,
  Search,
  CheckCircle2,
  Trash2,
  Lock,
  Edit2,
  History,
  HardDrive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIModel } from '../../types';

export const AdminConsoleView: React.FC = () => {
  const {
    adminStats,
    models,
    updateModelPricing,
    adminGrantCreditsToUser,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'models' | 'users' | 'audit'>('dashboard');
  const [ollamaEndpoint, setOllamaEndpoint] = useState(adminStats.localOllamaStatus.serverUrl);
  
  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [grantCreditsModal, setGrantCreditsModal] = useState<{ open: boolean; userEmail: string }>({
    open: false,
    userEmail: ''
  });
  const [creditAmount, setCreditAmount] = useState(100);
  const [auditReason, setAuditReason] = useState('Customer Support Compensation');

  const [managedUsers, setManagedUsers] = useState([
    {
      id: 'usr_01',
      name: 'Rupasree Kamineni',
      email: 'rupasreekamineni@gmail.com',
      plan: 'free',
      credits: 250,
      status: 'active',
      role: 'admin'
    },
    {
      id: 'usr_02',
      name: 'Alex Rivera',
      email: 'alex.rivera@techcorp.io',
      plan: 'pro',
      credits: 3840,
      status: 'active',
      role: 'user'
    },
    {
      id: 'usr_03',
      name: 'Elena Rostova',
      email: 'elena@research.org',
      plan: 'plus',
      credits: 1210,
      status: 'active',
      role: 'user'
    },
    {
      id: 'usr_04',
      name: 'Marcus Vance',
      email: 'marcus@badactor.net',
      plan: 'free',
      credits: 12,
      status: 'suspended',
      role: 'user'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 'aud_1', time: '10 mins ago', actor: 'admin@auraai.internal', action: 'Credit Grant (+500)', target: 'alex.rivera@techcorp.io', reason: 'Pro Tier annual billing bonus' },
    { id: 'aud_2', time: '1 hour ago', actor: 'system_cron', action: 'Monthly Quota Allocation', target: 'All Free Users', reason: 'Billing Cycle Reset' },
    { id: 'aud_3', time: '3 hours ago', actor: 'admin@auraai.internal', action: 'Model Price Edit (Llama 3.3)', target: '3 credits/req', reason: 'GPU utilization load balancing' },
    { id: 'aud_4', time: 'Yesterday', actor: 'security_daemon', action: 'Account Suspended', target: 'marcus@badactor.net', reason: 'Rate limit violation threshold exceeded' }
  ]);

  const handleGrantCredits = (e: React.FormEvent) => {
    e.preventDefault();
    adminGrantCreditsToUser(creditAmount, auditReason);
    setManagedUsers((prev) =>
      prev.map((u) =>
        u.email === grantCreditsModal.userEmail ? { ...u, credits: u.credits + creditAmount } : u
      )
    );
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        time: 'Just now',
        actor: 'Admin (You)',
        action: `Credit Grant (+${creditAmount})`,
        target: grantCreditsModal.userEmail,
        reason: auditReason
      },
      ...prev
    ]);
    setGrantCreditsModal({ open: false, userEmail: '' });
  };

  const handleToggleUserStatus = (userId: string) => {
    setManagedUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const next = u.status === 'active' ? 'suspended' : 'active';
          addToast(`User ${u.name} is now ${next}.`, next === 'suspended' ? 'warning' : 'success');
          return { ...u, status: next };
        }
        return u;
      })
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>ROLE-PROTECTED ADMINISTRATION CONSOLE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172554]">Platform Admin & Governance</h1>
          <p className="text-xs text-slate-500">
            Configure local inference endpoints, manage users, set credit pricing, and audit billing ledger events.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-purple-100/70 p-1 text-xs font-semibold text-purple-900 shadow-2xs">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'models', label: 'Model Governance' },
            { id: 'users', label: 'User Management' },
            { id: 'audit', label: 'Audit Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                activeTab === tab.id ? 'bg-white text-purple-900 shadow-2xs' : 'text-purple-700 hover:text-purple-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DASHBOARD METRICS matching Section 12 */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Total Users</span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{adminStats.totalUsers.toLocaleString()}</span>
              <p className="text-[11px] text-emerald-600 mt-1">842 active in last 24h</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Total Request Volume</span>
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{adminStats.requestVolume.toLocaleString()}</span>
              <p className="text-[11px] text-slate-400 mt-1">42.8k cloud • 5.4k local</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Credit Consumption</span>
                <Coins className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-3xl font-extrabold text-amber-600">
                {adminStats.totalCreditsConsumed.toLocaleString()} cr
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Settled on ledger</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Provider API Costs</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900">${adminStats.providerCostsUsd}</span>
              <p className="text-[11px] text-slate-400 mt-1">Excludes user BYOK queries</p>
            </div>
          </div>

          {/* Local Ollama Cluster Health Monitor */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-purple-50/60 to-indigo-50/50 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-xs border border-purple-100">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Admin-Managed Local Ollama Cluster</h3>
                  <p className="text-xs text-slate-500">Dedicated on-premises NVLink inference cluster for private execution</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Cluster Status: Healthy
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-purple-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Loaded Models</span>
                <span className="font-bold text-slate-800">4 Active (Llama 3.3, DeepSeek R1, Qwen Coder, Mistral)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cluster Endpoint</span>
                <span className="font-mono text-purple-700 font-semibold">{adminStats.localOllamaStatus.serverUrl}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Average Response Latency</span>
                <span className="font-bold text-slate-800">~{adminStats.localOllamaStatus.avgLatencyMs} ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODEL GOVERNANCE matching Section 12 */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Model Credit Pricing & Endpoint Governance</h3>
              <p className="text-xs text-slate-500">Control platform credit deductions per request and enable/disable models.</p>
            </div>
            <button
              onClick={() => addToast('Add new model modal opened.', 'info')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Model
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFF] text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Model Name</th>
                  <th className="py-3 px-4 font-semibold">Provider / Source</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Credit Price</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4">{m.providerName}</td>
                    <td className="py-3 px-4">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        m.isLocal ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.isLocal ? 'Ollama Local' : 'Cloud API'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {m.creditsPerRequest} cr / req
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        m.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {m.isOnline ? 'Online' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => updateModelPricing(m.id, m.creditsPerRequest + 1, m.isOnline)}
                        className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 mr-2"
                      >
                        +1 cr
                      </button>
                      <button
                        onClick={() => updateModelPricing(m.id, m.creditsPerRequest, !m.isOnline)}
                        className={`rounded px-2 py-1 text-[11px] font-semibold ${
                          m.isOnline ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {m.isOnline ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT matching Section 12 */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Account Administration</h3>
              <p className="text-xs text-slate-500">Search users, assign subscription tiers, or grant/revoke credits.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFF] text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Credits</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managedUsers
                  .filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-indigo-700">{u.plan}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{u.credits.toLocaleString()} cr</td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setGrantCreditsModal({ open: true, userEmail: u.email })}
                          className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 mr-1.5"
                        >
                          Grant Credits
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`rounded px-2 py-1 text-[11px] font-semibold ${
                            u.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS matching Section 12 & 13 */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Privileged System Audit Logs</h3>
            <p className="text-xs text-slate-500">Immutable record of all administrative actions, model adjustments, and manual credit grants.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFF] text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Target</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{log.time}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-purple-700">{log.actor}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.target}</td>
                    <td className="py-3 px-4 text-slate-500">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Credits Modal */}
      {grantCreditsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Grant Platform Credits
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Recipient: <strong className="text-slate-800">{grantCreditsModal.userEmail}</strong>
            </p>

            <form onSubmit={handleGrantCredits} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credit Quantity
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Audit Reason
                </label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g. VIP promotion or incident compensation"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGrantCreditsModal({ open: false, userEmail: '' })}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-purple-800"
                >
                  Confirm Ledger Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
