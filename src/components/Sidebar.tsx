import React, { useState } from 'react';
import {
  Home,
  Plus,
  MessageSquare,
  Compass,
  Image as ImageIcon,
  Code2,
  FileText,
  Boxes,
  KeyRound,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  ShieldAlert,
  Search,
  Pin,
  Trash2,
  Edit2,
  Archive,
  ChevronRight,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react';
import { useApp, AppView } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    user,
    currentView,
    setCurrentView,
    conversations,
    activeConversationId,
    selectConversation,
    startNewChat,
    renameConversation,
    pinConversation,
    deleteConversation,
    archiveConversation,
    leftSidebarOpen,
    setLeftSidebarOpen
  } = useApp();

  const [chatSearch, setChatSearch] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const filteredConversations = conversations.filter(
    (c) =>
      !c.isArchived &&
      (c.title.toLowerCase().includes(chatSearch.toLowerCase()) ||
        c.messages.some((m) => m.content.toLowerCase().includes(chatSearch.toLowerCase())))
  );

  const pinnedChats = filteredConversations.filter((c) => c.isPinned);
  const todayChats = filteredConversations.filter((c) => !c.isPinned && c.category === 'today');
  const yesterdayChats = filteredConversations.filter((c) => !c.isPinned && c.category === 'yesterday');
  const previousChats = filteredConversations.filter(
    (c) => !c.isPinned && (c.category === 'previous_7_days' || c.category === 'older')
  );

  const handleStartRename = (e: React.MouseEvent, c: any) => {
    e.stopPropagation();
    setEditingChatId(c.id);
    setRenameTitle(c.title);
  };

  const handleSaveRename = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (renameTitle.trim()) {
      renameConversation(id, renameTitle.trim());
    }
    setEditingChatId(null);
  };

  const navItems: { view: AppView; label: string; icon: any; badge?: string }[] = [
    { view: 'home', label: 'Home', icon: Home },
    { view: 'explore', label: 'Explore Models', icon: Compass },
    { view: 'image-gen', label: 'Image Generation', icon: ImageIcon },
    { view: 'code-assistant', label: 'Code Assistant', icon: Code2 },
    { view: 'doc-analysis', label: 'Document Analysis', icon: FileText },
    { view: 'plugins', label: 'Plugin Marketplace', icon: Boxes },
    { view: 'api-keys', label: 'API Keys (BYOK)', icon: KeyRound },
    { view: 'wallet', label: 'Credit Wallet', icon: Wallet },
    { view: 'subscription', label: 'Subscription Plans', icon: CreditCard },
    { view: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
    { view: 'account', label: 'Account Settings', icon: Settings },
    { view: 'user-guide', label: 'User Guide (PDF)', icon: BookOpen, badge: 'PDF' },
  ];

  if (!leftSidebarOpen) {
    return (
      <aside className="hidden lg:flex w-16 flex-col items-center border-r border-[#E2E8F0] bg-white py-4 justify-between transition-all">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => startNewChat()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="h-px w-8 bg-slate-200 my-1" />
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                currentView === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Admin Console"
            >
              <ShieldAlert className="h-4 w-4" />
            </button>
          )}
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full ring-2 ring-indigo-500/20"
          />
        </div>
      </aside>
    );
  }

  const renderChatGroup = (title: string, chats: typeof conversations) => {
    if (chats.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          {title}
        </p>
        <div className="space-y-0.5">
          {chats.map((c) => {
            const isSelected = currentView === 'chat' && activeConversationId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/90 text-indigo-950 font-semibold shadow-2xs border border-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                  {c.isPinned ? (
                    <Pin className="h-3.5 w-3.5 text-indigo-600 shrink-0 rotate-45" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0 group-hover:text-slate-600" />
                  )}

                  {editingChatId === c.id ? (
                    <form
                      onSubmit={(e) => handleSaveRename(e, c.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    >
                      <input
                        type="text"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={(e) => handleSaveRename(e, c.id)}
                        autoFocus
                        className="w-full rounded bg-white px-1.5 py-0.5 text-xs border border-indigo-300 focus:outline-none"
                      />
                    </form>
                  ) : (
                    <span className="truncate text-left">{c.title}</span>
                  )}
                </div>

                {/* Quick actions on hover */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pinConversation(c.id);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    title={c.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleStartRename(e, c)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    title="Rename"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col justify-between h-[calc(100vh-4rem)] transition-all">
      {/* Top action: New Chat Button */}
      <div className="p-3 border-b border-slate-100">
        <button
          onClick={() => startNewChat()}
          className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-600 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">⌘K</span>
        </button>
      </div>

      {/* Main scrollable navigation and history */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Main Nav Section */}
        <div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin Console Entry (Only if admin role) */}
            {user.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  currentView === 'admin'
                    ? 'bg-purple-100 text-purple-900 font-bold shadow-2xs'
                    : 'text-purple-700 hover:bg-purple-50/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-purple-600" />
                  <span>Admin Console</span>
                </div>
                <span className="rounded bg-purple-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-purple-900 uppercase">
                  ROOT
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Chat History Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-semibold text-slate-800">Recent Chats</span>
            <span className="text-[10px] text-slate-400">{conversations.length} total</span>
          </div>

          {/* Quick Chat Filter Search */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Filter chats..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1 pl-8 pr-2 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {renderChatGroup('Pinned', pinnedChats)}
            {renderChatGroup('Today', todayChats)}
            {renderChatGroup('Yesterday', yesterdayChats)}
            {renderChatGroup('Previous 7 Days', previousChats)}

            {filteredConversations.length === 0 && (
              <div className="text-center py-4 px-2 text-slate-400 text-xs">
                No conversations match.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Banner & User Footer matching PDF screenshots */}
      <div className="p-3 border-t border-slate-100 space-y-2.5 bg-slate-50/40">
        {/* Upgrade Card if on Free */}
        {user.plan === 'free' && (
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-violet-50/50 p-2.5 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600" />
                Upgrade to Pro
              </span>
              <span className="text-[10px] font-semibold text-indigo-600">$30/mo</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2 leading-tight">
              Unlock DeepSeek R1 reasoning, 4,000 credits & fast GPU queue.
            </p>
            <button
              onClick={() => setCurrentView('subscription')}
              className="w-full rounded-lg bg-indigo-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              View Plans
            </button>
          </div>
        )}

        {/* User Card at bottom of sidebar matching Section 3 requirement */}
        <div
          onClick={() => setCurrentView('account')}
          className="flex items-center justify-between rounded-xl p-1.5 hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="capitalize font-medium text-indigo-600">{user.plan}</span>
                <span>•</span>
                <span>{user.totalCredits} credits</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
};
