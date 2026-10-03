import React, { useState } from 'react';
import {
  Boxes,
  Search,
  CheckCircle,
  ExternalLink,
  Shield,
  Globe,
  FileText,
  Terminal,
  Sparkles,
  HardDrive,
  Calendar,
  Lock,
  Power
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PluginMarketplaceView: React.FC = () => {
  const { plugins, togglePlugin, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  const categories = ['All', 'Developer', 'Search', 'Productivity', 'Creative'];

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const getPluginIcon = (name: string) => {
    switch (name) {
      case 'Globe':
        return Globe;
      case 'FileText':
        return FileText;
      case 'Terminal':
        return Terminal;
      case 'Sparkles':
        return Sparkles;
      case 'HardDrive':
        return HardDrive;
      case 'Calendar':
        return Calendar;
      default:
        return Boxes;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <Boxes className="h-4 w-4" />
            <span>TOOL ECOSYSTEM & SANDBOX RUNTIMES</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Plugin & Tools Marketplace</h1>
          <p className="text-xs text-slate-500">
            Augment your AI assistant with web browsing, isolated Python code execution, and cloud document indexing.
          </p>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plugins by name, capabilities, or permissions..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-3 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plugins Grid matching Section 9 & 10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => {
          const Icon = getPluginIcon(plugin.iconName);

          return (
            <div
              key={plugin.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{plugin.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <span>{plugin.author}</span>
                        <span>•</span>
                        <span>{plugin.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {plugin.isBuiltIn ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                        Built-in
                      </span>
                    ) : (
                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700">
                        OAuth 3P
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4 min-h-[36px]">
                  {plugin.description}
                </p>

                {/* Permissions explanation */}
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Required Permissions
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plugin.permissions.map((perm, pIdx) => (
                      <span
                        key={pIdx}
                        className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/70"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toggle switch and status */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      plugin.status === 'connected'
                        ? 'bg-emerald-500'
                        : plugin.status === 'needs_auth'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-500 capitalize">
                    {plugin.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {plugin.status === 'needs_auth' && !plugin.isEnabled && (
                    <button
                      onClick={() => addToast(`Authentication requested for ${plugin.name}.`, 'info')}
                      className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      Authorize
                    </button>
                  )}

                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      plugin.isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                    title={plugin.isEnabled ? 'Disable Plugin' : 'Enable Plugin'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        plugin.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
