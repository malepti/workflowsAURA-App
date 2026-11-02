import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Plus,
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  FileCode,
  Tag,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Info,
  Award,
  Zap,
  SplitSquareVertical,
  Check,
  AlertCircle,
  Wand2,
  BookOpen,
  MessageSquare,
  Code2,
  Target,
  Lightbulb,
  Compass,
  Loader2,
  Copy,
  Send,
  Download,
  Crown,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PromptProject,
  PromptVersion,
  PromptTestCase,
  PromptTestResult
} from '../../types';
import { getApiBase } from '../../lib/apiConfig';

const API_BASE = getApiBase();

export const PromptStudioView: React.FC = () => {
  const { addToast, startNewChat, setCurrentView, models, selectedModel } = useApp();

  // Project & Version State
  const [projects, setProjects] = useState<PromptProject[]>([]);
  const [activeProject, setActiveProject] = useState<PromptProject | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [testCases, setTestCases] = useState<PromptTestCase[]>([]);
  const [selectedVersionAId, setSelectedVersionAId] = useState<string>('');
  const [selectedVersionBId, setSelectedVersionBId] = useState<string>('');
  const [evalModelOverride, setEvalModelOverride] = useState<string>('auto');

  // Active Tab: 'matrix' | 'editor' | 'test-cases' | 'diff' | 'magic-enhancer'
  const [activeTab, setActiveTab] = useState<'matrix' | 'editor' | 'test-cases' | 'diff' | 'magic-enhancer'>('matrix');

  // Magic Prompt Enhancer State
  const [magicRawPrompt, setMagicRawPrompt] = useState<string>(
    'Write a dramatic story on a king who rules his kingdom when suddenly an overwhelming crisis strikes across his kingdom, testing his courage and devotion to his people.'
  );
  const [magicDomain, setMagicDomain] = useState<'storytelling' | 'customer_support' | 'code' | 'marketing' | 'general'>('storytelling');
  const [magicTone, setMagicTone] = useState<'creative' | 'professional' | 'authoritative' | 'empathetic' | 'concise'>('creative');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedResult, setEnhancedResult] = useState<any | null>(null);
  const [resultSubTab, setResultSubTab] = useState<'output' | 'prompt'>('output');
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const handleEnhancePrompt = async (promptOverride?: string, domainOverride?: any) => {
    const rawToUse = (promptOverride || magicRawPrompt).trim();
    if (!rawToUse) {
      addToast('Please enter an idea or premise to polish!', 'warning');
      return;
    }
    const dom = domainOverride || magicDomain;
    setIsEnhancing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_prompt: rawToUse,
          domain: dom,
          tone: magicTone
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEnhancedResult(data);
      setResultSubTab('output');
      addToast('✨ Story & Master Prompt generated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to generate: ${err.message}`, 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownloadStory = () => {
    if (!enhancedResult) return;
    const content = `${enhancedResult.title || 'Story'}\n\n${enhancedResult.generated_output || enhancedResult.master_prompt}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(enhancedResult.title || 'story').toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Story downloaded to your device!', 'info');
  };

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResults, setEvalResults] = useState<PromptTestResult[]>([]);
  const [summaryStats, setSummaryStats] = useState<{
    avgLatency: number;
    totalCost: number;
    totalEvals: number;
  } | null>(null);

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false);
  const [showAddTestCaseModal, setShowAddTestCaseModal] = useState<boolean>(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectSysPrompt, setNewProjectSysPrompt] = useState('You are an expert AI assistant. Provide concise and accurate answers.');
  const [newProjectTemplate, setNewProjectTemplate] = useState('User input: {{input_text}}');

  // New Version Form
  const [newVersionTag, setNewVersionTag] = useState('');
  const [newVersionSysPrompt, setNewVersionSysPrompt] = useState('');
  const [newVersionTemplate, setNewVersionTemplate] = useState('');
  const [newVersionModel, setNewVersionModel] = useState('llama-3-3-70b');
  const [newVersionChangelog, setNewVersionChangelog] = useState('');

  // Editable Prompt Version State
  const [editableSystemPrompt, setEditableSystemPrompt] = useState<string>('');
  const [editableUserTemplate, setEditableUserTemplate] = useState<string>('');
  const [editableModelId, setEditableModelId] = useState<string>('llama-3-3-70b');
  const [editableTemperature, setEditableTemperature] = useState<number>(0.7);
  const [editableChangeLog, setEditableChangeLog] = useState<string>('');
  const [isSavingVersion, setIsSavingVersion] = useState<boolean>(false);

  // AI Prompt Optimizer / Fine-Tuner State
  const [showFineTuneModal, setShowFineTuneModal] = useState<boolean>(false);
  const [fineTuneGoal, setFineTuneGoal] = useState<string>('strict_json');
  const [fineTuneCustomInstruction, setFineTuneCustomInstruction] = useState<string>('');
  const [fineTuneTargetModel, setFineTuneTargetModel] = useState<string>('gemini-2.5-flash');
  const [fineTuneAutoSave, setFineTuneAutoSave] = useState<boolean>(false);
  const [isFineTuning, setIsFineTuning] = useState<boolean>(false);
  const [fineTuneResult, setFineTuneResult] = useState<any | null>(null);

  // New Test Case Form
  const [newTestCaseName, setNewTestCaseName] = useState('');
  const [newTestCaseVars, setNewTestCaseVars] = useState<Record<string, string>>({});
  const [newTestCaseAssertionType, setNewTestCaseAssertionType] = useState<'contains' | 'json_valid' | 'not_contains'>('contains');
  const [newTestCaseAssertionVal, setNewTestCaseAssertionVal] = useState('');

  // Fetch Projects on Mount
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          loadProjectDetails(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load prompt projects:', err);
      addToast('Could not load prompt projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Load Single Project Details
  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveProject({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          activeProductionVersionId: data.activeProductionVersionId,
          versionsCount: data.versions.length,
          testCasesCount: data.testCases.length
        });
        setVersions(data.versions);
        setTestCases(data.testCases);

        // Pre-select Version A (Production) and Version B (Candidate / Staging)
        if (data.versions.length > 0) {
          const prodV = data.versions.find((v: PromptVersion) => v.id === data.activeProductionVersionId) || data.versions[0];
          const candidateV = data.versions.find((v: PromptVersion) => v.id !== prodV.id) || prodV;
          setSelectedVersionAId(prodV.id);
          setSelectedVersionBId(candidateV.id);
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  // Run Matrix Evaluation
  const handleRunEvaluation = async () => {
    if (!activeProject) return;
    setIsEvaluating(true);
    try {
      const payload: any = {
        version_ids: [selectedVersionAId, selectedVersionBId].filter(Boolean),
        test_case_ids: testCases.map((tc) => tc.id)
      };

      if (evalModelOverride && evalModelOverride !== 'auto') {
        payload.model_id_override = evalModelOverride;
      }

      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${activeProject.id}/run-eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const evalData = await res.json();
        setEvalResults(evalData.results);
        setSummaryStats({
          avgLatency: evalData.avgLatencyMs,
          totalCost: evalData.totalCostUsd,
          totalEvals: evalData.totalEvaluations
        });
        addToast(`Completed ${evalData.totalEvaluations} matrix evaluations successfully!`, 'success');
      } else {
        addToast('Evaluation run failed', 'error');
      }
    } catch (err) {
      console.error('Eval error:', err);
      addToast('Failed to execute evaluation matrix', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Promote Version to Production
  const handlePromoteVersion = async (versionId: string) => {
    if (!activeProject) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${activeProject.id}/versions/${versionId}/promote`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message || 'Promoted to Production!', 'success');
        loadProjectDetails(activeProject.id);
      }
    } catch (err) {
      addToast('Failed to promote version', 'error');
    }
  };

  // Create Project Submit
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          system_prompt: newProjectSysPrompt,
          user_template: newProjectTemplate,
          model_id: 'llama-3-3-70b',
          version_tag: 'v1.0.0'
        })
      });
      if (res.ok) {
        const data = await res.json();
        addToast('Created new prompt project!', 'success');
        setShowNewProjectModal(false);
        fetchProjects();
      }
    } catch (err) {
      addToast('Error creating project', 'error');
    }
  };

  // Create Version Submit
  const handleCreateVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newVersionTag.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${activeProject.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_tag: newVersionTag,
          system_prompt: newVersionSysPrompt,
          user_template: newVersionTemplate,
          model_id: newVersionModel,
          change_log: newVersionChangelog,
          status: 'draft'
        })
      });
      if (res.ok) {
        addToast(`Committed version ${newVersionTag}!`, 'success');
        setShowNewVersionModal(false);
        loadProjectDetails(activeProject.id);
      }
    } catch (err) {
      addToast('Failed to create version', 'error');
    }
  };

  // Add Test Case Submit
  const handleAddTestCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newTestCaseName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${activeProject.id}/test-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTestCaseName,
          input_variables: newTestCaseVars,
          assertion_type: newTestCaseAssertionType,
          assertion_value: newTestCaseAssertionVal,
          tags: ['custom_test']
        })
      });
      if (res.ok) {
        addToast('Test case added!', 'success');
        setShowAddTestCaseModal(false);
        setNewTestCaseName('');
        setNewTestCaseVars({});
        loadProjectDetails(activeProject.id);
      }
    } catch (err) {
      addToast('Failed to add test case', 'error');
    }
  };

  const versionA = versions.find((v) => v.id === selectedVersionAId);
  const versionB = versions.find((v) => v.id === selectedVersionBId);

  // Synchronize active version into editable fields
  useEffect(() => {
    if (versionA) {
      setEditableSystemPrompt(versionA.systemPrompt || '');
      setEditableUserTemplate(versionA.userTemplate || '');
      setEditableModelId(versionA.modelId || 'llama-3-3-70b');
      setEditableTemperature(versionA.temperature ?? 0.7);
      setEditableChangeLog(versionA.changeLog || '');
    }
  }, [versionA?.id]);

  // Extract variables dynamically from editable user template or schema
  const detectedVariables = Array.from(
    new Set([
      ...(editableUserTemplate.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []).map((m) =>
        m.replace(/\{\{\s*|\s*\}\}/g, '')
      ),
      ...(versionA?.variablesSchema || [])
    ])
  );

  // Update current version endpoint handler
  const handleUpdateCurrentVersion = async () => {
    if (!activeProject || !versionA) return;
    setIsSavingVersion(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${activeProject.id}/versions/${versionA.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: editableSystemPrompt,
          user_template: editableUserTemplate,
          model_id: editableModelId,
          temperature: editableTemperature,
          change_log: editableChangeLog || 'Updated prompt parameters in Prompt Studio.'
        })
      });
      if (res.ok) {
        addToast(`✅ Version ${versionA.versionTag} updated successfully!`, 'success');
        await loadProjectDetails(activeProject.id);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      addToast(`Failed to update version: ${err.message}`, 'error');
    } finally {
      setIsSavingVersion(false);
    }
  };

  // Run AI Fine-Tuning & Prompt Optimization
  const handleRunFineTune = async () => {
    if (!activeProject || !versionA) return;
    setIsFineTuning(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/prompts/projects/${activeProject.id}/versions/${versionA.id}/finetune`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: editableSystemPrompt,
          user_template: editableUserTemplate,
          optimization_goal: fineTuneGoal,
          custom_instruction: fineTuneCustomInstruction,
          target_model: fineTuneTargetModel,
          auto_save_new_version: fineTuneAutoSave,
          new_version_tag: fineTuneAutoSave ? `v1.${versions.length}.0-tuned` : undefined
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFineTuneResult(data);
      addToast(`✨ Prompt fine-tuned for ${data.goalLabel}!`, 'success');
      if (data.newVersion) {
        addToast(`🌿 Committed new version: ${data.newVersion.versionTag}!`, 'info');
        await loadProjectDetails(activeProject.id);
        setSelectedVersionAId(data.newVersion.id);
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to fine-tune prompt: ${err.message}`, 'error');
    } finally {
      setIsFineTuning(false);
    }
  };

  // Apply Fine-Tuned Prompt directly into current editor fields
  const handleApplyFineTune = () => {
    if (!fineTuneResult) return;
    setEditableSystemPrompt(fineTuneResult.optimizedSystemPrompt);
    if (fineTuneResult.optimizedUserTemplate) {
      setEditableUserTemplate(fineTuneResult.optimizedUserTemplate);
    }
    setEditableChangeLog(fineTuneResult.suggestedChangelog || `Fine-tuned for ${fineTuneResult.goalLabel}`);
    setShowFineTuneModal(false);
    addToast('Applied optimized prompt & directives to editor!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Prompt Testing Studio</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                Evals & CI/CD
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Benchmark prompt versions side-by-side, test edge cases, and eliminate regressions before production.
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Project:</label>
            <select
              value={activeProject?.id || ''}
              onChange={(e) => loadProjectDetails(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              title="Create New Prompt Project"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Model Selector for Testing (All models from Explore Models) */}
          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 shadow-2xs">
            <Cpu className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Testing Model</span>
              <select
                value={evalModelOverride}
                onChange={(e) => setEvalModelOverride(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-950 focus:outline-none cursor-pointer max-w-[210px] truncate"
              >
                <option value="auto">⚡ Version Defaults (Active Version Model)</option>
                <optgroup label="🟢 Live Models (Verified Active Execution)">
                  {models.filter((m) => m.isLive).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.isLocal ? 'Local Ollama • 0-Cost' : 'Google Gemini API • Live'})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Run Matrix Button */}
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating || !activeProject}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running Matrix Evals...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Run Matrix Evaluation</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Sub-Navigation & Version Comparer Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-2.5 flex items-center justify-between shrink-0">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Side-by-Side Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Template Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('test-cases')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'test-cases'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Test Suite ({testCases.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('magic-enhancer');
              if (!enhancedResult) {
                handleEnhancePrompt();
              }
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'magic-enhancer'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                : 'text-indigo-600 hover:bg-indigo-50 font-bold'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${activeTab === 'magic-enhancer' ? 'text-amber-300 fill-amber-300' : 'text-indigo-600'}`} />
            <span>✨ Magic Prompt Enhancer</span>
          </button>
        </div>

        {/* Version Pickers for A/B Compare */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Baseline (A):</span>
            <select
              value={selectedVersionAId}
              onChange={(e) => setSelectedVersionAId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag} {v.status === 'production' ? '★ [PROD]' : `(${v.status})`}
                </option>
              ))}
            </select>
          </div>

          <span className="font-extrabold text-slate-400">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Candidate (B):</span>
            <select
              value={selectedVersionBId}
              onChange={(e) => setSelectedVersionBId(e.target.value)}
              className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1 text-xs font-bold text-indigo-900 shadow-2xs"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag} {v.status === 'production' ? '★ [PROD]' : `(${v.status})`}
                </option>
              ))}
            </select>
          </div>

          {/* Promote Candidate Button if Candidate is not already production */}
          {versionB && versionB.status !== 'production' && (
            <button
              onClick={() => handlePromoteVersion(versionB.id)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
              title="Deploy Candidate version as the active production prompt"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Promote {versionB.versionTag} to Prod</span>
            </button>
          )}

          <button
            onClick={() => {
              if (versionA) {
                setNewVersionSysPrompt(versionA.systemPrompt);
                setNewVersionTemplate(versionA.userTemplate);
                setNewVersionModel(versionA.modelId);
                const nextTag = `v${parseInt(versionA.versionTag.replace(/[^0-9]/g, '') || '1') + 1}.0.0`;
                setNewVersionTag(nextTag);
              }
              setShowNewVersionModal(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
            <span>Branch Version</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: SIDE-BY-SIDE PLAYGROUND */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* Executive Summary Benchmark Card if evaluated */}
            {summaryStats && (
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Latest Matrix Benchmark Summary</h3>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    {evalResults.filter((r) => r.passed).length}/{evalResults.length} Tests Passed
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-2xs">
                    <span className="text-slate-400 font-medium">Average Latency</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{summaryStats.avgLatency} ms</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-2xs">
                    <span className="text-slate-400 font-medium">Estimated 1M Token Cost</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">${(summaryStats.totalCost * 1000).toFixed(4)}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-2xs">
                    <span className="text-slate-400 font-medium">Evaluations Run</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{summaryStats.totalEvals} cells</p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Case Comparison Rows */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Test Case Results & Comparative Outputs ({testCases.length} Scenarios)
                </h3>
                <span className="text-xs text-slate-400">
                  Click 'Run Matrix Evaluation' to re-test both versions concurrently
                </span>
              </div>

              {testCases.map((tc) => {
                const resA = evalResults.find((r) => r.testCaseId === tc.id && r.versionId === selectedVersionAId);
                const resB = evalResults.find((r) => r.testCaseId === tc.id && r.versionId === selectedVersionBId);

                return (
                  <div
                    key={tc.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Test Case Header */}
                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                          TC
                        </span>
                        <span className="text-xs font-bold text-slate-900">{tc.name}</span>
                        {tc.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="font-medium">Assertion:</span>
                        <code className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-800">
                          {tc.assertionType}: {tc.assertionValue || 'JSON'}
                        </code>
                      </div>
                    </div>

                    {/* Input Variables Preview */}
                    <div className="bg-slate-50/30 px-4 py-2 border-b border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 mr-2">Input Variables:</span>
                      <div className="inline-flex flex-wrap gap-1.5">
                        {Object.entries(tc.inputVariables || {}).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 rounded bg-indigo-50/70 px-2 py-0.5 text-[11px] text-indigo-800 border border-indigo-100"
                          >
                            <span className="font-semibold text-indigo-600">{k}:</span>
                            <span className="truncate max-w-[200px]">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Side-by-Side Dual Column View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                      {/* Column A: Baseline */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              Version A ({versionA?.versionTag || 'Baseline'})
                            </span>
                            {versionA?.status === 'production' && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                PROD
                              </span>
                            )}
                            {resA && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1 border ${
                                  resA.executionMode === 'live_gemini'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : resA.executionMode === 'live_ollama'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Cpu className="h-3 w-3 text-indigo-500" />
                                <span>{models.find((m) => m.id === resA.modelId)?.name || resA.modelId}</span>
                                {resA.executionMode === 'live_gemini' && (
                                  <span className="font-bold text-[9px] text-blue-700 bg-blue-100 px-1 rounded">LIVE API</span>
                                )}
                                {resA.executionMode === 'live_ollama' && (
                                  <span className="font-bold text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded">LOCAL OLLAMA</span>
                                )}
                                {resA.executionMode === 'simulated' && (
                                  <span className="text-[9px] text-slate-400 italic bg-white/70 px-1 rounded">Simulated</span>
                                )}
                              </span>
                            )}
                          </div>
                          {resA && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="flex items-center gap-1 font-semibold text-slate-600">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {resA.latencyMs}ms
                              </span>
                              <span
                                className={`flex items-center gap-1 font-bold ${
                                  resA.passed ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {resA.passed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                {resA.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          )}
                        </div>

                        {resA ? (
                          <div className="rounded-xl bg-slate-900 p-3 text-xs font-mono text-slate-100 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                            {resA.actualOutput}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                            No evaluation data yet. Click "Run Matrix Evaluation" above.
                          </div>
                        )}
                      </div>

                      {/* Column B: Candidate */}
                      <div className="p-4 space-y-2 bg-indigo-50/15">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-indigo-950">
                              Version B ({versionB?.versionTag || 'Candidate'})
                            </span>
                            {versionB?.status === 'production' ? (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                PROD
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                                CANDIDATE
                              </span>
                            )}
                            {resB && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1 border ${
                                  resB.executionMode === 'live_gemini'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : resB.executionMode === 'live_ollama'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-indigo-100/70 text-indigo-900 border-indigo-200'
                                }`}
                              >
                                <Cpu className="h-3 w-3 text-indigo-600" />
                                <span>{models.find((m) => m.id === resB.modelId)?.name || resB.modelId}</span>
                                {resB.executionMode === 'live_gemini' && (
                                  <span className="font-bold text-[9px] text-blue-700 bg-blue-100 px-1 rounded">LIVE API</span>
                                )}
                                {resB.executionMode === 'live_ollama' && (
                                  <span className="font-bold text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded">LOCAL OLLAMA</span>
                                )}
                                {resB.executionMode === 'simulated' && (
                                  <span className="text-[9px] text-slate-400 italic bg-white/70 px-1 rounded">Simulated</span>
                                )}
                              </span>
                            )}
                          </div>
                          {resB && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="flex items-center gap-1 font-semibold text-slate-600">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {resB.latencyMs}ms
                              </span>
                              <span
                                className={`flex items-center gap-1 font-bold ${
                                  resB.passed ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {resB.passed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                {resB.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          )}
                        </div>

                        {resB ? (
                          <div className="rounded-xl bg-slate-900 p-3 text-xs font-mono text-slate-100 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                            {resB.actualOutput}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                            No evaluation data yet. Click "Run Matrix Evaluation" above.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PROMPT & TEMPLATE EDITOR */}
        {activeTab === 'editor' && versionA && (
          <div className="space-y-5">
            {/* Action Bar for Version Updates & Optimization */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Version:</span>
                  <select
                    value={selectedVersionAId}
                    onChange={(e) => setSelectedVersionAId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.versionTag} {v.status === 'production' ? '★ (PROD)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    versionA.status === 'production'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : versionA.status === 'staging'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {versionA.status.toUpperCase()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* AI Fine-Tuner & Optimizer Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setFineTuneGoal('strict_json');
                    setFineTuneCustomInstruction('');
                    setFineTuneResult(null);
                    setShowFineTuneModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-purple-700 hover:to-indigo-800 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                  <span>AI Fine-Tune & Optimize</span>
                </button>

                {/* Save Changes / Update Version */}
                <button
                  type="button"
                  disabled={isSavingVersion}
                  onClick={handleUpdateCurrentVersion}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingVersion ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Save Version Updates</span>
                </button>

                {/* Branch New Version Modal */}
                <button
                  type="button"
                  onClick={() => {
                    setNewVersionTag(`v1.${versions.length}.0`);
                    setNewVersionSysPrompt(editableSystemPrompt);
                    setNewVersionTemplate(editableUserTemplate);
                    setNewVersionModel(editableModelId);
                    setNewVersionChangelog('');
                    setShowNewVersionModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                >
                  <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Branch New Version</span>
                </button>

                {/* Promote to Production */}
                {versionA.status !== 'production' && (
                  <button
                    type="button"
                    onClick={() => handlePromoteVersion(versionA.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                  >
                    <Crown className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Promote to Prod</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* System Prompt Editor */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        System Prompt ({versionA.versionTag})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>~{Math.ceil(editableSystemPrompt.length / 4)} tokens</span>
                      <span>•</span>
                      <span>{editableSystemPrompt.length} chars</span>
                    </div>
                  </div>
                  <textarea
                    value={editableSystemPrompt}
                    onChange={(e) => setEditableSystemPrompt(e.target.value)}
                    rows={9}
                    placeholder="Define persona, instructions, negative constraints, and output format..."
                    className="w-full rounded-xl bg-slate-900 p-3.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-800 leading-relaxed resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>💡 Tip: Click <strong>"AI Fine-Tune & Optimize"</strong> above to auto-enforce JSON schemas, guardrails, or low latency.</span>
                  </div>
                </div>

                {/* User Template with Variables */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        User Prompt Template with Dynamic Variables
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400">Detected:</span>
                      {detectedVariables.length > 0 ? (
                        detectedVariables.map((v) => (
                          <span
                            key={v}
                            className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 font-mono"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No &#123;&#123;variables&#125;&#125; yet</span>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={editableUserTemplate}
                    onChange={(e) => setEditableUserTemplate(e.target.value)}
                    rows={4}
                    placeholder="Enter user prompt template using {{variable_name}} slots..."
                    className="w-full rounded-xl bg-slate-900 p-3.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-800 leading-relaxed resize-y"
                  />
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Quick Insert:</span>
                    {['user_input', 'customer_query', 'context', 'code_snippet', 'tier'].map((sampleVar) => (
                      <button
                        key={sampleVar}
                        type="button"
                        onClick={() => setEditableUserTemplate((prev) => `${prev} {{${sampleVar}}}`)}
                        className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 transition-colors cursor-pointer"
                      >
                        + &#123;&#123;{sampleVar}&#125;&#125;
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Version Properties & History Sidebar */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Model Configuration</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 font-medium">Target LLM Model</label>
                        {(() => {
                          const currentM = models.find((m) => m.id === editableModelId);
                          return (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                              {currentM?.isLocal ? '🖥️ Local GPU' : '☁️ Cloud'}
                            </span>
                          );
                        })()}
                      </div>
                      <select
                        value={editableModelId}
                        onChange={(e) => setEditableModelId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <optgroup label="🟢 Live Models (Verified Active Execution)">
                          {models.filter((m) => m.isLive).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.isLocal ? 'Local Ollama Cluster • 0-Cost' : 'Google Gemini Cloud API • Live'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      {(() => {
                        const currentM = models.find((m) => m.id === editableModelId);
                        if (!currentM) return null;
                        return (
                          <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-600 flex items-center justify-between">
                            <span className="truncate pr-2">{currentM.description}</span>
                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                              {currentM.isLocal ? '0 credits' : `${currentM.creditsPerRequest} cr/req`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 font-medium">Temperature</label>
                        <span className="font-bold text-slate-800">{editableTemperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.5"
                        step="0.05"
                        value={editableTemperature}
                        onChange={(e) => setEditableTemperature(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Deterministic (0.0)</span>
                        <span>Creative (1.0+)</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block font-medium mb-1">Commit Changelog</label>
                      <input
                        type="text"
                        value={editableChangeLog}
                        onChange={(e) => setEditableChangeLog(e.target.value)}
                        placeholder="e.g. Injected JSON directives..."
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Version History List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Version History ({versions.length})
                    </h3>
                    <span className="text-[10px] text-slate-400">Click to switch</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVersionAId(v.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedVersionAId === v.id
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold shadow-2xs'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-indigo-500" />
                            {v.versionTag}
                          </span>
                          {v.status === 'production' ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                              PROD
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 uppercase font-medium">
                              {v.status}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block truncate mt-0.5">
                          {v.changeLog || 'Iterative commit'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TEST CASES MANAGEMENT */}
        {activeTab === 'test-cases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Evaluation Test Suite</h3>
                <p className="text-xs text-slate-500">
                  Manage the dataset cases that benchmark all prompt versions.
                </p>
              </div>
              <button
                onClick={() => {
                  // Pre-populate keys from active version template
                  const initialVars: Record<string, string> = {};
                  detectedVariables.forEach((v) => (initialVars[v] = ''));
                  setNewTestCaseVars(initialVars);
                  setShowAddTestCaseModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-2xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Test Case</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Scenario Name</th>
                    <th className="px-4 py-3">Input Parameters</th>
                    <th className="px-4 py-3">Assertion Rule</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">{tc.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {Object.entries(tc.inputVariables || {}).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 truncate"
                            >
                              <strong>{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-purple-50 text-purple-700 px-2 py-0.5 text-[11px] font-semibold border border-purple-200/50">
                          {tc.assertionType} {tc.assertionValue ? `("${tc.assertionValue}")` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {tc.tags?.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            await fetch(`${API_BASE}/api/v1/prompts/test-cases/${tc.id}`, { method: 'DELETE' });
                            addToast('Test case deleted', 'info');
                            if (activeProject) loadProjectDetails(activeProject.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MAGIC STORY & PROMPT CREATOR */}
        {activeTab === 'magic-enhancer' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Friendly Header Hero Banner */}
            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      <Wand2 className="h-5 w-5 text-indigo-300 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        Magic Story & Prompt Creator
                      </h2>
                      <p className="text-xs text-indigo-200/90 leading-relaxed mt-0.5">
                        Give any rough sentence or story idea. The AI instantly crafts the polished prompt and writes the complete story or response for you.
                      </p>
                    </div>
                  </div>
                </div>

                {enhancedResult && (
                  <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-xs text-indigo-100">
                    <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
                    <span>Story Grade: <strong className="text-white text-sm font-bold">9.9/10 Master Quality</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Input & Starter Selection Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              {/* Step 1: Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Choose Category:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'storytelling', label: '📖 Story & Fiction', icon: BookOpen },
                    { id: 'customer_support', label: '💬 Customer Support', icon: MessageSquare },
                    { id: 'code', label: '💻 Code & Architecture', icon: Code2 },
                    { id: 'marketing', label: '🎯 Marketing & Sales', icon: Target },
                    { id: 'general', label: '🌐 Strategy & General', icon: Compass }
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setMagicDomain(d.id as any);
                        handleEnhancePrompt(magicRawPrompt, d.id);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        magicDomain === d.id
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <d.icon className="h-3.5 w-3.5" />
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: One-Click Ideas */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>2. Or Pick a Popular Idea to Try Instantly:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    {
                      label: '👑 King Douglas in Crisis',
                      prompt: 'Write a dramatic story on a king who rules his kingdom when suddenly an overwhelming crisis strikes across his kingdom, testing his courage and devotion to his people.',
                      domain: 'storytelling'
                    },
                    {
                      label: '🚀 Astronaut on Mars',
                      prompt: 'A story about an astronaut who hears a ticking clock beneath the dry red sands of Mars',
                      domain: 'storytelling'
                    },
                    {
                      label: '☕ Cozy Dragon Barista',
                      prompt: 'A cozy fantasy story about an ancient dragon running a hidden espresso bar in the mountains',
                      domain: 'storytelling'
                    },
                    {
                      label: '💔 Angry Client Refund',
                      prompt: 'Reply to an angry enterprise customer whose shipping was delayed by 12 days and demanding a refund',
                      domain: 'customer_support'
                    },
                    {
                      label: '⚡ Resilient Python Pipeline',
                      prompt: 'Architect a high-throughput event-driven microservices architecture using Kafka and PostgreSQL',
                      domain: 'code'
                    },
                    {
                      label: '📈 Viral SaaS Hook',
                      prompt: 'Write a high-converting landing page headline and hook for an AI automation SaaS platform',
                      domain: 'marketing'
                    }
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMagicRawPrompt(s.prompt);
                        setMagicDomain(s.domain as any);
                        handleEnhancePrompt(s.prompt, s.domain);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Raw Prompt Input Box */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    3. Your Raw Idea or Premise:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Type plain English — the AI handles the rest
                  </span>
                </div>

                <textarea
                  value={magicRawPrompt}
                  onChange={(e) => setMagicRawPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Write a story about a king whose kingdom is hit by a sudden crisis..."
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFF] p-3.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Tone:</span>
                    <div className="flex gap-1">
                      {(['creative', 'professional', 'authoritative', 'empathetic', 'concise'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMagicTone(t)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer ${
                            magicTone === t
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEnhancePrompt()}
                    disabled={isEnhancing || !magicRawPrompt.trim()}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                      isEnhancing || !magicRawPrompt.trim()
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 hover:scale-[1.01]'
                    }`}
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Writing Story & Crafting Prompt...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
                        <span>✨ Generate Story & Master Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4: Results Display */}
            {enhancedResult && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
                {/* Result Header */}
                <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        {enhancedResult.domain || 'Story'}
                      </span>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Ready to Use
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {enhancedResult.title || 'Generated Output'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {enhancedResult.quick_summary}
                    </p>
                  </div>

                  {/* Clean Tab Switcher: Story vs Prompt */}
                  <div className="flex bg-slate-200/70 p-1 rounded-xl self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setResultSubTab('output')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        resultSubTab === 'output'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>📖 The Story / Result</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultSubTab('prompt')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        resultSubTab === 'prompt'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>🌟 Master Prompt</span>
                    </button>
                  </div>
                </div>

                {/* SubTab 1: The Generated Story / Content */}
                {resultSubTab === 'output' && (
                  <div className="p-6 space-y-5">
                    {/* Toolbar for the story */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        Complete Written Content:
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(enhancedResult.generated_output || enhancedResult.master_prompt);
                            setCopiedOutput(true);
                            setTimeout(() => setCopiedOutput(false), 2000);
                            addToast('Copied story to clipboard!', 'success');
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          {copiedOutput ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                          <span>{copiedOutput ? 'Copied!' : 'Copy Story'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            startNewChat(enhancedResult.generated_output || enhancedResult.master_prompt);
                            setCurrentView('chat');
                            addToast('Opened story in AI Chat session!', 'info');
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Continue in AI Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadStory}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                          title="Download story as a .txt file"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>

                    {/* Story Reader Card */}
                    <div className="rounded-2xl bg-amber-50/20 border border-amber-100/70 p-6 sm:p-8">
                      <div className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 font-serif">
                        {(enhancedResult.generated_output || enhancedResult.master_prompt)
                          .split('\n\n')
                          .map((para: string, idx: number) => {
                            if (para.startsWith('### ')) {
                              return (
                                <h3 key={idx} className="text-lg font-bold font-sans text-slate-900 border-b border-amber-200/50 pb-1 pt-2">
                                  {para.replace('### ', '')}
                                </h3>
                              );
                            }
                            if (para.startsWith('1. ') || para.startsWith('2. ') || para.startsWith('3. ')) {
                              return (
                                <div key={idx} className="font-sans text-xs sm:text-sm text-slate-700 pl-4 py-0.5 border-l-2 border-indigo-300">
                                  {para}
                                </div>
                              );
                            }
                            if (para.startsWith('```')) {
                              return (
                                <pre key={idx} className="rounded-xl bg-slate-950 p-4 text-xs font-mono text-emerald-300 overflow-x-auto my-3">
                                  {para.replace(/```[a-z]*\n?/g, '')}
                                </pre>
                              );
                            }
                            return (
                              <p key={idx} className="text-slate-800 leading-relaxed">
                                {para}
                              </p>
                            );
                          })}
                      </div>
                    </div>

                    {/* Friendly bottom hint */}
                    <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 flex items-center justify-between text-xs text-indigo-900">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span>Curious about how this was generated? Click the <strong>"🌟 Master Prompt"</strong> tab above to view the exact prompt blueprint.</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setResultSubTab('prompt')}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0 cursor-pointer"
                      >
                        View Prompt →
                      </button>
                    </div>
                  </div>
                )}

                {/* SubTab 2: The Polished Master Prompt */}
                {resultSubTab === 'prompt' && (
                  <div className="p-6 space-y-5">
                    {/* Toolbar for the prompt */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Polished Master Prompt Blueprint:
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(enhancedResult.master_prompt || enhancedResult.enhanced_system_prompt);
                            setCopiedPrompt(true);
                            setTimeout(() => setCopiedPrompt(false), 2000);
                            addToast('Copied Master Prompt to clipboard!', 'success');
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                          <span>{copiedPrompt ? 'Copied!' : 'Copy Master Prompt'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewProjectName(
                              enhancedResult.domain === 'storytelling'
                                ? 'Story Engine: ' + (enhancedResult.title || enhancedResult.original_prompt.slice(0, 20))
                                : 'Prompt: ' + (enhancedResult.title || enhancedResult.original_prompt.slice(0, 20))
                            );
                            setNewProjectDesc('Optimized ' + enhancedResult.domain + ' prompt generated via Magic Creator.');
                            setNewProjectSysPrompt(enhancedResult.master_prompt || enhancedResult.enhanced_system_prompt);
                            setNewProjectTemplate('User input: {{topic}}');
                            setShowNewProjectModal(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Save to Studio Projects</span>
                        </button>
                      </div>
                    </div>

                    {/* Master Prompt Box */}
                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-inner">
                      <pre className="text-xs font-mono text-indigo-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                        {enhancedResult.master_prompt || enhancedResult.enhanced_system_prompt}
                      </pre>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
                      <strong className="text-slate-800 block">How to use this Master Prompt:</strong>
                      <p>
                        This prompt has been engineered with structural directives, emotional tension, and character guardrails. You can paste it into ChatGPT, Claude, or any local LLM to generate alternate storylines and new chapters.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE PROJECT */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create New Prompt Project</h3>
            <form onSubmit={handleCreateProjectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Code Review Summarizer"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Goal and purpose of this prompt project..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">System Prompt</label>
                <textarea
                  rows={3}
                  value={newProjectSysPrompt}
                  onChange={(e) => setNewProjectSysPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  User Template (Use &#123;&#123;var_name&#125;&#125;)
                </label>
                <input
                  type="text"
                  value={newProjectTemplate}
                  onChange={(e) => setNewProjectTemplate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 shadow-2xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BRANCH NEW VERSION */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Branch New Prompt Version</h3>
            <form onSubmit={handleCreateVersionSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Version Tag</label>
                  <input
                    type="text"
                    required
                    value={newVersionTag}
                    onChange={(e) => setNewVersionTag(e.target.value)}
                    placeholder="e.g. v1.2.0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Model</label>
                  <select
                    value={newVersionModel}
                    onChange={(e) => setNewVersionModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <optgroup label="🟢 Live Models (Verified Active Execution)">
                      {models.filter((m) => m.isLive).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.isLocal ? 'Local Ollama Cluster' : 'Google Gemini Cloud API'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">System Prompt</label>
                <textarea
                  rows={4}
                  value={newVersionSysPrompt}
                  onChange={(e) => setNewVersionSysPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 font-mono focus:border-indigo-500 focus:outline-none text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">User Template</label>
                <input
                  type="text"
                  value={newVersionTemplate}
                  onChange={(e) => setNewVersionTemplate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Changelog Commit Message</label>
                <input
                  type="text"
                  value={newVersionChangelog}
                  onChange={(e) => setNewVersionChangelog(e.target.value)}
                  placeholder="e.g. Added few-shot examples and reduced output verbosity"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 shadow-2xs"
                >
                  Commit Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEST CASE */}
      {showAddTestCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Test Case Scenario</h3>
            <form onSubmit={handleAddTestCaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  value={newTestCaseName}
                  onChange={(e) => setNewTestCaseName(e.target.value)}
                  placeholder="e.g. Refund request on broken item"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Input Variables according to template */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Template Input Values</label>
                {detectedVariables.length > 0 ? (
                  detectedVariables.map((v) => (
                    <div key={v}>
                      <span className="font-mono text-[11px] text-indigo-700 block mb-0.5">{`{{${v}}}`}</span>
                      <input
                        type="text"
                        required
                        value={newTestCaseVars[v] || ''}
                        onChange={(e) =>
                          setNewTestCaseVars((prev) => ({ ...prev, [v]: e.target.value }))
                        }
                        placeholder={`Value for ${v}...`}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  ))
                ) : (
                  <div>
                    <span className="font-mono text-[11px] text-indigo-700 block mb-0.5">input_text</span>
                    <input
                      type="text"
                      value={newTestCaseVars['input_text'] || ''}
                      onChange={(e) =>
                        setNewTestCaseVars((prev) => ({ ...prev, input_text: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assertion Type</label>
                  <select
                    value={newTestCaseAssertionType}
                    onChange={(e: any) => setNewTestCaseAssertionType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white"
                  >
                    <option value="contains">Contains Word</option>
                    <option value="json_valid">Valid JSON</option>
                    <option value="not_contains">Does Not Contain</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected / Keyword</label>
                  <input
                    type="text"
                    value={newTestCaseAssertionVal}
                    onChange={(e) => setNewTestCaseAssertionVal(e.target.value)}
                    placeholder="e.g. apology"
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTestCaseModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 shadow-2xs"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI PROMPT FINE-TUNER & OPTIMIZER */}
      {showFineTuneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Prompt Fine-Tuner & Optimizer</h3>
                  <p className="text-xs text-slate-500">
                    Automatically refine persona, directives, guardrails, and templates for testing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFineTuneModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Optimization Goals Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Fine-Tuning Goal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    id: 'strict_json',
                    label: 'Strict RFC-8259 JSON',
                    desc: 'Zero-markdown raw JSON, schema keys, error handler',
                    icon: '🎯'
                  },
                  {
                    id: 'concise_fast',
                    label: 'Ultra-Low Latency & Density',
                    desc: 'Under 50 words, remove filler, -55% token spend',
                    icon: '⚡'
                  },
                  {
                    id: 'edge_cases_guardrails',
                    label: 'Enterprise Guardrails & Safety',
                    desc: 'Anti-jailbreak, PII sanitization, non-hallucination',
                    icon: '🛡️'
                  },
                  {
                    id: 'empathy_support',
                    label: 'Customer Support De-Escalation',
                    desc: '4-step empathy framework with numbered action plan',
                    icon: '🤝'
                  },
                  {
                    id: 'code_precision',
                    label: 'Code Architecture & Types',
                    desc: 'Static typing, edge cases, Big-O complexity contracts',
                    icon: '💻'
                  },
                  {
                    id: 'cot_reasoning',
                    label: 'Chain-of-Thought (CoT)',
                    desc: 'Step-by-step <thinking> deliberation tags before answer',
                    icon: '🧠'
                  }
                ].map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setFineTuneGoal(g.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      fineTuneGoal === g.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{g.icon}</span>
                      <span className="text-xs font-bold">{g.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-1 leading-normal">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Directives & Model Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Evaluation Model</label>
                <select
                  value={fineTuneTargetModel}
                  onChange={(e) => setFineTuneTargetModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <optgroup label="🌟 Cloud Frontier Models">
                    {models.filter((m) => !m.isLocal).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.providerName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🖥️ Private Local Ollama Cluster">
                    {models.filter((m) => m.isLocal).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Local Ollama)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Custom Instruction (Optional)</label>
                <input
                  type="text"
                  value={fineTuneCustomInstruction}
                  onChange={(e) => setFineTuneCustomInstruction(e.target.value)}
                  placeholder="e.g. Always include product SKU in the reply..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="fineTuneAutoSaveCheck"
                checked={fineTuneAutoSave}
                onChange={(e) => setFineTuneAutoSave(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              <label htmlFor="fineTuneAutoSaveCheck" className="text-slate-700 cursor-pointer">
                Automatically commit this fine-tuned prompt as a <strong>new version</strong> in version history (e.g. v1.{versions.length}.0-tuned)
              </label>
            </div>

            {/* Run Fine-Tuning Action */}
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowFineTuneModal(false)}
                className="rounded-xl px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isFineTuning}
                onClick={handleRunFineTune}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isFineTuning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Optimizing Prompt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                    <span>Run AI Fine-Tuning</span>
                  </>
                )}
              </button>
            </div>

            {/* Fine-Tuning Results Preview */}
            {fineTuneResult && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Optimized: {fineTuneResult.goalLabel}
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                    {fineTuneResult.scoreBoost}
                  </span>
                </div>

                {/* Key Improvements */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-700 block">Fine-Tuning Adjustments:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                    {fineTuneResult.diffPoints.map((dp: string, idx: number) => (
                      <li key={idx}>{dp}</li>
                    ))}
                  </ul>
                </div>

                {/* Preview System Prompt */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 text-xs block">Optimized System Prompt:</span>
                  <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {fineTuneResult.optimizedSystemPrompt}
                  </pre>
                </div>

                {/* Apply Button */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyFineTune}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Apply Optimized Prompt to Editor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
