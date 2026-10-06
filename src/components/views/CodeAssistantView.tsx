import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CodeAssistantView: React.FC = () => {
  const { selectedModel, startNewChat, addToast, deductCredits, executionMode } = useApp();
  const [language, setLanguage] = useState<'python' | 'typescript' | 'sql' | 'java' | 'c' | 'csharp'>('python');
  const [code, setCode] = useState<string>(`# AuraAI Sandboxed Python Code Execution
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
result = calculate_fibonacci_sequence(15)
elapsed = (time.time() - start_time) * 1000

print(f"Computed 15 Fibonacci numbers in {elapsed:.3f}ms:")
print(result)
`);
  const [consoleOutput, setConsoleOutput] = useState<string>('Sandbox ready. Click "Execute Code" to run snippet in isolated runtime.');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (newLang: any) => {
    setLanguage(newLang);
    if (newLang === 'java') {
      setCode(`public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}`);
    } else if (newLang === 'c') {
      setCode(`#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}`);
    } else if (newLang === 'csharp') {
      setCode(`using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}`);
    } else if (newLang === 'python') {
      setCode(`print("Hello from Python!")`);
    } else if (newLang === 'typescript') {
      setCode(`console.log("Hello from TypeScript!");`);
    } else if (newLang === 'sql') {
      setCode(`SELECT * FROM users LIMIT 5;`);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleOutput('Executing in backend runtime container...');

    // If platform managed, small fee
    if (executionMode === 'platform_managed') {
      deductCredits(1, 'Code Sandbox Execution');
    }

    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'https://workflowsaura-app.onrender.com').replace(/\/+$/, '');
      const response = await fetch(`${apiBase}/api/v1/code/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setConsoleOutput(`[RUNTIME ERROR]\n${data.output}`);
        addToast('Execution failed.', 'error');
      } else {
        setConsoleOutput(`[SANDBOX RUNTIME: ${language.toUpperCase()}]\n\n${data.output}`);
        addToast('Code executed successfully.', 'success');
      }
    } catch (error: any) {
      setConsoleOutput(`[SYSTEM ERROR]\nFailed to connect to execution server: ${error.message}`);
      addToast('Network error during execution.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    addToast('Code copied to clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToChat = (action: string) => {
    const prompt = `Please ${action} for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    startNewChat(prompt);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <Code2 className="h-4 w-4" />
            <span>INTERACTIVE CODE RUNNER & ASSISTANT</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Code Assistant & Sandbox</h1>
          <p className="text-xs text-slate-500">
            Write, test, debug, and execute code snippets in a secure, sandboxed environment.
          </p>
        </div>

        {/* Quick Language Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-400 focus:outline-none shadow-2xs"
          >
            <option value="python">Python 3.12</option>
            <option value="typescript">TypeScript 5.4</option>
            <option value="java">Java 21</option>
            <option value="c">C (GCC)</option>
            <option value="csharp">C# (.NET 8)</option>
            <option value="sql">PostgreSQL 16</option>
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
          >
            <Play className={`h-3.5 w-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Execute Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Editor Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col h-[480px]">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-indigo-600" />
              <span>main.{language === 'python' ? 'py' : language === 'typescript' ? 'ts' : 'sql'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-900"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-slate-950 text-indigo-100 font-mono text-xs p-4 leading-relaxed resize-none focus:outline-none selection:bg-indigo-600"
            spellCheck={false}
          />

          {/* AI Quick Actions Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-medium self-center mr-1">AI Actions:</span>
            <button
              onClick={() => handleSendToChat('explain step-by-step with complexity analysis')}
              className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-2xs"
            >
              Explain
            </button>
            <button
              onClick={() => handleSendToChat('refactor for high performance and clean code')}
              className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-2xs"
            >
              Optimize
            </button>
            <button
              onClick={() => handleSendToChat('audit for security vulnerabilities')}
              className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-2xs"
            >
              Security Audit
            </button>
          </div>
        </div>

        {/* Sandbox Output Console */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 overflow-hidden shadow-2xs flex flex-col h-[480px]">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>TERMINAL STDOUT</span>
            </div>
            <button
              onClick={() => setConsoleOutput('Console cleared.')}
              className="hover:text-white"
            >
              Clear
            </button>
          </div>

          <pre className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed text-emerald-400 whitespace-pre-wrap">
            {consoleOutput}
          </pre>

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Isolated Docker gVisor Sandbox</span>
            </div>
            <span>Cost: 1 credit / run</span>
          </div>
        </div>
      </div>
    </div>
  );
};
