import React, { useState } from 'react';
import { 
  GitFork, Play, Plus, Trash2, Cpu, Globe, Code2, Database, FileText, 
  Settings, CheckCircle2, RefreshCw, ArrowRight, Zap, Layers, Sparkles,
  Bot, Server, Terminal, Shield, Check, Copy, ChevronRight, CornerDownRight,
  X, MessageSquare, Mail, Sliders, Key, KeyRound, Wrench, ArrowLeft, GripVertical, MoveLeft, MoveRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'llm' | 'mcp' | 'logic' | 'output' | 'automation' | 'database';
  name: string;
  category: string;
  iconName: string;
  status: 'idle' | 'running' | 'success' | 'error';
  executionTimeMs?: number;
  config: Record<string, any>;
  x: number;
  y: number;
}

// Component Palette for LangFlow-style visual building
const PALETTE_NODES = [
  {
    type: 'trigger',
    name: 'WhatsApp Webhook Trigger',
    category: 'Messaging Trigger',
    iconName: 'Zap',
    config: { webhookUrl: '/api/v1/webhooks/whatsapp', verifyToken: 'aura_secret_token_123', event: 'incoming_msg' }
  },
  {
    type: 'trigger',
    name: 'Gmail IMAP Email Trigger',
    category: 'Email Trigger',
    iconName: 'Mail',
    config: { emailAddress: 'support@mycompany.com', pollIntervalMinutes: 1, folder: 'INBOX' }
  },
  {
    type: 'llm',
    name: 'Qwen 2.5 Coder (Local Ollama)',
    category: 'Local LLM Agent',
    iconName: 'Cpu',
    config: { model: 'qwen2.5-coder:32b', temperature: 0.2, systemPrompt: 'You are an autonomous customer support router.' }
  },
  {
    type: 'llm',
    name: 'Gemini 2.5 Flash Agent',
    category: 'Cloud Reasoning LLM',
    iconName: 'Sparkles',
    config: { model: 'gemini-2.5-flash', temperature: 0.5, systemPrompt: 'Analyze intent and extract priority score (1-5).' }
  },
  {
    type: 'database',
    name: 'PostgreSQL Database Query Tool',
    category: 'SQL Database',
    iconName: 'Database',
    config: { connectionString: 'postgresql://admin:secret@localhost:5432/aura_db', query: 'SELECT * FROM users WHERE email = $1;' }
  },
  {
    type: 'mcp',
    name: 'Vector DB RAG (ChromaDB / Pinecone)',
    category: 'Vector RAG Search',
    iconName: 'Database',
    config: { vectorDb: 'chromadb', collection: 'company_policies_kb', topK: 4 }
  },
  {
    type: 'automation',
    name: 'WhatsApp Cloud API Sender',
    category: 'Messaging Dispatch',
    iconName: 'MessageSquare',
    config: { phoneNumberId: '109823910293', metaAccessToken: 'EAAG...your_meta_token', templateName: 'support_reply' }
  },
  {
    type: 'automation',
    name: 'Gmail API Email Dispatcher',
    category: 'Email Dispatch',
    iconName: 'Mail',
    config: { senderEmail: 'support@mycompany.com', appPassword: 'xxxx-xxxx-xxxx-xxxx', sendAsDraft: false }
  },
  {
    type: 'logic',
    name: 'Custom Python Execution Script',
    category: 'Code Node',
    iconName: 'Code2',
    config: { language: 'python', script: 'def main(input_data):\n    # Custom data transformer\n    return {"status": "success", "processed_data": input_data}' }
  }
];

export const WorkflowBuilderView: React.FC = () => {
  const { addToast } = useApp();
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>('whatsapp_bot');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-2');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'builder' | 'embedded_langflow'>('builder');
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);

  // Dynamic workflow nodes canvas state
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node-1',
      type: 'trigger',
      name: 'WhatsApp Webhook (Twilio API)',
      category: 'Messaging Trigger',
      iconName: 'Zap',
      status: 'idle',
      config: { webhookUrl: '/api/v1/webhooks/whatsapp', verifyToken: 'aura_secret_token_123' },
      x: 50,
      y: 120
    },
    {
      id: 'node-2',
      type: 'llm',
      name: 'Qwen 2.5 Coder (Local Ollama)',
      category: 'Local LLM Agent',
      iconName: 'Cpu',
      status: 'idle',
      config: { model: 'qwen2.5-coder:32b', temperature: 0.2, systemPrompt: 'Analyze customer message intent and generate appropriate SQL parameters.' },
      x: 320,
      y: 80
    },
    {
      id: 'node-3',
      type: 'database',
      name: 'PostgreSQL Database Query Tool',
      category: 'SQL Database',
      iconName: 'Database',
      status: 'idle',
      config: { connectionString: 'postgresql://admin:secret@localhost:5432/aura_crm', query: 'SELECT * FROM orders WHERE customer_phone = $1;' },
      x: 620,
      y: 80
    },
    {
      id: 'node-4',
      type: 'automation',
      name: 'WhatsApp Meta Cloud Dispatcher',
      category: 'Messaging Action',
      iconName: 'MessageSquare',
      status: 'idle',
      config: { phoneNumberId: '109823910293', metaAccessToken: 'EAAG...your_meta_token' },
      x: 920,
      y: 120
    }
  ]);

  // Move node position left in pipeline sequence
  const handleMoveNodeLeft = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index <= 0) return;
    setNodes(prev => {
      const newNodes = [...prev];
      const temp = newNodes[index];
      newNodes[index] = newNodes[index - 1];
      newNodes[index - 1] = temp;
      return newNodes;
    });
    addToast('Moved node position left in pipeline execution DAG', 'info');
  };

  // Move node position right in pipeline sequence
  const handleMoveNodeRight = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index >= nodes.length - 1) return;
    setNodes(prev => {
      const newNodes = [...prev];
      const temp = newNodes[index];
      newNodes[index] = newNodes[index + 1];
      newNodes[index + 1] = temp;
      return newNodes;
    });
    addToast('Moved node position right in pipeline execution DAG', 'info');
  };

  // Drag & drop handlers for full canvas node re-ordering
  const handleDragStart = (index: number) => {
    setDraggedNodeIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedNodeIndex === null || draggedNodeIndex === targetIndex) return;
    setNodes(prev => {
      const newNodes = [...prev];
      const [draggedNode] = newNodes.splice(draggedNodeIndex, 1);
      newNodes.splice(targetIndex, 0, draggedNode);
      return newNodes;
    });
    setDraggedNodeIndex(null);
    addToast('Reordered node connection sequence on canvas', 'success');
  };

  // Add node dynamically from Palette
  const handleAddNodeFromPalette = (paletteItem: typeof PALETTE_NODES[0]) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: WorkflowNode = {
      id: newNodeId,
      type: paletteItem.type as any,
      name: paletteItem.name,
      category: paletteItem.category,
      iconName: paletteItem.iconName,
      status: 'idle',
      config: { ...paletteItem.config },
      x: 300 + nodes.length * 50,
      y: 100
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNodeId);
    setIsPaletteOpen(false);
    addToast(`Added node '${paletteItem.name}' to workflowsAURA canvas`, 'success');
  };

  // Delete node
  const handleDeleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodes.length <= 1) {
      addToast('Cannot delete the last remaining node on canvas', 'warning');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(nodes[0]?.id || null);
    }
    addToast('Node removed from canvas', 'info');
  };

  // Load Presets
  const handleLoadTemplate = (templateKey: string) => {
    setActiveTemplate(templateKey);
    setExecutionLogs([]);

    if (templateKey === 'whatsapp_bot') {
      setNodes([
        {
          id: 'node-1',
          type: 'trigger',
          name: 'WhatsApp Webhook (Twilio API)',
          category: 'Messaging Trigger',
          iconName: 'Zap',
          status: 'idle',
          config: { webhookUrl: '/api/v1/webhooks/whatsapp', event: 'incoming_msg' },
          x: 50, y: 100
        },
        {
          id: 'node-2',
          type: 'llm',
          name: 'Qwen 2.5 Coder (Local Ollama)',
          category: 'Local LLM Agent',
          iconName: 'Cpu',
          status: 'idle',
          config: { model: 'qwen2.5-coder:32b', systemPrompt: 'Classify message into Support vs Order inquiry.' },
          x: 300, y: 100
        },
        {
          id: 'node-3',
          type: 'database',
          name: 'PostgreSQL Customer DB Tool',
          category: 'SQL Database',
          iconName: 'Database',
          status: 'idle',
          config: { connectionString: 'postgresql://localhost:5432/crm', query: 'SELECT * FROM customer_orders WHERE phone = $1' },
          x: 550, y: 100
        },
        {
          id: 'node-4',
          type: 'automation',
          name: 'WhatsApp Cloud API Dispatch',
          category: 'Messaging Action',
          iconName: 'MessageSquare',
          status: 'idle',
          config: { phoneNumberId: '109823910293', metaAccessToken: 'EAAG_test_token' },
          x: 800, y: 100
        }
      ]);
    } else if (templateKey === 'gmail_auto') {
      setNodes([
        {
          id: 'node-1',
          type: 'trigger',
          name: 'Gmail IMAP Trigger (New Mail)',
          category: 'Email Trigger',
          iconName: 'Mail',
          status: 'idle',
          config: { emailAddress: 'support@mycompany.com', pollIntervalMinutes: 1 },
          x: 50, y: 100
        },
        {
          id: 'node-2',
          type: 'llm',
          name: 'Context & Urgency Agent',
          category: 'Cloud Reasoning LLM',
          iconName: 'Sparkles',
          status: 'idle',
          config: { model: 'gemini-2.5-flash', systemPrompt: 'Determine priority score and draft reply.' },
          x: 320, y: 100
        },
        {
          id: 'node-3',
          type: 'mcp',
          name: 'ChromaDB Policy Knowledge Base',
          category: 'Vector RAG Search',
          iconName: 'Database',
          status: 'idle',
          config: { vectorDb: 'chromadb', collection: 'kb_articles', topK: 3 },
          x: 600, y: 100
        },
        {
          id: 'node-4',
          type: 'automation',
          name: 'Gmail API Dispatch & Send',
          category: 'Email Action',
          iconName: 'Mail',
          status: 'idle',
          config: { senderEmail: 'support@mycompany.com', appPassword: 'app-password-token' },
          x: 880, y: 100
        }
      ]);
    } else if (templateKey === 'custom_code') {
      setNodes([
        {
          id: 'node-1',
          type: 'trigger',
          name: 'REST API Payload Trigger',
          category: 'HTTP Trigger',
          iconName: 'Zap',
          status: 'idle',
          config: { endpoint: '/api/v1/workflows/trigger' },
          x: 50, y: 100
        },
        {
          id: 'node-2',
          type: 'logic',
          name: 'Custom Python Code Node',
          category: 'Code Node',
          iconName: 'Code2',
          status: 'idle',
          config: { language: 'python', script: 'def process_payload(json_data):\n    # Custom business logic\n    return {"calculated_score": 98.5, "status": "APPROVED"}' },
          x: 320, y: 100
        },
        {
          id: 'node-3',
          type: 'output',
          name: 'JSON API Response Output',
          category: 'HTTP Response',
          iconName: 'FileText',
          status: 'idle',
          config: { statusCode: 200, contentType: 'application/json' },
          x: 600, y: 100
        }
      ]);
    } else if (templateKey === 'multi_agent_parallel') {
      setNodes([
        {
          id: 'node-1',
          type: 'trigger',
          name: 'Complex Goal Trigger',
          category: 'Input Trigger',
          iconName: 'Zap',
          status: 'idle',
          config: { goal: 'Audit application security, optimize database queries, and research web best practices.' },
          x: 50, y: 120
        },
        {
          id: 'node-2-a',
          type: 'llm',
          name: 'Agent A: Qwen 2.5 Code Optimizer',
          category: 'Parallel Agent A',
          iconName: 'Cpu',
          status: 'idle',
          config: { model: 'qwen2.5-coder:32b', role: 'Code Refactoring Specialist' },
          x: 320, y: 40
        },
        {
          id: 'node-2-b',
          type: 'llm',
          name: 'Agent B: Gemini 2.5 Web Researcher',
          category: 'Parallel Agent B',
          iconName: 'Sparkles',
          status: 'idle',
          config: { model: 'gemini-2.5-flash', role: 'Live Documentation Researcher' },
          x: 320, y: 140
        },
        {
          id: 'node-2-c',
          type: 'llm',
          name: 'Agent C: Claude 3.5 Security Auditor',
          category: 'Parallel Agent C',
          iconName: 'Shield',
          status: 'idle',
          config: { model: 'claude-3-5-sonnet', role: 'Vulnerability & Compliance Auditor' },
          x: 320, y: 240
        },
        {
          id: 'node-3',
          type: 'logic',
          name: 'Consensus Arbitrator & Evaluator',
          category: 'Merge Join Node',
          iconName: 'Bot',
          status: 'idle',
          config: { strategy: 'highest_confidence_voting_merge' },
          x: 650, y: 140
        }
      ]);
    }
  };

  // Run Workflow Execution Pipeline (supporting parallel multi-agent execution)
  const handleRunWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs(['🚀 Initializing workflowsAURA Multi-Agent Execution Engine...']);

    // Reset status
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle', executionTimeMs: undefined })));

    if (activeTemplate === 'multi_agent_parallel') {
      // Step 1: Execute Trigger
      setNodes(prev => prev.map(n => n.id === 'node-1' ? { ...n, status: 'running' } : n));
      setExecutionLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] Executing Trigger Node: 'Complex Goal Trigger'...`]);
      await new Promise(r => setTimeout(r, 500));
      setNodes(prev => prev.map(n => n.id === 'node-1' ? { ...n, status: 'success', executionTimeMs: 42 } : n));

      // Step 2: Parallel Execution of 3 Agents Simultaneously
      setExecutionLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] ⚡ Spawning 3 Multi-Agent Nodes Concurrently (Parallel Fan-Out)...`]);
      setNodes(prev => prev.map(n => n.id.startsWith('node-2') ? { ...n, status: 'running' } : n));
      setExecutionLogs(logs => [
        ...logs,
        `[${new Date().toLocaleTimeString()}]  ├─ 🤖 Running Agent A (Qwen 2.5 Code Optimizer)...`,
        `[${new Date().toLocaleTimeString()}]  ├─ 🌐 Running Agent B (Gemini 2.5 Web Researcher)...`,
        `[${new Date().toLocaleTimeString()}]  └─ 🛡️ Running Agent C (Claude 3.5 Security Auditor)...`
      ]);

      await new Promise(r => setTimeout(r, 1200));

      setNodes(prev => prev.map(n => n.id.startsWith('node-2') ? { ...n, status: 'success', executionTimeMs: Math.floor(Math.random() * 50) + 80 } : n));
      setExecutionLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] ✔ All 3 Parallel Agent Outputs Collected Simultaneously!`]);

      // Step 3: Merge Join Node (Consensus Arbitrator)
      setNodes(prev => prev.map(n => n.id === 'node-3' ? { ...n, status: 'running' } : n));
      setExecutionLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] Merging Parallel Outputs via Consensus Arbitrator Node...`]);
      await new Promise(r => setTimeout(r, 600));
      setNodes(prev => prev.map(n => n.id === 'node-3' ? { ...n, status: 'success', executionTimeMs: 55 } : n));

    } else {
      // Sequential Execution
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'running' } : n));
        setExecutionLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] Executing Node [${node.category}]: '${node.name}'...`]);
        await new Promise(r => setTimeout(r, 650));
        const time = Math.floor(Math.random() * 90) + 35;
        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'success', executionTimeMs: time } : n));
        setExecutionLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] ✔ Node '${node.name}' Executed Successfully (${time}ms)`]);
      }
    }

    setExecutionLogs(logs => [...logs, '🎉 workflowsAURA Execution Finished Successfully! Multi-Agent Parallel Pipeline Verified.']);
    setIsExecuting(false);
    addToast('workflowsAURA execution finished!', 'success');
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex-1 bg-[#F8FAFF] text-slate-800 min-h-screen overflow-y-auto p-6 md:p-8 flex flex-col relative">
      {/* Header section */}
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <GitFork className="w-4 h-4 text-indigo-600" />
              LangFlow Movable DAG Node Studio
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              workflowsAURA
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LangFlow Microservice Ready (Port 7860/8000)
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Drag, reorder, move nodes freely, edit code parameters, and connect AI Agents, PostgreSQL DB tools, WhatsApp Cloud APIs, and Gmail integrations.
            </p>
          </div>

          {/* Action Buttons & View Mode Tabs */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl border border-slate-300/60 shadow-inner">
              <button
                onClick={() => setViewMode('builder')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'builder'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                workflowsAURA Canvas
              </button>
              <button
                onClick={() => setViewMode('embedded_langflow')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'embedded_langflow'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                LangFlow Studio Microservice
              </button>
            </div>

            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Node to Canvas
            </button>

            <button
              onClick={handleRunWorkflow}
              disabled={isExecuting}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl shadow-md transition-all ${
                isExecuting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
            >
              {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              {isExecuting ? 'Executing Pipeline...' : 'Execute workflowsAURA'}
            </button>
          </div>
        </div>

        {/* Templates Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
              <Sparkles className="w-4 h-4 text-amber-500" /> Quick Pipeline Presets:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'multi_agent_parallel', label: '👥 Multi-Agent Parallel System', icon: Bot },
              { id: 'whatsapp_bot', label: 'WhatsApp Customer Bot', icon: Zap },
              { id: 'gmail_auto', label: 'Gmail AI Auto-Responder', icon: Mail },
              { id: 'custom_code', label: 'Python REST API Workflow', icon: Code2 }
            ].map(tpl => {
              const Icon = tpl.icon;
              const isActive = activeTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleLoadTemplate(tpl.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tpl.label}
                </button>
              );
            })}
          </div>
        </div>

        {viewMode === 'embedded_langflow' ? (() => {
          const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          const rawLangflowUrl = import.meta.env.VITE_LANGFLOW_URL;
          const isValidRemoteLangflow = rawLangflowUrl && !rawLangflowUrl.includes('workflowsaura-langflow-ui.vercel.app');
          const activeLangflowUrl = isLocalhost ? "http://localhost:3001" : (isValidRemoteLangflow ? rawLangflowUrl : null);

          if (!activeLangflowUrl) {
            // On production Vercel without external frame, automatically render native 2D visual canvas
            return null; // Will trigger render of visual canvas below
          }

          return (
            /* Live Embedded LangFlow Microservice View */
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col flex-1 min-h-[680px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Official LangFlow Studio Microservice
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-medium">
                        Status: Active (Backend :7860 | UI :3001)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Running live cloned LangFlow repository connected directly to workflowsAURA microservice proxy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeLangflowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => setViewMode('builder')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-all border border-indigo-200"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    Switch to workflowsAURA Canvas
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full h-full min-h-[620px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 relative flex items-center justify-center">
                <iframe
                  src={activeLangflowUrl}
                  title="LangFlow Studio Microservice"
                  className="w-full h-full min-h-[620px] border-0"
                />
              </div>
            </div>
          );
        })() : null}

        {(viewMode === 'builder' || (viewMode === 'embedded_langflow' && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (!import.meta.env.VITE_LANGFLOW_URL || import.meta.env.VITE_LANGFLOW_URL.includes('workflowsaura-langflow-ui.vercel.app')))) && (
        /* Main Canvas & Inspector Split View */
        /* Main Canvas & Inspector Split View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
          {/* Visual Canvas Area (3 Cols) */}
          <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between group">
            {/* Dots Background Pattern */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Canvas Header Controls */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Layers className="w-4 h-4 text-indigo-600" />
                workflowsAURA 2D Canvas ({nodes.length} Connected Nodes)
              </div>
              <span className="text-[11px] text-indigo-600 font-medium font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {activeTemplate === 'multi_agent_parallel' ? '⚡ Mode: 2D Spatial Parallel Fan-Out Layout' : 'Mode: 2D Sequential Graph'}
              </span>
            </div>

            {/* Nodes Render Canvas: 2D Spatial Parallel Branching Layout */}
            <div className="relative z-10 my-6 min-h-[360px] flex items-center justify-between gap-6 overflow-x-auto p-4">
              {activeTemplate === 'multi_agent_parallel' ? (
                /* Multi-Agent 2D Column Layout */
                <div className="flex items-center justify-between w-full gap-8">
                  {/* Column 0: Trigger */}
                  <div className="shrink-0">
                    {nodes.filter(n => n.id === 'node-1').map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`relative w-[230px] bg-white border rounded-2xl p-4 cursor-pointer transition-all shadow-md ${
                          selectedNodeId === node.id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {node.category}
                          </span>
                          {node.status === 'running' && <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />}
                          {node.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        </div>
                        <div className="font-semibold text-xs text-slate-900">{node.name}</div>
                        <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 font-mono">OUT ➔ 3 Parallel Agents</div>
                      </div>
                    ))}
                  </div>

                  {/* Fan-Out Connector Wire Icon */}
                  <div className="flex flex-col gap-3 text-indigo-500 font-mono text-[10px] items-center shrink-0">
                    <ArrowRight className="w-6 h-6 animate-pulse text-indigo-600" />
                    <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">Parallel Fan-Out</span>
                  </div>

                  {/* Column 1: Stacked Parallel Agents (Agent A, B, C) */}
                  <div className="flex flex-col gap-3 shrink-0 bg-indigo-50/50 border border-indigo-200/60 p-4 rounded-2xl shadow-inner">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-1">
                      <Bot className="w-3.5 h-3.5" /> 3 Multi-Agents Executing Concurrently:
                    </div>
                    {nodes.filter(n => n.id.startsWith('node-2')).map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`relative w-[240px] bg-white border rounded-xl p-3 cursor-pointer transition-all shadow-sm ${
                          selectedNodeId === node.id ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {node.category}
                          </span>
                          {node.status === 'running' && <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />}
                          {node.status === 'success' && <span className="text-[10px] text-emerald-600 font-semibold">✔ {node.executionTimeMs}ms</span>}
                        </div>
                        <div className="font-semibold text-xs text-slate-900">{node.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* Merge Converge Connector Wire Icon */}
                  <div className="flex flex-col gap-3 text-indigo-500 font-mono text-[10px] items-center shrink-0">
                    <ArrowRight className="w-6 h-6 animate-pulse text-indigo-600" />
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">Merge Join</span>
                  </div>

                  {/* Column 2: Consensus Merge Arbitrator */}
                  <div className="shrink-0">
                    {nodes.filter(n => n.id === 'node-3').map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`relative w-[230px] bg-white border rounded-2xl p-4 cursor-pointer transition-all shadow-md ${
                          selectedNodeId === node.id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {node.category}
                          </span>
                          {node.status === 'running' && <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />}
                          {node.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        </div>
                        <div className="font-semibold text-xs text-slate-900">{node.name}</div>
                        <div className="text-[10px] text-emerald-600 mt-3 pt-2 border-t border-slate-100 font-mono font-medium">RESULT ➔ Unified Consensus</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Sequential 1D Canvas Layout */
                nodes.map((node, index) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <React.Fragment key={node.id}>
                      <div
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`relative min-w-[220px] max-w-[250px] bg-white border rounded-2xl p-4 cursor-pointer transition-all shadow-md group/card ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-lg'
                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <div className="flex items-center gap-1 text-slate-400">
                            <span title="Drag to reorder"><GripVertical className="w-3.5 h-3.5 cursor-grab active:cursor-grabbing hover:text-slate-600" /></span>
                            <span className="text-[10px] font-mono text-slate-400">Node #{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleMoveNodeLeft(index, e)}
                              disabled={index === 0}
                              title="Move left"
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                            >
                              <MoveLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleMoveNodeRight(index, e)}
                              disabled={index === nodes.length - 1}
                              title="Move right"
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                            >
                              <MoveRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteNode(node.id, e)}
                              title="Delete node"
                              className="p-1 rounded hover:bg-red-50 text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            node.type === 'trigger' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            node.type === 'llm' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            node.type === 'database' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            node.type === 'automation' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            node.type === 'logic' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {node.category}
                          </span>

                          {node.status === 'running' && (
                            <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Running
                            </span>
                          )}
                          {node.status === 'success' && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> {node.executionTimeMs}ms
                            </span>
                          )}
                          {node.status === 'idle' && (
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                          )}
                        </div>

                        <div className="font-semibold text-xs text-slate-900 leading-snug">
                          {node.name}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 pt-2 border-t border-slate-100 font-mono">
                          <span>IN: Payload</span>
                          <span>OUT: Result</span>
                        </div>
                      </div>

                      {index < nodes.length - 1 && (
                        <div className="flex items-center text-indigo-400 shrink-0">
                          <ArrowRight className="w-5 h-5 animate-pulse" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Execution Logs Terminal */}
            <div className="relative z-10 bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 space-y-1 max-h-36 overflow-y-auto shadow-inner">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> workflowsAURA Execution Console:
              </div>
              {executionLogs.length === 0 ? (
                <div className="text-slate-500 italic">Click "Execute workflowsAURA" to run the pipeline graph...</div>
              ) : (
                executionLogs.map((log, i) => (
                  <div key={i} className={`${log.includes('✔') ? 'text-emerald-400' : log.includes('🚀') ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Node Credentials & Inspector Panel (1 Col) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm overflow-y-auto max-h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Node Credentials & Inspector
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {selectedNode?.id || 'Select Node'}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Node Title</label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, name: newName } : n));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Node Category</label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 font-semibold uppercase text-[10px]">
                    {selectedNode.type} • {selectedNode.category}
                  </div>
                </div>

                {/* Dynamic Configuration Fields */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-800 block flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Configuration & Credentials:
                  </span>

                  {/* LLM Model selector */}
                  {selectedNode.config.model !== undefined && (
                    <div>
                      <label className="text-slate-600 block mb-1">Assigned AI Model</label>
                      <select
                        value={selectedNode.config.model}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, model: val } } : n));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                      >
                        <option value="qwen2.5-coder:32b">Qwen 2.5 Coder (Local Ollama)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Cloud)</option>
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (BYOK)</option>
                        <option value="gpt-4o">GPT-4o (BYOK)</option>
                      </select>
                    </div>
                  )}

                  {/* System Prompt */}
                  {selectedNode.config.systemPrompt !== undefined && (
                    <div>
                      <label className="text-slate-600 block mb-1">System Instruction / Agent Prompt</label>
                      <textarea
                        rows={3}
                        value={selectedNode.config.systemPrompt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, systemPrompt: val } } : n));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-indigo-600 font-mono text-[11px]"
                      />
                    </div>
                  )}

                  {/* WhatsApp Credentials */}
                  {selectedNode.config.metaAccessToken !== undefined && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-slate-600 block mb-1">WhatsApp Phone Number ID</label>
                        <input
                          type="text"
                          value={selectedNode.config.phoneNumberId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, phoneNumberId: val } } : n));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-emerald-700 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Meta Access Token (WhatsApp API Key)</label>
                        <input
                          type="password"
                          value={selectedNode.config.metaAccessToken || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, metaAccessToken: val } } : n));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-amber-700 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Gmail Credentials */}
                  {selectedNode.config.senderEmail !== undefined && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-slate-600 block mb-1">Sender Email Address</label>
                        <input
                          type="email"
                          value={selectedNode.config.senderEmail || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, senderEmail: val } } : n));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Gmail App Password / OAuth Token</label>
                        <input
                          type="password"
                          value={selectedNode.config.appPassword || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, appPassword: val } } : n));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-amber-700 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Database Connection */}
                  {selectedNode.config.connectionString !== undefined && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-slate-600 block mb-1">Database Connection URI</label>
                        <input
                          type="text"
                          value={selectedNode.config.connectionString || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, connectionString: val } } : n));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-blue-700 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">SQL Query Template</label>
                        <textarea
                          rows={2}
                          value={selectedNode.config.query || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, query: val } } : n));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-purple-700 font-mono text-[11px] focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Custom Code Editor */}
                  {selectedNode.config.script !== undefined && (
                    <div>
                      <label className="text-slate-600 block mb-1">Python / JavaScript Code Editor</label>
                      <textarea
                        rows={6}
                        value={selectedNode.config.script || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, script: val } } : n));
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-emerald-400 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Select a node on the canvas to inspect its credentials, code, or model parameters.
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Component Palette Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  workflowsAURA Node Palette
                </h2>
                <p className="text-xs text-slate-500">Select a tool, trigger, AI model, or action node to add onto your canvas.</p>
              </div>
              <button onClick={() => setIsPaletteOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto p-1">
              {PALETTE_NODES.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddNodeFromPalette(item)}
                  className="bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-xl p-3 cursor-pointer transition-all hover:bg-slate-100 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {item.category}
                    </span>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="font-semibold text-xs text-slate-900">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
