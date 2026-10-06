import React, { useState, useEffect } from 'react';
import { 
  Zap, Baby, GraduationCap, Code2, Bug, FileCode, User, TrendingUp, SearchCheck,
  BookOpen, FileText, Wrench, Search, Flame, Target, PenTool, Compass, Lightbulb,
  Languages, Sparkles, Minimize2, Maximize2, Columns, List, Table, ListOrdered,
  Mail, FileCheck, HelpCircle, HeartHandshake
} from 'lucide-react';
import { ALL_SLASH_COMMANDS, SlashCommand } from '../lib/slashCommands';

interface SlashCommandMenuProps {
  filterText: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, any> = {
  Zap, Baby, GraduationCap, Code2, Bug, FileCode, User, TrendingUp, SearchCheck,
  BookOpen, FileText, Wrench, Search, Flame, Target, PenTool, Compass, Lightbulb,
  Languages, Sparkles, Minimize2, Maximize2, Columns, List, Table, ListOrdered,
  Mail, FileCheck, HelpCircle, HeartHandshake
};

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  filterText,
  onSelect,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = ALL_SLASH_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().includes(filterText.toLowerCase()) ||
    cmd.name.toLowerCase().includes(filterText.toLowerCase()) ||
    cmd.description.toLowerCase().includes(filterText.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filterText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        onSelect(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 w-full max-w-md bg-[#131825] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn backdrop-blur-md">
      <div className="p-2.5 bg-gray-900/80 border-b border-gray-800/80 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Smart Slash Commands ({filteredCommands.length})
        </span>
        <span className="text-[10px] text-gray-400">↑↓ to navigate • Enter to select</span>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-gray-800/40 p-1">
        {filteredCommands.map((cmd, idx) => {
          const IconComp = ICON_MAP[cmd.icon] || Zap;
          const isSelected = idx === selectedIndex;
          const isOpt = cmd.category === 'optimization';

          return (
            <button
              key={cmd.command}
              type="button"
              onClick={() => onSelect(cmd)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-all ${
                isSelected
                  ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                  : 'hover:bg-gray-800/50 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  isOpt 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300">{cmd.command}</span>
                    <span className="text-xs font-medium text-white">{cmd.name}</span>
                    {isOpt && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-semibold">
                        Token Saver
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{cmd.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
