import React, { useState } from 'react';
import {
  ShieldAlert,
  GitPullRequest,
  FileCode,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  Check,
  Play,
  ArrowRight,
  Download,
  Filter,
  RefreshCw,
  Terminal,
  Upload,
  Globe,
  Bot,
  Zap,
  Clock,
  Layers,
  ChevronDown,
  MessageSquare,
  Lock,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  GitBranch,
  Search,
  FolderTree,
  GitCommit,
  ShieldCheck,
  Folder
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getApiBase } from '../../lib/apiConfig';

interface IssueItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  file: string;
  line?: number;
  originalSnippet?: string;
  suggestedFix?: string;
  explanation: string;
}

interface ReviewReport {
  healthScore: number;
  verdict: string;
  summary: string;
  metrics: {
    linesReviewed: number;
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    latencyMs: number;
  };
  issues: IssueItem[];
  timestamp: number;
}

const SAMPLE_PRS = [
  {
    id: 'pr_payment_auth',
    title: 'PR #142: Payment Webhook & User Search',
    description: 'Contains hardcoded secret and raw SQL injection vulnerability',
    filename: 'backend/services/payment_webhook.py',
    prompt: 'Check strictly for OWASP top 10 vulnerabilities, API key leaks, and SQL injection flaws.',
    diff: `@@ -12,8 +12,12 @@ def process_payment_notification(payload):
+    # Hardcoded stripe secret for testing webhook callback
+    stripe_webhook_secret = "whsec_99482716492038475829104"
+    
     user_id = payload.get("user_id")
+    query = f"SELECT * FROM users WHERE id = '{user_id}' AND active = 1"
+    cursor.execute(query)
     user = cursor.fetchone()
     
+    eval(payload.get("custom_callback_action", "pass"))
     return {"status": "processed"}`
  },
  {
    id: 'pr_credit_wallet',
    title: 'PR #108: Credit Balance & Resource Handler',
    description: 'Contains missing non-negative balance check, bare except, and file leak',
    filename: 'backend/app/wallet_service.py',
    prompt: 'Review business logic errors, credit balance race conditions, and unclosed file handles.',
    diff: `@@ -45,10 +45,14 @@ def deduct_user_credits(user_id, amount):
+    f = open("/tmp/audit_log.txt", "a")
+    f.write(f"Deducting {amount} from {user_id}\\n")
+    
+    # Deduct credits without checking if balance < amount
+    user.credits -= amount
+    db.commit()
+    
+    try:
+        sync_remote_wallet(user_id)
+    except:
+        pass`
  },
  {
    id: 'pr_fastapi_async',
    title: 'PR #89: Async AI Inference Controller',
    description: 'Synchronous blocking calls and missing LangChain timeouts',
    filename: 'backend/controllers/inference.py',
    prompt: 'Look for async event loop blockers, missing timeouts, and uncaught exceptions.',
    diff: `@@ -20,7 +20,10 @@ async def stream_inference_request(request: Request):
+    # Synchronous request blocks the async event loop
+    response = requests.get("https://api.external-ai.com/v1/models")
+    
+    chain = prompt | model
+    # Missing timeout or retry configuration
+    result = chain.invoke({"input": request.json()})
+    return result`
  }
];

export const CodeReviewAgentView: React.FC = () => {
  const { startNewChat, addToast, loadCodeIntoSandbox } = useApp();

  const [sourceType, setSourceType] = useState<'diff' | 'file' | 'pr'>('diff');
  const [content, setContent] = useState<string>(SAMPLE_PRS[0].diff);
  const [filename, setFilename] = useState<string>(SAMPLE_PRS[0].filename);
  const [userPrompt, setUserPrompt] = useState<string>(SAMPLE_PRS[0].prompt);

  // Multi-Provider Git & Private Repositories State
  const [repoProvider, setRepoProvider] = useState<'auto' | 'github' | 'gitlab' | 'bitbucket' | 'azure_devops' | 'generic'>('auto');
  const [prUrl, setPrUrl] = useState<string>('https://github.com/fastapi/fastapi/pull/10000');
  const [gitFetchMode, setGitFetchMode] = useState<'branch' | 'pr' | 'file'>('branch');
  const [repoSearchUrl, setRepoSearchUrl] = useState<string>('https://github.com/fastapi/fastapi');
  const [gitRepoName, setGitRepoName] = useState<string>('fastapi/fastapi');
  const [gitFilePath, setGitFilePath] = useState<string>('app/main.py');
  const [gitBranch, setGitBranch] = useState<string>('master');
  const [accessToken, setAccessToken] = useState<string>(() => localStorage.getItem('aura_git_token') || '');
  const [gitUsername, setGitUsername] = useState<string>(() => localStorage.getItem('aura_git_username') || '');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(() => Boolean(localStorage.getItem('aura_git_token')));
  const [rememberToken, setRememberToken] = useState<boolean>(true);
  const [isFetchingRepo, setIsFetchingRepo] = useState<boolean>(false);

  // Branch Selection & Tree States
  const [branchList, setBranchList] = useState<Array<{ name: string; isDefault: boolean; commitSha: string; protected: boolean }>>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [baseBranch, setBaseBranch] = useState<string>('master');
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false);
  const [branchSearch, setBranchSearch] = useState<string>('');
  const [branchFiles, setBranchFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [branchSubView, setBranchSubView] = useState<'diff' | 'files'>('diff');

  // Org Repos Explorer States
  const [orgReposList, setOrgReposList] = useState<Array<{ name: string; fullName: string; defaultBranch: string; isPrivate: boolean; description: string }>>([]);
  const [isLoadingOrgRepos, setIsLoadingOrgRepos] = useState<boolean>(false);
  const [showOrgRepos, setShowOrgRepos] = useState<boolean>(false);

  // Full Codebase Audit States
  const [isAuditingCodebase, setIsAuditingCodebase] = useState<boolean>(false);
  const [auditFolderFilter, setAuditFolderFilter] = useState<string>('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [auditResult, setAuditResult] = useState<{
    repo: string;
    branch: string;
    folderScanned: string;
    filesScannedCount: number;
    totalLinesScanned: number;
    folderBreakdown: Record<string, number>;
    topVulnerableFiles: Array<{
      filePath: string;
      folder: string;
      lines: number;
      issueCount: number;
      critical: number;
      high: number;
      medium: number;
    }>;
  } | null>(null);

  const [fetchedMeta, setFetchedMeta] = useState<{
    title: string;
    primaryFile: string;
    files: string[];
    linesCount: number;
    provider: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectSamplePR = (sample: typeof SAMPLE_PRS[0]) => {
    setSourceType('diff');
    setContent(sample.diff);
    setFilename(sample.filename);
    setUserPrompt(sample.prompt);
    setReport(null);
    setFetchedMeta(null);
    addToast(`Loaded ${sample.title}`, 'info');
  };

  const handleUrlChange = (newUrl: string) => {
    setPrUrl(newUrl);
    setRepoSearchUrl(newUrl);
    const lower = newUrl.toLowerCase();
    if (lower.includes('github.com')) setRepoProvider('github');
    else if (lower.includes('gitlab.com') || lower.includes('/-/merge_requests/')) setRepoProvider('gitlab');
    else if (lower.includes('bitbucket.org')) setRepoProvider('bitbucket');
    else if (lower.includes('dev.azure.com') || lower.includes('visualstudio.com')) setRepoProvider('azure_devops');
  };

  const handleFetchBranches = async (targetRepo?: string) => {
    const repoToFetch = targetRepo || repoSearchUrl.trim() || prUrl.trim();
    if (!repoToFetch) {
      addToast('Please enter a repository URL or owner/repo name.', 'warning');
      return;
    }
    setIsLoadingBranches(true);
    addToast('Fetching repository branches...', 'info');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/code-review/list-branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: repoProvider,
          repo: repoToFetch,
          accessToken: accessToken.trim() || null,
          username: gitUsername.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to fetch branches (Status ${res.status})`);
      }

      setBranchList(data.branches || []);
      const def = data.defaultBranch || (data.branches?.[0]?.name ?? 'main');
      setBaseBranch(def);
      const candidate = data.branches?.find((b: any) => !b.isDefault)?.name || def;
      setSelectedBranch(candidate);
      setGitBranch(candidate);

      if (rememberToken && accessToken.trim()) {
        localStorage.setItem('aura_git_token', accessToken.trim());
        if (gitUsername.trim()) localStorage.setItem('aura_git_username', gitUsername.trim());
      }

      addToast(`Found ${data.totalBranches} branches in ${data.repo}! Default: ${def}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error fetching branches', 'error');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleReviewSelectedBranch = async (branchToReview?: string) => {
    const targetBranch = branchToReview || selectedBranch;
    if (!targetBranch) {
      addToast('Please select a branch to review.', 'warning');
      return;
    }
    const repoToFetch = repoSearchUrl.trim() || prUrl.trim();
    setIsFetchingRepo(true);
    addToast(`Comparing branch '${targetBranch}' against '${baseBranch}'...`, 'info');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/code-review/compare-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: repoProvider,
          repo: repoToFetch,
          baseBranch: baseBranch || 'main',
          headBranch: targetBranch,
          accessToken: accessToken.trim() || null,
          username: gitUsername.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to compare branch (Status ${res.status})`);
      }

      setContent(data.diffContent);
      setFilename(data.primaryFile || `${targetBranch}.diff`);
      setFetchedMeta({
        title: data.title,
        primaryFile: data.primaryFile,
        files: data.files || [],
        linesCount: data.linesCount,
        provider: data.provider,
      });
      setSourceType('diff');
      setReport(null);
      addToast(`Loaded branch diff: ${data.linesCount} lines across ${data.files?.length || 1} files!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to compare branch', 'error');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleFetchBranchFiles = async (branch?: string) => {
    const targetBranch = branch || selectedBranch || baseBranch;
    const repoToFetch = repoSearchUrl.trim() || prUrl.trim();
    if (!repoToFetch || !targetBranch) {
      addToast('Please specify a repository and branch.', 'warning');
      return;
    }
    setIsLoadingFiles(true);
    addToast(`Loading files from branch '${targetBranch}'...`, 'info');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/code-review/list-branch-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: repoProvider,
          repo: repoToFetch,
          branch: targetBranch,
          accessToken: accessToken.trim() || null,
          username: gitUsername.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to list branch files');
      setBranchFiles(data.files || []);
      setBranchSubView('files');
      addToast(`Found ${data.totalFiles} files in branch '${targetBranch}'!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error listing branch files', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectBranchFileToReview = async (filePath: string) => {
    const repoToFetch = repoSearchUrl.trim() || prUrl.trim();
    const branchToFetch = selectedBranch || baseBranch || 'main';
    setIsFetchingRepo(true);
    addToast(`Loading '${filePath}' from branch '${branchToFetch}'...`, 'info');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/code-review/fetch-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: repoProvider,
          repo: repoToFetch,
          filePath: filePath,
          branch: branchToFetch,
          accessToken: accessToken.trim() || null,
          username: gitUsername.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch file');
      setContent(data.content);
      setFilename(data.filename);
      setFetchedMeta({
        title: `${data.filename} (${branchToFetch})`,
        primaryFile: data.filename,
        files: [data.filename],
        linesCount: data.linesCount,
        provider: data.provider,
      });
      setSourceType('file');
      setReport(null);
      addToast(`Loaded ${data.filename} (${data.linesCount} lines)!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error loading file', 'error');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleFetchOrgRepos = async () => {
    setIsLoadingOrgRepos(true);
    addToast('Listing repositories...', 'info');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/code-review/list-repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: repoProvider,
          ownerOrOrg: repoSearchUrl.trim(),
          accessToken: accessToken.trim() || null,
          username: gitUsername.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to list repositories');
      setOrgReposList(data.repos || []);
      setShowOrgRepos(true);
      addToast(`Found ${data.totalRepos} repositories!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error listing repositories', 'error');
    } finally {
      setIsLoadingOrgRepos(false);
    }
  };

  const handleAuditEntireBranch = async () => {
    const targetBranch = selectedBranch || baseBranch || 'main';
    const repoToFetch = repoSearchUrl.trim() || prUrl.trim();
    if (!repoToFetch) {
      addToast('Please enter a repository URL or name.', 'warning');
      return;
    }
    setIsAuditingCodebase(true);
    addToast(`Scanning all files & folders in branch '${targetBranch}'...`, 'info');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/code-review/audit-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: repoProvider,
          repo: repoToFetch,
          branch: targetBranch,
          folderPath: auditFolderFilter.trim(),
          userPrompt: userPrompt.trim(),
          accessToken: accessToken.trim() || null,
          username: gitUsername.trim() || null,
          maxFiles: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to audit branch (Status ${res.status})`);
      }

      setAuditResult({
        repo: data.repo,
        branch: data.branch,
        folderScanned: data.folderScanned,
        filesScannedCount: data.filesScannedCount,
        totalLinesScanned: data.totalLinesScanned,
        folderBreakdown: data.folderBreakdown || {},
        topVulnerableFiles: data.topVulnerableFiles || [],
      });

      setReport({
        healthScore: data.healthScore,
        verdict: data.verdict,
        summary: data.summary,
        metrics: data.metrics,
        issues: data.issues || [],
        timestamp: data.timestamp,
      });

      setFilename(`[Full Audit] ${data.repo} (${targetBranch})`);
      setContent(`// Full Codebase Audit completed across ${data.filesScannedCount} files\n// Total lines reviewed: ${data.totalLinesScanned}\n// Scanned Scope: ${data.folderScanned}\n// Health Score: ${data.healthScore}/100\n// Verdict: ${data.verdict}`);
      setSourceType('file');

      addToast(`Full audit finished: ${data.filesScannedCount} files scanned, ${data.issues?.length || 0} issues identified!`, data.metrics.criticalCount > 0 ? 'error' : 'success');
    } catch (err: any) {
      addToast(err.message || 'Error auditing codebase', 'error');
    } finally {
      setIsAuditingCodebase(false);
    }
  };

  const handleFetchFromRepository = async () => {
    if (gitFetchMode === 'pr' && !prUrl.trim()) {
      addToast('Please enter a Pull Request, Merge Request, or Diff URL.', 'warning');
      return;
    }
    if (gitFetchMode === 'file' && (!gitRepoName.trim() || !gitFilePath.trim())) {
      addToast('Please specify both repository (owner/repo) and file path.', 'warning');
      return;
    }

    setIsFetchingRepo(true);
    addToast(`Fetching from ${repoProvider === 'auto' ? 'Git repository' : repoProvider.toUpperCase()}...`, 'info');

    try {
      const apiBase = getApiBase();
      if (gitFetchMode === 'pr') {
        const res = await fetch(`${apiBase}/api/v1/code-review/fetch-pr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: repoProvider,
            prUrl: prUrl.trim(),
            accessToken: accessToken.trim() || null,
            username: gitUsername.trim() || null,
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || `Failed to fetch PR (Status ${res.status})`);
        }

        setContent(data.diffContent);
        setFilename(data.primaryFile || 'pull_request.diff');
        setFetchedMeta({
          title: data.title,
          primaryFile: data.primaryFile,
          files: data.files || [],
          linesCount: data.linesCount,
          provider: data.provider
        });
        setReport(null);

        if (rememberToken && accessToken.trim()) {
          localStorage.setItem('aura_git_token', accessToken.trim());
          if (gitUsername.trim()) localStorage.setItem('aura_git_username', gitUsername.trim());
        }

        addToast(`Successfully loaded ${data.title} (${data.linesCount} lines)!`, 'success');
      } else {
        const res = await fetch(`${apiBase}/api/v1/code-review/fetch-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: repoProvider,
            repo: gitRepoName.trim(),
            filePath: gitFilePath.trim(),
            branch: gitBranch.trim() || 'main',
            accessToken: accessToken.trim() || null,
            username: gitUsername.trim() || null,
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || `Failed to fetch file (Status ${res.status})`);
        }

        setContent(data.content);
        setFilename(data.filename);
        setFetchedMeta({
          title: `${data.filename} (${gitBranch})`,
          primaryFile: data.filename,
          files: [data.filename],
          linesCount: data.linesCount,
          provider: data.provider
        });
        setReport(null);

        if (rememberToken && accessToken.trim()) {
          localStorage.setItem('aura_git_token', accessToken.trim());
          if (gitUsername.trim()) localStorage.setItem('aura_git_username', gitUsername.trim());
        }

        addToast(`Successfully loaded ${data.filename} (${data.linesCount} lines)!`, 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch from repository', 'error');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      setSourceType('file');
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
        addToast(`Uploaded ${file.name} (${file.size} bytes)`, 'info');
      };
      reader.readAsText(file);
    }
  };

  const handleRunReview = async () => {
    if (!content.trim()) {
      addToast('Please provide code or a Git diff to review.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    addToast('Code Review Agent analyzing code and diff...', 'info');

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/v1/code-review/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          content,
          filename,
          userPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Review failed with status ${response.status}`);
      }

      const data: ReviewReport = await response.json();
      setReport(data);
      addToast(`Review completed: ${data.metrics.totalIssues} issues found.`, data.metrics.criticalCount > 0 ? 'error' : 'success');
    } catch (err: any) {
      addToast(`Code review failed: ${err.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyFix = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    addToast('Suggested fix copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestInSandbox = (codeFix: string, fileRef: string) => {
    let lang = 'python';
    if (fileRef.endsWith('.ts') || fileRef.endsWith('.tsx') || fileRef.endsWith('.js')) lang = 'typescript';
    if (fileRef.endsWith('.sql')) lang = 'sql';
    loadCodeIntoSandbox(codeFix, lang, {
      title: `Fix for ${fileRef}`,
      autoRun: false
    });
  };

  const handleAskInChat = (issue: IssueItem) => {
    const prompt = `I need help fixing this ${issue.severity.toUpperCase()} code review issue in \`${issue.file}\` (line ${issue.line}):\n\n**Issue:** ${issue.title}\n**Description:** ${issue.description}\n\n**Current Code:**\n\`\`\`\n${issue.originalSnippet}\n\`\`\`\n\n**Suggested Fix:**\n\`\`\`\n${issue.suggestedFix}\n\`\`\`\n\n${userPrompt ? `Review criteria: ${userPrompt}\n\n` : ''}Please provide an explanation of this vulnerability and full refactored code.`;
    startNewChat(prompt);
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    let md = `# Code Review Report: ${filename}\n`;
    md += `**Health Score:** ${report.healthScore}/100\n`;
    md += `**Verdict:** ${report.verdict}\n\n`;
    md += `### Metrics\n- Total Issues: ${report.metrics.totalIssues}\n- Critical: ${report.metrics.criticalCount}\n- High: ${report.metrics.highCount}\n- Medium: ${report.metrics.mediumCount}\n- Low: ${report.metrics.lowCount}\n- Lines Analyzed: ${report.metrics.linesReviewed}\n\n`;
    md += `## Detailed Findings\n\n`;
    report.issues.forEach((iss, i) => {
      md += `### ${i + 1}. [${iss.severity.toUpperCase()}] ${iss.title}\n`;
      md += `**File:** \`${iss.file}\` (Line ${iss.line})\n`;
      md += `**Category:** ${iss.category}\n\n`;
      md += `${iss.description}\n\n`;
      if (iss.originalSnippet) {
        md += `\`\`\`diff\n- ${iss.originalSnippet}\n+ ${iss.suggestedFix}\n\`\`\`\n\n`;
      }
      md += `**Explanation:** ${iss.explanation}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_review_${filename.replace(/[/\\?%*:|"<>]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Markdown review report downloaded!', 'success');
  };

  const filteredIssues = report
    ? report.issues.filter(i => {
        const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
        const matchesFolder = selectedFolderFilter === 'all' || (i.file && i.file.includes(selectedFolderFilter));
        return matchesSeverity && matchesFolder;
      })
    : [];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
            <AlertTriangle className="h-3 w-3 text-rose-500" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[11px] font-semibold text-orange-400">
            <AlertCircle className="h-3 w-3 text-orange-500" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
            <Info className="h-3 w-3 text-amber-500" /> Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
            <CheckCircle2 className="h-3 w-3 text-blue-400" /> Low
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-[#F8FAFF] to-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-gradient-to-br from-rose-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/70 text-rose-700 text-[11px] font-semibold tracking-wide uppercase">
                <ShieldAlert className="h-3 w-3 text-rose-600" />
                AI Code Review & PR Security Agent
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                <Zap className="h-3 w-3 text-emerald-600" /> Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Code Review Agent
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Scan pull requests, git diffs, and local repository files for security vulnerabilities, logic flaws, race conditions, and performance bottlenecks.
            </p>
          </div>

          {/* Quick Demo PR Buttons */}
          <div className="flex flex-col items-start lg:items-end gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Test Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PRS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSamplePR(sample)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-2xs"
                >
                  {sample.title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Source & Custom Prompts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            {/* Source Type Selector Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setSourceType('diff')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                  sourceType === 'diff' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                <span>Git Diff / PR</span>
              </button>
              <button
                onClick={() => setSourceType('file')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                  sourceType === 'file' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Local File</span>
              </button>
              <button
                onClick={() => setSourceType('pr')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                  sourceType === 'pr' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Remote Git / PR</span>
              </button>
            </div>

            {/* Remote Git Repository & Private Repo Connector */}
            {sourceType === 'pr' && (
              <div className="space-y-3.5 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-slate-50/50 p-3.5">
                {/* Repository Provider Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-indigo-600" />
                      <span>Git Platform / Provider</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Auto-detected from URL</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'github', label: 'GitHub' },
                      { id: 'gitlab', label: 'GitLab' },
                      { id: 'bitbucket', label: 'Bitbucket' },
                      { id: 'azure_devops', label: 'Azure DevOps' },
                      { id: 'generic', label: 'Custom Git' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRepoProvider(p.id as any)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all text-center ${
                          repoProvider === p.id
                            ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fetch Mode Switch: Branch Review vs Pull Request vs Single File */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setGitFetchMode('branch')}
                    className={`flex-1 py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${
                      gitFetchMode === 'branch' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GitBranch className="h-3 w-3" />
                    <span>Select Branch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGitFetchMode('pr')}
                    className={`flex-1 py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${
                      gitFetchMode === 'pr' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GitPullRequest className="h-3 w-3" />
                    <span>PR / MR Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGitFetchMode('file')}
                    className={`flex-1 py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${
                      gitFetchMode === 'file' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileCode className="h-3 w-3" />
                    <span>Single File</span>
                  </button>
                </div>

                {/* 1. BRANCH REVIEW MODE: List and select any branch */}
                {gitFetchMode === 'branch' && (
                  <div className="space-y-3">
                    {/* Repository URL Input & Fetch Branches Button */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-indigo-600" />
                          <span>Repository URL / Name (GitHub, GitLab, Bitbucket)</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleFetchOrgRepos}
                          disabled={isLoadingOrgRepos}
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <Search className="h-2.5 w-2.5" />
                          <span>{isLoadingOrgRepos ? 'Searching...' : 'Explore Org Repos'}</span>
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={repoSearchUrl}
                          onChange={(e) => {
                            setRepoSearchUrl(e.target.value);
                            handleUrlChange(e.target.value);
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g. https://github.com/fastapi/fastapi or owner/repo"
                        />
                        <button
                          type="button"
                          onClick={() => handleFetchBranches()}
                          disabled={isLoadingBranches}
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                        >
                          {isLoadingBranches ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <GitBranch className="h-3 w-3" />
                              <span>Load Branches</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Quick repo shortcut tests */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Quick repos:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRepoSearchUrl('https://github.com/fastapi/fastapi');
                            setRepoProvider('github');
                            handleFetchBranches('https://github.com/fastapi/fastapi');
                          }}
                          className="text-[10px] text-indigo-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          FastAPI (GitHub)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRepoSearchUrl('https://gitlab.com/gitlab-org/gitlab');
                            setRepoProvider('gitlab');
                            handleFetchBranches('https://gitlab.com/gitlab-org/gitlab');
                          }}
                          className="text-[10px] text-indigo-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          GitLab Org
                        </button>
                      </div>
                    </div>

                    {/* Org Repos list modal/drawer if fetched */}
                    {showOrgRepos && orgReposList.length > 0 && (
                      <div className="rounded-xl border border-indigo-200 bg-white p-2.5 max-h-48 overflow-y-auto space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-700 pb-1 border-b border-slate-100">
                          <span>Repositories Found ({orgReposList.length}):</span>
                          <button
                            type="button"
                            onClick={() => setShowOrgRepos(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-600"
                          >
                            Close
                          </button>
                        </div>
                        {orgReposList.map((r, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setRepoSearchUrl(r.fullName);
                              handleFetchBranches(r.fullName);
                              setShowOrgRepos(false);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                          >
                            <span className="font-mono text-[11px] font-medium text-indigo-700">
                              {r.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              branch: {r.defaultBranch}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Branches Selector Section */}
                    {branchList.length > 0 ? (
                      <div className="rounded-xl border border-indigo-100 bg-white p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Available Branches ({branchList.length})</span>
                          </span>
                          <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Base: {baseBranch}
                          </span>
                        </div>

                        {/* Search branch filter if many branches */}
                        {branchList.length > 6 && (
                          <div className="relative">
                            <input
                              type="text"
                              value={branchSearch}
                              onChange={(e) => setBranchSearch(e.target.value)}
                              placeholder="Search branches..."
                              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1 pr-7 text-[11px] text-slate-800 focus:bg-white focus:outline-none"
                            />
                            <Search className="h-3 w-3 text-slate-400 absolute right-2 top-2" />
                          </div>
                        )}

                        {/* Branch Dropdown / Picker */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Select Branch to Review:
                          </label>
                          <select
                            value={selectedBranch}
                            onChange={(e) => {
                              setSelectedBranch(e.target.value);
                              setGitBranch(e.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                          >
                            {branchList
                              .filter(b => !branchSearch || b.name.toLowerCase().includes(branchSearch.toLowerCase()))
                              .map((b, idx) => (
                                <option key={idx} value={b.name}>
                                  {b.isDefault ? `★ ${b.name} (Default)` : `🌿 ${b.name}`} {b.commitSha ? `[#${b.commitSha}]` : ''}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Comparison Base Branch */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <GitCommit className="h-3 w-3 text-slate-400" />
                            <span>Comparing vs Base Branch:</span>
                          </span>
                          <select
                            value={baseBranch}
                            onChange={(e) => setBaseBranch(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-700"
                          >
                            {branchList.map((b, idx) => (
                              <option key={idx} value={b.name}>
                                {b.name} {b.isDefault ? '(Default)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Branch Review Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleReviewSelectedBranch()}
                            disabled={isFetchingRepo}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2 text-xs font-semibold shadow-2xs transition-colors"
                          >
                            {isFetchingRepo ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Zap className="h-3.5 w-3.5" />
                            )}
                            <span>Review Full Diff</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFetchBranchFiles()}
                            disabled={isLoadingFiles}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 py-2 text-xs font-semibold transition-colors"
                          >
                            {isLoadingFiles ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FolderTree className="h-3.5 w-3.5" />
                            )}
                            <span>Browse Files</span>
                          </button>
                        </div>

                        {/* Full Codebase & Folder Audit Section */}
                        <div className="pt-2.5 border-t border-indigo-100/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Audit All Files & Folders in '{selectedBranch || baseBranch}'</span>
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">All Files (No Limit)</span>
                          </div>

                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={auditFolderFilter}
                              onChange={(e) => setAuditFolderFilter(e.target.value)}
                              placeholder="Subfolder (e.g. backend/ or leave blank for all)"
                              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAuditEntireBranch}
                              disabled={isAuditingCodebase}
                              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all shrink-0"
                            >
                              {isAuditingCodebase ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>Scanning Codebase...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  <span>Audit Codebase</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Audit Results: Folder Breakdown & Top Vulnerable Files */}
                        {auditResult && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-2.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-900 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Codebase Audit Complete</span>
                              </span>
                              <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                {auditResult.filesScannedCount} files ({auditResult.totalLinesScanned} lines)
                              </span>
                            </div>

                            {/* Folder Breakdown Chips */}
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                Issues by Folder:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedFolderFilter('all')}
                                  className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                    selectedFolderFilter === 'all'
                                      ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                                      : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  }`}
                                >
                                  All Folders
                                </button>
                                {Object.entries(auditResult.folderBreakdown).map(([folder, count], idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedFolderFilter(folder)}
                                    className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-colors flex items-center gap-1 ${
                                      selectedFolderFilter === folder
                                        ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                                        : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                    }`}
                                  >
                                    <Folder className="h-2.5 w-2.5 opacity-60" />
                                    <span>{folder}</span>
                                    <span className={`px-1 rounded-full text-[9px] ${count > 0 ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                                      {count}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Top Vulnerable Files */}
                            {auditResult.topVulnerableFiles.length > 0 && auditResult.topVulnerableFiles[0].issueCount > 0 && (
                              <div className="pt-1.5 border-t border-emerald-200/60">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                  Top Vulnerable Files:
                                </span>
                                <div className="space-y-1">
                                  {auditResult.topVulnerableFiles.slice(0, 3).map((f, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => handleSelectBranchFileToReview(f.filePath)}
                                      className="p-1 rounded bg-white border border-emerald-200/60 hover:bg-emerald-100/50 cursor-pointer flex items-center justify-between transition-colors text-[11px]"
                                    >
                                      <span className="font-mono text-slate-800 truncate mr-2">
                                        {f.filePath}
                                      </span>
                                      <span className="shrink-0 font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded text-[10px]">
                                        {f.issueCount} issues ({f.critical} critical)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Branch Files Tree list if Browse Files clicked */}
                        {branchFiles.length > 0 && branchSubView === 'files' && (
                          <div className="rounded-xl border border-indigo-100 bg-slate-50 p-2.5 max-h-48 overflow-y-auto space-y-1 text-xs">
                            <div className="flex items-center justify-between font-semibold text-slate-700 pb-1 border-b border-slate-200/60">
                              <span>Files in '{selectedBranch}' ({branchFiles.length}):</span>
                              <button
                                type="button"
                                onClick={() => setBranchSubView('diff')}
                                className="text-[10px] text-slate-400 hover:text-slate-600"
                              >
                                Hide
                              </button>
                            </div>
                            {branchFiles.map((f, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleSelectBranchFileToReview(f)}
                                className="p-1 rounded hover:bg-white cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                              >
                                <span className="font-mono text-[11px] text-slate-800 truncate mr-2">
                                  {f}
                                </span>
                                <span className="text-[10px] font-semibold text-indigo-600 shrink-0">
                                  Review
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-3 text-center">
                        <p className="text-xs text-slate-600">
                          Click <strong className="text-indigo-700">"Load Branches"</strong> above to see all branches in this repository.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. PULL REQUEST / MR LINK MODE */}
                {gitFetchMode === 'pr' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {repoProvider === 'gitlab' ? 'GitLab Merge Request URL' : repoProvider === 'bitbucket' ? 'Bitbucket Pull Request URL' : 'Pull Request / Diff URL'}
                    </label>
                    <input
                      type="text"
                      value={prUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
                      placeholder={
                        repoProvider === 'gitlab'
                          ? 'https://gitlab.com/group/repo/-/merge_requests/12'
                          : repoProvider === 'bitbucket'
                          ? 'https://bitbucket.org/workspace/repo/pull-requests/45'
                          : 'https://github.com/owner/repository/pull/123'
                      }
                    />

                    {/* Quick Demo PR links */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Quick URL tests:</span>
                      <button
                        type="button"
                        onClick={() => handleUrlChange('https://github.com/fastapi/fastapi/pull/10000')}
                        className="text-[10px] text-indigo-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                      >
                        GitHub PR #10000
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUrlChange('https://gitlab.com/gitlab-org/gitlab/-/merge_requests/145000')}
                        className="text-[10px] text-indigo-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                      >
                        GitLab MR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUrlChange('https://bitbucket.org/atlassian/local-repo/pull-requests/1')}
                        className="text-[10px] text-indigo-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                      >
                        Bitbucket PR
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleFetchFromRepository}
                      disabled={isFetchingRepo}
                      className="w-full mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2 text-xs font-semibold shadow-sm transition-all"
                    >
                      {isFetchingRepo ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Fetching PR Diff...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Fetch & Load PR Diff</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 3. SINGLE FILE FROM BRANCH MODE */}
                {gitFetchMode === 'file' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Repository (owner/repo or project path)
                        </label>
                        <input
                          type="text"
                          value={gitRepoName}
                          onChange={(e) => setGitRepoName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g. fastapi/fastapi or my-org/service"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          File Path in Repo
                        </label>
                        <input
                          type="text"
                          value={gitFilePath}
                          onChange={(e) => setGitFilePath(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g. backend/app/auth.py"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={gitBranch}
                          onChange={(e) => setGitBranch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="main"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFetchFromRepository}
                      disabled={isFetchingRepo}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2 text-xs font-semibold shadow-sm transition-all"
                    >
                      {isFetchingRepo ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Fetching File...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Fetch & Load File</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Private Repository Credentials Section */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
                  <div
                    onClick={() => setIsPrivateRepo(!isPrivateRepo)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-800">
                        Private Repository Credentials
                      </span>
                      {accessToken.trim() && (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.2 font-medium">
                          Token Set
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      {isPrivateRepo ? 'Hide' : 'Configure Token'}
                    </span>
                  </div>

                  {isPrivateRepo && (
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                            <Key className="h-3 w-3 text-slate-400" />
                            <span>
                              {repoProvider === 'github' ? 'GitHub Personal Access Token (PAT)' :
                               repoProvider === 'gitlab' ? 'GitLab Personal Access Token' :
                               repoProvider === 'bitbucket' ? 'Bitbucket App Password' :
                               repoProvider === 'azure_devops' ? 'Azure DevOps PAT' :
                               'Access Token / Bearer Token'}
                            </span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {repoProvider === 'github' ? 'Scope: repo' :
                             repoProvider === 'gitlab' ? 'Scope: read_api' :
                             repoProvider === 'bitbucket' ? 'Scope: repository:read' :
                             'Read permission'}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={showToken ? 'text' : 'password'}
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder={
                              repoProvider === 'github' ? 'ghp_... or github_pat_...' :
                              repoProvider === 'gitlab' ? 'glpat-...' :
                              repoProvider === 'bitbucket' ? 'App Password' :
                              'Personal Access Token'
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 pr-8 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                          >
                            {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Username input (needed for Bitbucket App Password Basic Auth) */}
                      {(repoProvider === 'bitbucket' || repoProvider === 'generic' || !['github', 'gitlab'].includes(repoProvider)) && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Username {repoProvider === 'bitbucket' && <span className="text-rose-500">(Required for Bitbucket App Password)</span>}
                          </label>
                          <input
                            type="text"
                            value={gitUsername}
                            onChange={(e) => setGitUsername(e.target.value)}
                            placeholder="e.g. bitbucket_username"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberToken}
                            onChange={(e) => setRememberToken(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          <span>Save credentials in local browser storage</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fetch Action Button */}
                <button
                  type="button"
                  onClick={handleFetchFromRepository}
                  disabled={isFetchingRepo}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2 text-xs font-semibold shadow-sm transition-all"
                >
                  {isFetchingRepo ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Fetching from {repoProvider.toUpperCase()}...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Fetch & Load {gitFetchMode === 'pr' ? 'PR Diff' : 'File'}</span>
                    </>
                  )}
                </button>

                {/* Fetched Status & File List Banner */}
                {fetchedMeta && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{fetchedMeta.title}</span>
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {fetchedMeta.linesCount} lines
                      </span>
                    </div>
                    {fetchedMeta.files && fetchedMeta.files.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-emerald-200/60">
                        <span className="text-[10px] text-emerald-700 font-medium">Changed Files:</span>
                        {fetchedMeta.files.slice(0, 4).map((f, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFilename(f)}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                              filename === f
                                ? 'bg-emerald-700 text-white font-bold'
                                : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {f.split('/').pop()}
                          </button>
                        ))}
                        {fetchedMeta.files.length > 4 && (
                          <span className="text-[10px] text-emerald-600">+{fetchedMeta.files.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Target File Label & Upload Button (for local file or diff inspection) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Target File / Path
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none transition-colors"
                  placeholder="e.g. backend/app/auth.py"
                />
              </div>

              {sourceType === 'file' && (
                <label className="self-end cursor-pointer flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Browse File</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Code / Git Diff Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {sourceType === 'diff' ? 'Git Diff Content' : 'Source Code Snippet'}
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {content.split('\n').length} lines
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-slate-200 bg-slate-950 text-indigo-100/90 font-mono text-xs p-3.5 leading-relaxed resize-none focus:border-indigo-500 focus:outline-none selection:bg-indigo-600/40"
                placeholder={
                  sourceType === 'diff'
                    ? "Paste git diff (e.g. diff --git a/... b/... or + / - lines)..."
                    : "Paste code to review..."
                }
                spellCheck={false}
              />
            </div>

            {/* User Prompt & Focus Tool */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Agent Review Instructions & Focus</span>
                </label>
              </div>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none placeholder:text-slate-400"
                placeholder="e.g. Focus on finding security vulnerabilities, authentication leaks, and negative credit race conditions..."
              />

              {/* Quick Focus Tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'OWASP Security & Leaks',
                  'Concurrency & Race Conditions',
                  'Logic Bugs & Exceptions',
                  'LangChain Pipeline Reliability'
                ].map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setUserPrompt(prev => prev ? `${prev}, ${focus}` : focus)}
                    className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-0.5 text-[10px] font-medium transition-colors"
                  >
                    + {focus}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunReview}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-700 py-3 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Agent Analyzing Code & Diffs...</span>
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  <span>Execute Code Review Agent</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Review Report Dashboard & Findings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!report && !isAnalyzing && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-800">
                  Code Review Agent Ready
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Select a sample scenario from above or paste your PR diff / local code, customize the review focus prompt, and click <strong>Execute Code Review Agent</strong>.
                </p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="rounded-2xl border border-indigo-100 bg-white p-12 text-center space-y-4 shadow-sm animate-pulse">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <RefreshCw className="h-7 w-7 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Scanning for vulnerabilities, bugs & flaws...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Parsing AST trees, OWASP heuristics, and prompt-directed criteria.
                </p>
              </div>
            </div>
          )}

          {report && !isAnalyzing && (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    {/* Score Circle */}
                    <div
                      className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 font-bold shadow-sm ${
                        report.healthScore >= 80
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : report.healthScore >= 60
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-rose-500 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span className="text-xl leading-none">{report.healthScore}</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Score</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Audit Verdict
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            report.metrics.criticalCount > 0
                              ? 'bg-rose-100 text-rose-800'
                              : report.metrics.highCount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {report.metrics.criticalCount > 0 ? 'CRITICAL RISK' : report.metrics.highCount > 0 ? 'NEEDS CHANGES' : 'APPROVED'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                        {report.verdict}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.summary}
                      </p>
                    </div>
                  </div>

                  {/* Export Report Button */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={handleExportMarkdown}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
                      title="Download Markdown Report"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                    <span className="block text-lg font-bold text-slate-900">{report.metrics.linesReviewed}</span>
                    <span className="text-[11px] text-slate-500">Lines Scanned</span>
                  </div>
                  <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-2.5">
                    <span className="block text-lg font-bold text-rose-700">{report.metrics.criticalCount}</span>
                    <span className="text-[11px] text-rose-600">Critical</span>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-2.5">
                    <span className="block text-lg font-bold text-amber-700">{report.metrics.highCount}</span>
                    <span className="text-[11px] text-amber-600">High Risk</span>
                  </div>
                  <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-2.5">
                    <span className="block text-lg font-bold text-indigo-700">{report.metrics.latencyMs}ms</span>
                    <span className="text-[11px] text-indigo-600">Audit Latency</span>
                  </div>
                </div>
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
                  <button
                    onClick={() => setSeverityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      severityFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All ({report.issues.length})
                  </button>
                  {report.metrics.criticalCount > 0 && (
                    <button
                      onClick={() => setSeverityFilter('critical')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        severityFilter === 'critical'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      Critical ({report.metrics.criticalCount})
                    </button>
                  )}
                  {report.metrics.highCount > 0 && (
                    <button
                      onClick={() => setSeverityFilter('high')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        severityFilter === 'high'
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-orange-200 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      High ({report.metrics.highCount})
                    </button>
                  )}
                  {report.metrics.mediumCount > 0 && (
                    <button
                      onClick={() => setSeverityFilter('medium')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        severityFilter === 'medium'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      Medium ({report.metrics.mediumCount})
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  Showing {filteredIssues.length} issues
                </span>
              </div>

              {/* Issues List */}
              <div className="space-y-3">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-shadow"
                  >
                    {/* Issue Header */}
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(issue.severity)}
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-slate-200/60">
                          {issue.category}
                        </span>
                        <span className="text-xs font-mono text-slate-600 font-medium">
                          {issue.file} {issue.line ? `(L${issue.line})` : ''}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleAskInChat(issue)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-[11px] font-medium transition-colors"
                          title="Open fix discussion in Chat"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Ask in Chat</span>
                        </button>

                        {issue.suggestedFix && (
                          <button
                            onClick={() => handleTestInSandbox(issue.suggestedFix!, issue.file)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-[11px] font-medium transition-colors"
                            title="Load fixed snippet into Code Sandbox"
                          >
                            <Terminal className="h-3 w-3" />
                            <span>Test Sandbox</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Issue Body */}
                    <div className="p-4 space-y-3 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {issue.title}
                        </h4>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>

                      {/* Code Diff: Original vs Suggested */}
                      {(issue.originalSnippet || issue.suggestedFix) && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-[11px]">
                          {issue.originalSnippet && (
                            <div className="p-3 bg-rose-950/30 border-b border-slate-800 text-rose-300">
                              <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block mb-1">
                                ❌ Problematic Code:
                              </span>
                              <code>- {issue.originalSnippet}</code>
                            </div>
                          )}

                          {issue.suggestedFix && (
                            <div className="p-3 bg-emerald-950/30 text-emerald-300 flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block mb-1">
                                  ✓ Recommended Fix:
                                </span>
                                <code className="whitespace-pre-wrap leading-relaxed">+ {issue.suggestedFix}</code>
                              </div>
                              <button
                                onClick={() => handleCopyFix(issue.suggestedFix!, issue.id)}
                                className="shrink-0 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                title="Copy suggested fix"
                              >
                                {copiedId === issue.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px] leading-relaxed">
                        <strong className="text-slate-800">Why this matters: </strong>
                        {issue.explanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
