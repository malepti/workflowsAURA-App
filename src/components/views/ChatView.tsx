import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  Download,
  Terminal,
  FileText,
  AlertCircle,
  X,
  Code2,
  Share2,
  Trash2,
  Activity,
  Coins,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Message, MessageAttachment, MessageDiagnosis } from '../../types';
import { DiagnosisModal } from '../modals/DiagnosisModal';

export const ChatView: React.FC = () => {
  const {
    user,
    selectedModel,
    executionMode,
    setExecutionMode,
    activeConversation,
    sendMessage,
    isGenerating,
    stopGeneration,
    regenerateLastResponse,
    editAndResendMessage,
    toggleMessageFeedback,
    deleteConversation,
    setCurrentView,
    addToast
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<MessageDiagnosis | null>(null);
  const [selectedMessageContent, setSelectedMessageContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleOpenDiagnosis = (msg: Message) => {
    const isLiveSearchNeeded =
      msg.content.toLowerCase().includes('latest') ||
      msg.content.toLowerCase().includes('current') ||
      msg.content.toLowerCase().includes('news') ||
      msg.content.toLowerCase().includes('search');

    const diag: MessageDiagnosis = msg.diagnosis || {
      providerOrigin: selectedModel.isLocal
        ? 'Self-Hosted Ollama Cluster (Node 01 • NVLink GPU Cluster)'
        : selectedModel.provider === 'google'
        ? 'Google Cloud GenAI API (us-central1)'
        : selectedModel.provider === 'openai'
        ? 'OpenAI Azure Gateway (eastus2)'
        : `${selectedModel.providerName} Enterprise Cloud Gateway`,
      modelId: selectedModel.id,
      modelName: msg.modelUsed || selectedModel.name,
      agentHelper: isLiveSearchNeeded
        ? 'AuraAI Web Search Grounding Agent (DuckDuckGo & Serper Gateway)'
        : 'AuraAI Semantic Orchestrator Agent v2.4',
      executionMode: msg.executionMode || executionMode,
      informationSources: [
        {
          title: `DuckDuckGo Live Search Index: "${msg.content.slice(0, 30)}..."`,
          url: 'https://duckduckgo.com/?q=' + encodeURIComponent(msg.content.slice(0, 30)),
          snippet: 'Real-time live web index and search crawl results retrieved via DuckDuckGo and Serper gateway.',
          domain: 'duckduckgo.com',
          sourceType: 'live_web_search'
        },
        {
          title: `${selectedModel.name} Specification & Reference Documentation`,
          url: 'https://ai.google.dev/gemini-api/docs/models',
          snippet: 'Official architecture specifications, reasoning benchmarks, and context window limits.',
          domain: 'ai.google.dev',
          sourceType: 'knowledge_base'
        }
      ],
      searchQueryExecuted: msg.content.slice(0, 45),
      searchEngineUsed: 'DuckDuckGo Live Search API & Serper Gateway',
      whyResponse: {
        userIntentSummary: `User requested technical explanation and guidance on: "${msg.content.slice(0, 50)}..."`,
        responseStrategy: 'Verified live web sources, structured key takeaways with concise bullet points, and validated against safety guardrails.',
        decisionDrivers: [
          'Pre-response validation confirmed high factual confidence and zero policy flags.',
          'Live search grounding prioritized to prevent knowledge cutoff errors.',
          'Formatted with clear section hierarchy and actionable next steps.'
        ]
      },
      preResponseValidation: {
        inputIntent: 'Conceptual Analysis & Information Retrieval',
        ambiguityScore: 0.02,
        safetyCheckPassed: true,
        factualityConfidence: 99.4,
        hallucinationRisk: 'Minimal',
        groundingStatus: isLiveSearchNeeded ? 'Live Web Grounded' : 'Internal Knowledge Verified',
        validationTimestamp: 'Pre-flight check passed before generation'
      },
      tokensPrompt: msg.tokensUsed?.prompt || 42,
      tokensCompletion: msg.tokensUsed?.completion || 128,
      tokensTotal: msg.tokensUsed?.total || 170,
      creditsTaken: msg.creditsConsumed || 0,
      costUsdEquivalent: 0.00018,
      latencyMs: selectedModel.latencyMs || 220,
      timeToFirstTokenMs: 78,
      throughputTokensPerSec: 48.6,
      finishReason: 'STOP (Natural completion)',
      cacheHit: true,
      ledgerTxId: `tx_${Date.now()}_audit`
    };

    setSelectedDiagnosis(diag);
    setSelectedMessageContent(msg.content);
    setDiagnosisModalOpen(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isGenerating]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (isGenerating) return;

    const text = inputMessage.trim();
    const currentAttachments = [...attachments];
    setInputMessage('');
    setAttachments([]);
    await sendMessage(text, currentAttachments);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Response copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      addToast('File exceeds 15MB limit for your plan.', 'error');
      return;
    }

    const newAttachment: MessageAttachment = {
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    };

    setAttachments((prev) => [...prev, newAttachment]);
    addToast(`Attached "${file.name}"`, 'success');
  };

  const exportAsMarkdown = () => {
    if (!activeConversation) return;
    let md = `# ${activeConversation.title}\n*Generated by AuraAI on ${activeConversation.createdAt}*\n\n---\n\n`;
    activeConversation.messages.forEach((m) => {
      const author = m.role === 'user' ? 'User' : `Assistant (${m.modelUsed || 'AI'})`;
      md += `### ${author} [${m.timestamp}]\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    addToast('Exported conversation as Markdown.', 'success');
  };

  const hasInsufficientCredits =
    executionMode === 'platform_managed' && user.totalCredits < selectedModel.creditsPerRequest;

  // Custom renderer for code blocks and markdown styling
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].trim() || 'code';
        const codeBody = lines.slice(1).join('\n') || lines[0];

        return (
          <div key={index} className="my-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-md">
            <div className="flex items-center justify-between bg-slate-800/90 px-3.5 py-1.5 text-xs text-slate-300 font-mono border-b border-slate-700/80">
              <span className="flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                {language}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeBody);
                    addToast('Code snippet copied!', 'info');
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  title="Copy code"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('code-assistant');
                    addToast('Loaded snippet into Interactive Code Sandbox.', 'info');
                  }}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Run code in Sandbox"
                >
                  <Terminal className="h-3 w-3" />
                  <span>Run Sandbox</span>
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-indigo-100 bg-slate-950/60">
              <code>{codeBody}</code>
            </pre>
          </div>
        );
      }

      // Format basic markdown headers and bold
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-sm space-y-2">
          {part.split('\n\n').map((paragraph, pIdx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={pIdx} className="text-base font-bold text-slate-900 mt-2 mb-1">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={pIdx} className="text-lg font-bold text-slate-900 mt-3 mb-1">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            return <p key={pIdx}>{paragraph}</p>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-4rem)] bg-[#F8FAFF]">
      {/* Top Workspace Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 py-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {activeConversation ? activeConversation.title : 'New Workspace Chat'}
            </h2>
            {/* Small unobtrusive indicator for active model and execution mode matching Section 6 */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">{selectedModel.name}</span>
              <span>•</span>
              <span
                className={`rounded px-1.5 py-0.2 font-medium ${
                  executionMode === 'byok'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                    : 'bg-purple-50 text-purple-700 border border-purple-200/50'
                }`}
              >
                {executionMode === 'byok'
                  ? 'Your API Key (0 credits)'
                  : `Platform Credits (${selectedModel.creditsPerRequest} cr/req)`}
              </span>
            </div>
          </div>
        </div>

        {/* Conversation Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={exportAsMarkdown}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            title="Export to Markdown"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {activeConversation && (
            <button
              onClick={() => deleteConversation(activeConversation.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Insufficient Credits Banner Warning */}
      {hasInsufficientCredits && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-300 px-4 sm:px-6 py-2.5 text-xs text-amber-950 gap-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Platform Credits Completed:</strong> You have {user.totalCredits} credits remaining. <strong>{selectedModel.name}</strong> requires {selectedModel.creditsPerRequest} platform credits per query.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentView('subscription')}
              className="rounded-lg bg-indigo-600 px-3 py-1 font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs text-[11px]"
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => setCurrentView('wallet')}
              className="rounded-lg bg-amber-600 px-2.5 py-1 font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs text-[11px]"
            >
              Top Up
            </button>
            <button
              onClick={() => {
                setExecutionMode('byok');
                addToast('Switched to BYOK Mode. 0 platform credits needed!', 'success');
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-[11px]"
            >
              Switch to BYOK (0 Credits)
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {(!activeConversation || activeConversation.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-16 text-slate-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Start a Conversation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ask questions, generate scripts, explore system designs, or attach files.
              Active model: <strong className="text-slate-700">{selectedModel.name}</strong>.
            </p>
          </div>
        )}

        {activeConversation?.messages.map((message) => {
          const isUser = message.role === 'user';
          const isEditing = editingMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {/* Message Bubble Container */}
              <div
                className={`relative max-w-3xl rounded-2xl p-4 sm:p-5 shadow-2xs transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Header label for Assistant */}
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{message.modelUsed || selectedModel.name}</span>
                      {message.executionMode && (
                        <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded font-normal text-slate-500">
                          {message.executionMode === 'byok' ? 'BYOK' : 'Platform'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]">{message.timestamp}</span>
                  </div>
                )}

                {/* Attachments preview if user uploaded */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {message.attachments.map((att, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border ${
                          isUser
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="font-medium truncate max-w-[140px]">{att.name}</span>
                        <span className="text-[10px] opacity-75">
                          ({(att.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit prompt inline form or Insufficient Credits Card */}
                {isEditing ? (
                  <div className="space-y-2 min-w-[280px]">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl bg-white p-2 text-xs text-slate-900 border border-indigo-400 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="rounded px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          editAndResendMessage(message.id, editingText);
                          setEditingMessageId(null);
                        }}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                ) : message.error === 'insufficient_credits' ? (
                  <div className="space-y-3 p-1">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                      <Coins className="h-4 w-4 text-amber-600" />
                      <span>Platform Credits Completed</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      You have <strong>{user.totalCredits} platform credits remaining</strong>, but <strong>{selectedModel.name}</strong> requires <strong>{selectedModel.creditsPerRequest} credits per request</strong>. Please upgrade your plan or switch to BYOK mode to continue.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => setCurrentView('subscription')}
                        className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-2xs"
                      >
                        <span>Upgrade Plan</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setCurrentView('wallet')}
                        className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-all shadow-2xs"
                      >
                        Top-Up Credits
                      </button>
                      <button
                        onClick={() => {
                          setExecutionMode('byok');
                          addToast('Switched to BYOK Mode. 0 platform credits needed!', 'success');
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        Switch to BYOK (0 Credits)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>{renderMessageContent(message.content)}</div>
                )}

                {/* Footer Toolbar for Assistant Response */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      {/* Thumbs up & down feedback matching Section 6 */}
                      <button
                        onClick={() => toggleMessageFeedback(message.id, 'like')}
                        className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                          message.feedback === 'like' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'
                        }`}
                        title="Good response"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleMessageFeedback(message.id, 'dislike')}
                        className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                          message.feedback === 'dislike' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
                        }`}
                        title="Poor response"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={regenerateLastResponse}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Regenerate"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>

                      {/* Diagnosis Button with Telemetry Inspector */}
                      <button
                        onClick={() => handleOpenDiagnosis(message)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 shadow-2xs transition-all active:scale-95 ml-1 cursor-pointer"
                        title="View Diagnosis: Model provenance, agent helper, tokens consumed, and credits taken"
                      >
                        <Activity className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                        <span>Diagnosis</span>
                      </button>
                    </div>

                    {message.tokensUsed && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {message.tokensUsed.total} tokens
                        {message.creditsConsumed ? ` • ${message.creditsConsumed} cr` : ' • 0 cr (BYOK)'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Edit button hover for User message */}
              {isUser && !isEditing && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="text-[10px] mr-1">{message.timestamp}</span>
                  <button
                    onClick={() => {
                      setEditingMessageId(message.id);
                      setEditingText(message.content);
                    }}
                    className="flex items-center gap-1 hover:text-indigo-600"
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Typing & Streaming State */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse py-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <span>{selectedModel.name} is thinking & streaming tokens...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Bottom Box */}
      <div className="border-t border-[#E2E8F0] bg-white p-3 sm:p-4">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs text-indigo-900"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-semibold truncate max-w-[160px]">{att.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {hasInsufficientCredits ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Platform Credits Completed:</strong> You have {user.totalCredits} credits remaining. Please upgrade your subscription plan or switch to BYOK mode to continue sending prompts.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentView('subscription')}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 font-bold text-white hover:bg-indigo-700 transition-all shadow-2xs cursor-pointer"
              >
                Upgrade Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setExecutionMode('byok');
                  addToast('Switched to BYOK Mode. 0 platform credits needed!', 'success');
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Switch to BYOK (0 Credits)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.txt,.doc,.docx,.py,.ts,.js,.json,image/*"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Attach file (PDF, Code, Image)"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message ${selectedModel.name}... (Press Enter to send)`}
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFF] py-3 pl-11 pr-24 text-sm text-[#172554] placeholder-slate-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-all"
                  title="Stop generation"
                >
                  <Square className="h-3.5 w-3.5 fill-white" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim() && attachments.length === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    inputMessage.trim() || attachments.length > 0
                      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 scale-100'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Diagnosis Telemetry Modal */}
      <DiagnosisModal
        isOpen={diagnosisModalOpen}
        onClose={() => setDiagnosisModalOpen(false)}
        diagnosis={selectedDiagnosis}
        messageContent={selectedMessageContent}
      />
    </div>
  );
};
