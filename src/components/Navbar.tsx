import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  ShieldCheck,
  Coins,
  ChevronDown,
  User,
  Settings,
  CreditCard,
  LogOut,
  Sliders,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    user,
    currentView,
    setCurrentView,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightPanelOpen,
    setRightPanelOpen,
    toggleAdminRole,
    addToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addToast(`Searching for "${searchQuery}" across models and conversations...`, 'info');
    setCurrentView('explore');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white/90 px-4 backdrop-blur-md transition-all">
      {/* Left section: Logo & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20 text-white transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-[#172554]">AuraAI</span>
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide border border-indigo-200/60">
                PRO
              </span>
            </div>
            <p className="hidden text-[10px] text-slate-400 font-medium sm:block -mt-0.5">
              Next-Gen Multi-Model AI
            </p>
          </div>
        </div>
      </div>

      {/* Center section: Global Search matching page 1 */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model, plugin, or anything..."
            className="w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFF] py-2 pl-10 pr-4 text-sm text-[#172554] placeholder-slate-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100"
          />
        </form>
      </div>

      {/* Right section: Credits, Role switcher, Notifications, Profile, Right Panel Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Credits badge button */}
        <button
          onClick={() => setCurrentView('wallet')}
          className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-all hover:bg-amber-100 hover:shadow-xs"
          title="Click to manage credits"
        >
          <Coins className="h-4 w-4 text-amber-600 animate-pulse" />
          <span>{user.totalCredits.toLocaleString()}</span>
          <span className="hidden sm:inline text-amber-700/80 text-[11px] font-normal">Credits</span>
        </button>

        {/* User Guide PDF button */}
        <button
          onClick={() => setCurrentView('user-guide')}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
            currentView === 'user-guide'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Open Comprehensive User Guide (Generate PDF)"
        >
          <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
          <span className="hidden md:inline">User Guide (PDF)</span>
        </button>

        {/* Admin toggle badge */}
        <button
          onClick={toggleAdminRole}
          className={`hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
            user.role === 'admin'
              ? 'border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle between Admin & User role simulation"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{user.role === 'admin' ? 'Admin Mode' : 'User Mode'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] text-indigo-600 font-medium">3 unread</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-indigo-50/60 p-2">
                  <p className="font-medium text-indigo-950">DeepSeek R1 Distill Added</p>
                  <p className="text-slate-500 text-[11px]">Local reasoning model is now live in Ollama cluster.</p>
                </div>
                <div className="rounded-lg p-2 hover:bg-slate-50">
                  <p className="font-medium text-slate-800">Monthly Credits Grant</p>
                  <p className="text-slate-500 text-[11px]">+250 credits credited for your Free Plan cycle.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill matching PDF screenshot */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white py-1 pl-1.5 pr-2.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
            />
            <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
              {user.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 uppercase">
                    {user.plan}
                  </span>
                  <span className="text-[11px] text-slate-500">{user.totalCredits} credits</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setCurrentView('account')}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Account Settings
                </button>
                <button
                  onClick={() => setCurrentView('subscription')}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  Subscription & Billing
                </button>
                <button
                  onClick={() => setCurrentView('api-keys')}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  API Key Manager
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    Admin Console
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => addToast('Logged out of demo session.', 'info')}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Right Panel (Inspector) */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={`rounded-lg p-2 transition-colors ${
            rightPanelOpen
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
          title={rightPanelOpen ? 'Collapse Quick Panel' : 'Open Quick Panel'}
        >
          {rightPanelOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRightOpen className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
};
