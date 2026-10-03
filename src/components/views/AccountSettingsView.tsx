import React, { useState } from 'react';
import {
  User,
  Shield,
  Laptop,
  Smartphone,
  LogOut,
  Trash2,
  Key,
  CheckCircle2,
  Lock,
  Globe,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AccountSettingsView: React.FC = () => {
  const {
    user,
    setUser,
    sessions,
    terminateSession,
    terminateAllOtherSessions,
    addToast
  } = useApp();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [retentionDays, setRetentionDays] = useState('90');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({
      ...prev,
      name,
      email,
      twoFactorEnabled: twoFactor
    }));
    addToast('Profile changes saved successfully.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
          <User className="h-4 w-4" />
          <span>SECURITY & IDENTITY</span>
        </div>
        <h1 className="text-2xl font-bold text-[#172554]">Account Settings & Sessions</h1>
        <p className="text-xs text-slate-500">
          Manage your personal profile, active multi-device sessions, OAuth accounts, and security preferences.
        </p>
      </div>

      {/* Profile Information Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Profile Details
        </h3>

        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <div>
            <button
              onClick={() => addToast('Avatar upload picker triggered.', 'info')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Change Avatar
            </button>
            <p className="text-[11px] text-slate-400 mt-1">JPG, PNG or GIF up to 2MB.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Active Sessions Manager matching Section 10 */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Sessions & Devices</h3>
            <p className="text-xs text-slate-500">
              Devices currently signed in with active access tokens.
            </p>
          </div>
          <button
            onClick={terminateAllOtherSessions}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out All Other Sessions
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600">
                  {sess.device.includes('iPhone') ? (
                    <Smartphone className="h-4 w-4" />
                  ) : (
                    <Laptop className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sess.device}</span>
                    {sess.isCurrent && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {sess.browser} • {sess.location} • IP: {sess.ipAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px]">{sess.lastActive}</span>
                {!sess.isCurrent && (
                  <button
                    onClick={() => terminateSession(sess.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Terminate session"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Accounts & Security */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Connected Accounts & Data Retention
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-center gap-2.5">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Google Account</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">Connected</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-indigo-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Two-Factor Auth (2FA)</span>
                <span className="text-[10px] text-slate-400">Authenticator App</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTwoFactor(!twoFactor);
                addToast(`Two-factor authentication ${!twoFactor ? 'enabled' : 'disabled'}.`, 'info');
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                twoFactor ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {twoFactor ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Data Retention */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Conversation History Retention Policy
          </label>
          <select
            value={retentionDays}
            onChange={(e) => {
              setRetentionDays(e.target.value);
              addToast(`Data retention updated to ${e.target.value} days.`, 'success');
            }}
            className="w-full sm:w-64 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="30">Retain for 30 Days</option>
            <option value="90">Retain for 90 Days (Recommended)</option>
            <option value="365">Retain for 1 Year</option>
            <option value="forever">Indefinite (Never auto-delete)</option>
          </select>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-rose-950">Delete Account & Purge Data</h3>
          <p className="text-xs text-rose-700/80">
            Permanently delete your account, saved BYOK keys, credits, and conversation histories.
          </p>
        </div>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-2xs"
        >
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. All active sessions will be terminated immediately and encrypted keys purged from the database.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  addToast('Demo account deletion simulated.', 'warning');
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
