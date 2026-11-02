import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Terminal,
  RotateCcw,
  Sparkles,
  Send,
  FileCode,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Flame,
  Bot,
  Zap,
  CheckCircle2,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getApiBase } from '../../lib/apiConfig';

type SupportedLanguage = 'python' | 'typescript' | 'sql' | 'java' | 'c' | 'csharp';

interface TemplateOption {
  id: string;
  label: string;
  language: SupportedLanguage;
  code: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'langchain_demo',
    label: '🦜 LangChain Prompt & Chain',
    language: 'python',
    code: `# AuraAI LangChain Core Prompt & Pipeline Execution
from langchain_core.prompts import PromptTemplate

# 1. Define structured prompt template
template = """You are an advanced AI engineer.
Task: Design a production pipeline for {topic}.
Primary Constraints: {constraints}
Target Metric: {metric}

Deliver the implementation blueprint with error handling."""

prompt = PromptTemplate(
    template=template,
    input_variables=["topic", "constraints", "metric"]
)

# 2. Format with dynamic parameters
formatted_prompt = prompt.format(
    topic="Multi-Model Realtime Code Execution & Sandbox",
    constraints="Docker / gVisor isolation, sub-second latency, zero cold-starts",
    metric="99.99% execution uptime & 100% security containment"
)

print("=" * 65)
print("✓ LANGCHAIN TEMPLATE COMPILED SUCCESSFULLY")
print("=" * 65)
print(formatted_prompt)
print("=" * 65)
print("Runtime validation complete: Ready for LLM invocation.")
`
  },
  {
    id: 'fibonacci_benchmark',
    label: '⚡ Fibonacci Benchmark (Python)',
    language: 'python',
    code: `# AuraAI Sandboxed Python Code Execution Benchmark
import math
import time

def calculate_fibonacci_sequence(n: int):
    """Generate first n Fibonacci numbers."""
    if n <= 0:
        return []
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

start_time = time.time()
result = calculate_fibonacci_sequence(25)
elapsed = (time.time() - start_time) * 1000

print(f"Computed 25 Fibonacci numbers in {elapsed:.4f}ms:")
print("Sequence:", result)
print(f"Golden ratio approximation (phi): {result[-1] / result[-2]:.8f}")
`
  },
  {
    id: 'ts_data_transform',
    label: '🚀 TypeScript Data Transform',
    language: 'typescript',
    code: `// AuraAI TypeScript 5.4 Data Pipeline
interface UserRecord {
  id: number;
  name: string;
  role: 'admin' | 'developer' | 'analyst';
  credits: number;
  active: boolean;
}

const users: UserRecord[] = [
  { id: 1, name: "Alice Walker", role: "admin", credits: 350, active: true },
  { id: 2, name: "Bob Martin", role: "developer", credits: 180, active: true },
  { id: 3, name: "Charlie Day", role: "analyst", credits: 75, active: false },
  { id: 4, name: "Diana Prince", role: "developer", credits: 420, active: true }
];

const activeDevelopers = users
  .filter(u => u.active && u.role === 'developer')
  .map(u => ({ ...u, bonusCredits: u.credits * 1.2 }));

console.log("=== Active Developers Summary ===");
console.table(activeDevelopers);
console.log(\`Total Active Developers: \${activeDevelopers.length}\`);
`
  },
  {
    id: 'sql_analytics',
    label: '🗄️ Interactive SQL Sandbox',
    language: 'sql',
    code: `-- Interactive SQL Sandbox pre-loaded with sample table
SELECT id, name, email, role, credits
FROM users
WHERE credits >= 150
ORDER BY credits DESC;

-- Calculate department metrics
SELECT role, COUNT(*) as total_users, AVG(credits) as avg_credits
FROM users
GROUP BY role;
`
  },
  {
    id: 'java_pipeline',
    label: '☕ Java 21 Class & Records',
    language: 'java',
    code: `public class Main {
    record ModelSpec(String name, String provider, int contextWindow) {}

    public static void main(String[] args) {
        var models = java.util.List.of(
            new ModelSpec("Claude 3.7 Sonnet", "Anthropic", 200000),
            new ModelSpec("GPT-4o", "OpenAI", 128000),
            new ModelSpec("DeepSeek R1", "DeepSeek", 64000)
        );

        System.out.println("=== AuraAI High Performance LLM Registry ===");
        models.forEach(m -> System.out.printf("• %-20s [%-10s] Context: %,d tokens%n", 
            m.name(), m.provider(), m.contextWindow()));
    }
}
`
  },
  {
    id: 'c_quicksort',
    label: '⚙️ C GCC Performance Algorithm',
    language: 'c',
    code: `#include <stdio.h>

void swap(int* a, int* b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90, 48, 77};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("Original array: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    
    quickSort(arr, 0, n - 1);
    
    printf("Sorted array:   ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\nExecution completed with GCC native optimization.\\n");
    return 0;
}
`
  }
];

export const CodeAssistantView: React.FC = () => {
  const {
    startNewChat,
    addToast,
    deductCredits,
    executionMode,
    setCurrentView,
    sandboxSnippet,
    clearSandboxSnippet
  } = useApp();

  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    'Sandbox ready. Click "Execute Code" (or press Ctrl + Enter) to run snippet in isolated runtime.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);
  const [execStatus, setExecStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [execDurationMs, setExecDurationMs] = useState<number | null>(null);
  const [importedBadge, setImportedBadge] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Load snippet from chat if available
  useEffect(() => {
    if (sandboxSnippet && sandboxSnippet.code) {
      setCode(sandboxSnippet.code);
      if (sandboxSnippet.language) {
        setLanguage(sandboxSnippet.language as SupportedLanguage);
      }
      const title = sandboxSnippet.sourceTitle || 'Snippet from Chat';
      setImportedBadge(title);
      setExecStatus('idle');
      setExecDurationMs(null);
      setConsoleOutput(
        `📥 Imported ${sandboxSnippet.language.toUpperCase()} code from Chat (${title}).\nClick "Execute Code" (Ctrl + Enter) to run in the isolated sandbox.`
      );

      if (sandboxSnippet.autoRun) {
        setTimeout(() => {
          handleExecute(sandboxSnippet.code, sandboxSnippet.language as SupportedLanguage);
        }, 150);
      }
    }
  }, [sandboxSnippet]);

  // Synchronize line numbers scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setImportedBadge(null);
    const matchedTemplate = TEMPLATES.find(t => t.language === newLang);
    if (matchedTemplate) {
      setCode(matchedTemplate.code);
    } else {
      setCode(`# Write ${newLang} code here...`);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const t = TEMPLATES.find(item => item.id === templateId);
    if (t) {
      setLanguage(t.language);
      setCode(t.code);
      setImportedBadge(null);
      setExecStatus('idle');
      setExecDurationMs(null);
      setConsoleOutput(`Loaded template: "${t.label}". Ready to execute.`);
      addToast(`Loaded ${t.label}`, 'info');
    }
  };

  const handleExecute = async (codeToRun = code, langToRun = language) => {
    if (!codeToRun.trim()) {
      addToast('Cannot execute empty code snippet.', 'warning');
      return;
    }

    setIsRunning(true);
    setExecStatus('idle');
    setConsoleOutput(`⚡ Initializing sandboxed ${langToRun.toUpperCase()} runtime container...`);

    if (executionMode === 'platform_managed') {
      deductCredits(1, 'Code Sandbox Execution');
    }

    const startTime = performance.now();

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/v1/code/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: langToRun, code: codeToRun })
      });

      const data = await response.json();
      const duration = Math.round(data.execution_time_ms || (performance.now() - startTime));
      setExecDurationMs(duration);

      if (data.error) {
        setExecStatus('error');
        setConsoleOutput(
          `[RUNTIME / EXECUTION ERROR] (Finished in ${duration}ms)\n\n${data.output || 'Process exited with error code.'}`
        );
        addToast('Execution failed with errors.', 'error');
      } else {
        setExecStatus('success');
        setConsoleOutput(
          `[SANDBOX RUNTIME: ${langToRun.toUpperCase()} | ${duration}ms]\n\n${data.output}`
        );
        addToast(`Code executed successfully in ${duration}ms.`, 'success');
      }
    } catch (error: any) {
      setExecStatus('error');
      setConsoleOutput(
        `[NETWORK / SYSTEM ERROR]\nFailed to connect to execution sandbox at ${getApiBase()}.\nDetails: ${error.message}`
      );
      addToast('Network error during execution.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
    // Allow Tab key indentation inside textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    addToast('Code copied to clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(consoleOutput);
    setOutputCopied(true);
    addToast('Terminal output copied.', 'info');
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const handleSendToChat = (action: string) => {
    const prompt = `Please ${action} for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    startNewChat(prompt);
  };

  const handleAskAIToFixError = () => {
    const prompt = `I got an execution error in the sandbox for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Error Output:**\n\`\`\`\n${consoleOutput}\n\`\`\`\n\nPlease debug the issue, explain what caused it, and provide the corrected code.`;
    startNewChat(prompt);
  };

  const getFileExtension = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'python': return 'py';
      case 'typescript': return 'ts';
      case 'sql': return 'sql';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'csharp': return 'cs';
      default: return 'txt';
    }
  };

  const codeLines = code.split('\n');

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-[#F8FAFF] to-slate-100 p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[11px] font-semibold tracking-wide uppercase">
                <Code2 className="h-3 w-3 text-indigo-600" />
                Interactive Code Runner & Sandbox
              </span>
              {importedBadge && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium animate-pulse">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Chat Code Imported
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Code Assistant & Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Test, debug, and execute code snippets in a high-speed sandboxed runtime with instant AI diagnostics.
            </p>
          </div>

          {/* Quick Actions & Launch Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {importedBadge && (
              <button
                onClick={() => setCurrentView('chat')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
                title="Return to Chat Conversation"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Chat</span>
              </button>
            )}

            {/* Template Selector */}
            <select
              onChange={(e) => handleTemplateSelect(e.target.value)}
              defaultValue=""
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:outline-none shadow-2xs transition-colors cursor-pointer"
            >
              <option value="" disabled>✨ Load Template...</option>
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:outline-none shadow-2xs transition-colors cursor-pointer"
            >
              <option value="python">🐍 Python 3.12 (LangChain Ready)</option>
              <option value="typescript">🔷 TypeScript 5.4</option>
              <option value="sql">🗄️ SQL (SQLite / PG Engine)</option>
              <option value="java">☕ Java 21</option>
              <option value="c">⚙️ C (GCC)</option>
              <option value="csharp">🔷 C# (.NET 8)</option>
            </select>

            {/* Execute Button */}
            <button
              onClick={() => handleExecute()}
              disabled={isRunning}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 fill-white text-white ${isRunning ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              <span>{isRunning ? 'Running...' : 'Execute Code'}</span>
              <kbd className="hidden sm:inline-block ml-1 rounded bg-emerald-800/60 px-1.5 py-0.5 text-[10px] text-emerald-200 font-mono">
                Ctrl+↵
              </kbd>
            </button>
          </div>
        </div>

        {/* Imported Banner Alert */}
        {importedBadge && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-100 px-4 py-2 text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Imported from Chat:</strong> Currently viewing code generated in your conversation. Edit freely or execute with one click.
              </span>
            </div>
            <button
              onClick={() => {
                setImportedBadge(null);
                clearSandboxSnippet();
                handleTemplateSelect('langchain_demo');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline text-[11px] ml-3 shrink-0"
            >
              Reset to Starter Demo
            </button>
          </div>
        )}
      </div>

      {/* Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Code Editor Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl flex flex-col h-[560px]">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 text-xs text-slate-300 font-mono select-none">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                <span>main.{getFileExtension(language)}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">
                {codeLines.length} lines • {code.length} chars
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode('')}
                className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors text-[11px]"
                title="Clear editor"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px]"
                title="Copy code to clipboard"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Editor Area with Line Numbers */}
          <div className="relative flex-1 flex overflow-hidden bg-slate-950 font-mono text-xs">
            {/* Synchronized Line Numbers Column */}
            <div
              ref={lineNumbersRef}
              className="select-none py-4 px-3 text-right text-slate-600 bg-slate-950/80 border-r border-slate-800/80 overflow-hidden leading-relaxed font-mono text-[12px] min-w-[42px]"
            >
              {codeLines.map((_, i) => (
                <div key={i} className="leading-relaxed">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full bg-transparent text-indigo-100/90 font-mono text-[12px] p-4 leading-relaxed resize-none focus:outline-none selection:bg-indigo-600/40 selection:text-white border-none overflow-auto"
              spellCheck={false}
              placeholder={`Write or paste ${language} code here...`}
            />
          </div>

          {/* AI Quick Actions Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-medium self-center mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>AI Assist:</span>
            </span>
            <button
              onClick={() => handleSendToChat('explain step-by-step with complexity analysis')}
              className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs text-[11px]"
            >
              💡 Explain Logic
            </button>
            <button
              onClick={() => handleSendToChat('refactor for high performance, clean code, and best practices')}
              className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs text-[11px]"
            >
              ⚡ Optimize
            </button>
            <button
              onClick={() => handleSendToChat('audit for security vulnerabilities, safety flaws, and injections')}
              className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs text-[11px]"
            >
              🛡️ Security Audit
            </button>
            <button
              onClick={() => handleSendToChat('write comprehensive unit tests and edge cases')}
              className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs text-[11px]"
            >
              🧪 Unit Tests
            </button>
          </div>
        </div>

        {/* Sandbox Output Console */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 overflow-hidden shadow-xl flex flex-col h-[560px]">
          {/* Terminal Header Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 text-xs font-mono select-none">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">TERMINAL STDOUT</span>
              
              {/* Status Indicator */}
              {isRunning ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Running...
                </span>
              ) : execStatus === 'success' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Exit Code: 0 {execDurationMs ? `(${execDurationMs}ms)` : ''}
                </span>
              ) : execStatus === 'error' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px]">
                  <AlertTriangle className="h-3 w-3 text-rose-400" />
                  Error {execDurationMs ? `(${execDurationMs}ms)` : ''}
                </span>
              ) : (
                <span className="text-slate-500 text-[11px] font-sans">Idle</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px]"
                title="Copy terminal output"
              >
                {outputCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{outputCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => {
                  setConsoleOutput('Console output cleared.');
                  setExecStatus('idle');
                  setExecDurationMs(null);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Console Output Screen */}
          <div className="flex-1 p-4 font-mono text-[12px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-text bg-[#090d16]">
            {execStatus === 'error' && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start justify-between gap-3 text-rose-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-rose-300">Execution encountered an error</p>
                    <p className="text-[11px] text-rose-400/90 mt-0.5">
                      Need help debugging this traceback? AuraAI can analyze and fix it automatically.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAskAIToFixError}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-medium transition-colors shadow-sm"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Fix with AI</span>
                </button>
              </div>
            )}

            <span className={execStatus === 'error' ? 'text-rose-300' : 'text-emerald-400'}>
              {consoleOutput}
            </span>
          </div>

          {/* Sandbox Footer Info Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Isolated Docker gVisor & Host Sandbox</span>
            </div>
            <div className="flex items-center gap-3">
              {execDurationMs !== null && (
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <Clock className="h-3 w-3" />
                  {execDurationMs}ms
                </span>
              )}
              <span className="text-slate-500">
                Cost: {executionMode === 'platform_managed' ? '1 credit / run' : 'BYOK (Free)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
