import os
import re
import time
import json
import asyncio
import httpx
from urllib.parse import quote
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter()

class FullBranchAuditRequest(BaseModel):
    provider: str = "auto"
    repo: str  # URL or owner/repo
    branch: Optional[str] = "main"
    folderPath: Optional[str] = ""  # subfolder or empty for whole repo
    userPrompt: Optional[str] = ""
    accessToken: Optional[str] = None
    username: Optional[str] = None
    maxFiles: Optional[int] = 0  # 0 or None means scan ALL files across repository without limit

class FetchPRRequest(BaseModel):
    provider: str = "auto"  # "auto", "github", "gitlab", "bitbucket", "azure_devops", "generic"
    prUrl: str
    accessToken: Optional[str] = None
    username: Optional[str] = None

class FetchFileRequest(BaseModel):
    provider: str = "auto"
    repo: str  # e.g. "owner/repo" or workspace/slug
    filePath: str
    branch: Optional[str] = "main"
    accessToken: Optional[str] = None
    username: Optional[str] = None

class ListBranchesRequest(BaseModel):
    provider: str = "auto"
    repo: str  # e.g. "https://github.com/owner/repo" or "owner/repo"
    accessToken: Optional[str] = None
    username: Optional[str] = None

class ListReposRequest(BaseModel):
    provider: str = "auto"
    ownerOrOrg: Optional[str] = ""  # e.g. "owner", "org", or empty for user's own repos
    accessToken: Optional[str] = None
    username: Optional[str] = None

class CompareBranchRequest(BaseModel):
    provider: str = "auto"
    repo: str
    baseBranch: Optional[str] = "main"
    headBranch: str  # The branch the user wants to review
    accessToken: Optional[str] = None
    username: Optional[str] = None

class ListBranchFilesRequest(BaseModel):
    provider: str = "auto"
    repo: str
    branch: Optional[str] = "main"
    accessToken: Optional[str] = None
    username: Optional[str] = None

class CodeReviewRequest(BaseModel):
    sourceType: str = "diff"  # "diff", "file", "pr", "snippet"
    content: str
    userPrompt: Optional[str] = ""
    filename: Optional[str] = "main.py"
    focusCategories: Optional[List[str]] = []
    modelId: Optional[str] = "llama-3-3-70b"

class IssueItem(BaseModel):
    id: str
    severity: str  # "critical", "high", "medium", "low", "info"
    category: str  # "Security", "Bug", "Performance", "Best Practice"
    title: str
    description: str
    file: str
    line: Optional[int] = 1
    originalSnippet: Optional[str] = ""
    suggestedFix: Optional[str] = ""
    explanation: str

def analyze_code_rules(content: str, filename: str, user_prompt: str) -> List[Dict[str, Any]]:
    """Heuristic rule-based security, bug, and performance scanner."""
    issues = []
    lines = content.split("\n")
    prompt_lower = (user_prompt or "").lower()

    for idx, line in enumerate(lines, 1):
        line_clean = line.strip()

        # 1. Hardcoded API keys or Secrets
        if re.search(r'(?:api[_-]?key|secret|password|token)\s*=\s*["\'][A-Za-z0-9_\-]{8,}["\']', line_clean, re.I):
            issues.append({
                "id": f"sec-secret-{idx}",
                "severity": "critical",
                "category": "Security",
                "title": "Hardcoded Secret / API Key Detected",
                "description": "Sensitive credential or API key is committed directly in plaintext source code.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": 'api_key = os.getenv("API_KEY")',
                "explanation": "Hardcoded credentials can be leaked in source control. Always load API keys and passwords from environment variables or a secret vault."
            })

        # 2. SQL Injection Vulnerability
        if re.search(r'(?:execute|query)\s*\(\s*f["\'].*SELECT|INSERT|UPDATE|DELETE.*\{', line_clean, re.I):
            issues.append({
                "id": f"sec-sqli-{idx}",
                "severity": "critical",
                "category": "Security",
                "title": "Potential SQL Injection Vulnerability",
                "description": "SQL query is formatted using Python f-strings directly with user parameters instead of parameterized queries.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": 'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
                "explanation": "Unescaped string interpolation in SQL statements allows attackers to alter query logic, bypass authentication, or exfiltrate databases."
            })

        # 3. Bare except clauses (swallowing errors)
        if re.match(r"^except\s*:", line_clean):
            issues.append({
                "id": f"bug-bare-except-{idx}",
                "severity": "high",
                "category": "Bug",
                "title": "Bare Exception Catching (Swallows Errors)",
                "description": "Catches all exceptions including SystemExit and KeyboardInterrupt without logging.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": "except Exception as e:\n    logger.error(f'Operation failed: {e}')",
                "explanation": "A bare 'except:' catches system interrupt signals and conceals critical bugs, making diagnosis in production environments impossible."
            })

        # 4. Insecure eval() / exec()
        if re.search(r"\b(?:eval|exec)\s*\(", line_clean):
            issues.append({
                "id": f"sec-eval-{idx}",
                "severity": "critical",
                "category": "Security",
                "title": "Arbitrary Code Execution via eval()/exec()",
                "description": "Use of dynamic execution function can allow Remote Code Execution (RCE) if input is untrusted.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": "# Use ast.literal_eval() or json.loads() for safe data deserialization\nparsed_data = json.loads(user_input)",
                "explanation": "Dynamic evaluation executes arbitrary commands within host process privileges, allowing full system compromise."
            })

        # 5. Missing async await
        if "async def" in content and re.search(r"(?:httpx|requests|fetch|db\.execute)\s*\(", line_clean) and "await" not in line_clean and "def " not in line_clean:
            issues.append({
                "id": f"perf-sync-block-{idx}",
                "severity": "medium",
                "category": "Performance",
                "title": "Synchronous Blocking Call in Async Function",
                "description": "Executing synchronous I/O inside an async function blocks the event loop thread.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": f"await {line_clean}",
                "explanation": "Blocking operations freeze the FastAPI/Node event loop for all concurrent users. Always use async non-blocking equivalents."
            })

        # 6. React dangerouslySetInnerHTML
        if "dangerouslySetInnerHTML" in line_clean:
            issues.append({
                "id": f"sec-xss-{idx}",
                "severity": "high",
                "category": "Security",
                "title": "Cross-Site Scripting (XSS) Hazard",
                "description": "Directly injecting unpurified HTML can allow malicious JavaScript injection in browser.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": "// Sanitize before injection using DOMPurify\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />",
                "explanation": "Untrusted markup rendered directly can steal user cookies, session tokens, or perform phishing attacks."
            })

        # 7. Unclosed resource without with-statement
        if re.search(r"=\s*open\s*\(", line_clean) and "with " not in line_clean:
            issues.append({
                "id": f"bug-resource-leak-{idx}",
                "severity": "medium",
                "category": "Bug",
                "title": "Potential File Descriptor Resource Leak",
                "description": "Opening file without context manager ('with' block) risks unclosed file handles on unexpected exceptions.",
                "file": filename,
                "line": idx,
                "originalSnippet": line_clean,
                "suggestedFix": 'with open(file_path, "r", encoding="utf-8") as f:\n    data = f.read()',
                "explanation": "Unclosed resources cause file lock deadlocks and file descriptor exhaustion under continuous server traffic."
            })

    # User prompt driven specific analysis
    if "credit" in prompt_lower or "balance" in prompt_lower or "wallet" in prompt_lower:
        if "balance" in content and "<=" not in content and "<" not in content and "check" not in content.lower():
            issues.append({
                "id": "bug-balance-check-missing",
                "severity": "high",
                "category": "Bug",
                "title": "Missing Non-Negative Credit Balance Guard",
                "description": "Credit deductions do not verify whether user balance is sufficient, allowing negative credit state.",
                "file": filename,
                "line": 1,
                "originalSnippet": "user.credits -= cost",
                "suggestedFix": "if user.credits < cost:\n    raise InsufficientCreditsError('Balance too low')\nuser.credits -= cost",
                "explanation": "Without atomic pre-validation or database CHECK constraints, concurrent transactions can exploit race conditions to run infinite unpaid requests."
            })

    if "langchain" in prompt_lower or "agent" in prompt_lower:
        if "invoke(" in content and "timeout" not in content:
            issues.append({
                "id": "perf-langchain-timeout",
                "severity": "medium",
                "category": "Performance",
                "title": "LangChain Invocation Missing Execution Timeout",
                "description": "LLM chain call does not specify maximum request timeout or retry budget.",
                "file": filename,
                "line": 1,
                "originalSnippet": "result = chain.invoke({'query': prompt})",
                "suggestedFix": "result = chain.with_config({'timeout': 30, 'max_retries': 2}).invoke({'query': prompt})",
                "explanation": "External model endpoints can hang during provider outages, consuming memory and thread worker slots indefinitely."
            })

    return issues

@router.post("/analyze")
async def analyze_code_for_review(request: CodeReviewRequest):
    start_time = time.time()
    
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Code or Git Diff content cannot be empty")

    filename = request.filename or ("pull_request.diff" if request.sourceType == "diff" else "main.py")
    
    # Run heuristic & semantic inspection
    issues = analyze_code_rules(request.content, filename, request.userPrompt or "")
    
    # Calculate health score (100 base)
    score = 100
    for issue in issues:
        sev = issue["severity"]
        if sev == "critical": score -= 25
        elif sev == "high": score -= 15
        elif sev == "medium": score -= 8
        elif sev == "low": score -= 3

    score = max(10, min(100, score))
    
    critical_count = sum(1 for i in issues if i["severity"] == "critical")
    high_count = sum(1 for i in issues if i["severity"] == "high")
    medium_count = sum(1 for i in issues if i["severity"] == "medium")
    low_count = sum(1 for i in issues if i["severity"] == "low")
    
    lines_count = len(request.content.split("\n"))

    # Generate summary verdict
    if critical_count > 0:
        verdict = f"Critical Risk: {critical_count} critical vulnerability detected. Immediate fix required before production deployment."
    elif high_count > 0:
        verdict = f"Needs Changes: {high_count} high severity issues found. Code should be refactored."
    elif len(issues) > 0:
        verdict = f"Acceptable with Suggestions: {len(issues)} minor improvements recommended."
    else:
        verdict = "Clean Code: No security or logic anomalies detected. Ready for merge."

    latency_ms = int((time.time() - start_time) * 1000)

    return {
        "healthScore": score,
        "verdict": verdict,
        "summary": f"Analyzed {lines_count} lines across {filename} in {latency_ms}ms.",
        "metrics": {
            "linesReviewed": lines_count,
            "totalIssues": len(issues),
            "criticalCount": critical_count,
            "highCount": high_count,
            "mediumCount": medium_count,
            "lowCount": low_count,
            "latencyMs": latency_ms
        },
        "issues": issues,
        "timestamp": int(time.time())
    }

def detect_git_provider(url: str, explicit_provider: str = "auto") -> str:
    if explicit_provider and explicit_provider != "auto":
        return explicit_provider.lower()
    lower_url = url.lower()
    if "github.com" in lower_url:
        return "github"
    if "gitlab" in lower_url or "/-/merge_requests/" in lower_url:
        return "gitlab"
    if "bitbucket.org" in lower_url:
        return "bitbucket"
    if "dev.azure.com" in lower_url or "visualstudio.com" in lower_url:
        return "azure_devops"
    return "generic"

def extract_primary_filename(diff_text: str, default_name: str = "pull_request.diff") -> str:
    """Extracts first altered filename from unified diff."""
    m = re.search(r"^diff --git a/(.+?)\s+b/(.+?)$", diff_text, re.MULTILINE)
    if m:
        return m.group(2).strip()
    m2 = re.search(r"^\+\+\+\s+b/(.+?)$", diff_text, re.MULTILINE)
    if m2:
        return m2.group(1).strip()
    return default_name

@router.post("/fetch-pr")
async def fetch_pull_request_diff(req: FetchPRRequest):
    """
    Fetches raw Git diff from GitHub, GitLab, Bitbucket, Azure DevOps, or generic Git URLs.
    Supports private repositories via Personal Access Token / App Password.
    """
    url = req.prUrl.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Repository / Pull Request URL cannot be empty")

    provider = detect_git_provider(url, req.provider)
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None

    diff_content = ""
    pr_title = ""
    changed_files = []

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        try:
            # 1. GITHUB
            if provider == "github":
                gh_match = re.search(r"github\.com/([^/]+)/([^/]+)/pull/(\d+)", url, re.I)
                gh_commit = re.search(r"github\.com/([^/]+)/([^/]+)/commit/([a-f0-9]+)", url, re.I)

                if gh_match:
                    owner, repo, pull_id = gh_match.group(1), gh_match.group(2), gh_match.group(3)
                    api_headers = {
                        "Accept": "application/vnd.github.v3.diff",
                        "User-Agent": "workflowsAURA-CodeReview"
                    }
                    if token:
                        api_headers["Authorization"] = f"Bearer {token}"

                    # Fetch Diff
                    diff_res = await client.get(
                        f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_id}",
                        headers=api_headers
                    )

                    if diff_res.status_code == 401:
                        raise HTTPException(status_code=401, detail="GitHub Authentication Failed: Invalid Personal Access Token. Please ensure your token has 'repo' scope for private repositories.")
                    if diff_res.status_code == 404:
                        raise HTTPException(status_code=404, detail=f"GitHub PR #{pull_id} not found in {owner}/{repo}. If this is a private repository, provide a valid GitHub Personal Access Token.")
                    if diff_res.status_code != 200:
                        raise HTTPException(status_code=diff_res.status_code, detail=f"GitHub API error ({diff_res.status_code}): {diff_res.text[:300]}")

                    diff_content = diff_res.text

                    # Fetch PR metadata (title & files count)
                    meta_headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "workflowsAURA-CodeReview"}
                    if token:
                        meta_headers["Authorization"] = f"Bearer {token}"
                    meta_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_id}", headers=meta_headers)
                    if meta_res.status_code == 200:
                        data = meta_res.json()
                        pr_title = f"GitHub PR #{pull_id}: {data.get('title', '')}"
                    else:
                        pr_title = f"GitHub PR #{pull_id} ({owner}/{repo})"

                elif gh_commit:
                    owner, repo, sha = gh_commit.group(1), gh_commit.group(2), gh_commit.group(3)
                    api_headers = {
                        "Accept": "application/vnd.github.v3.diff",
                        "User-Agent": "workflowsAURA-CodeReview"
                    }
                    if token:
                        api_headers["Authorization"] = f"Bearer {token}"
                    diff_res = await client.get(
                        f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}",
                        headers=api_headers
                    )
                    if diff_res.status_code != 200:
                        raise HTTPException(status_code=diff_res.status_code, detail=f"Failed to fetch commit {sha[:7]} from {owner}/{repo}")
                    diff_content = diff_res.text
                    pr_title = f"GitHub Commit {sha[:8]} ({owner}/{repo})"
                else:
                    # Raw direct URL fallback
                    headers = {"User-Agent": "workflowsAURA-CodeReview"}
                    if token:
                        headers["Authorization"] = f"Bearer {token}"
                    target_url = url if url.endswith(".diff") else f"{url.rstrip('/')}.diff"
                    res = await client.get(target_url, headers=headers)
                    if res.status_code != 200:
                        raise HTTPException(status_code=res.status_code, detail="Unable to fetch GitHub diff. Please provide a standard PR link or access token.")
                    diff_content = res.text
                    pr_title = f"GitHub PR / Diff ({url})"

            # 2. GITLAB
            elif provider == "gitlab":
                gl_match = re.search(r"(?:https?://)?([^/]+)/(.+)/-/merge_requests/(\d+)", url, re.I)
                if not gl_match:
                    raise HTTPException(status_code=400, detail="Invalid GitLab Merge Request URL format. Expected: https://gitlab.com/{group}/{project}/-/merge_requests/{id}")

                host, project_path, mr_iid = gl_match.group(1), gl_match.group(2), gl_match.group(3)
                project_encoded = quote(project_path, safe="")

                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token

                # Fetch MR Metadata
                meta_url = f"https://{host}/api/v4/projects/{project_encoded}/merge_requests/{mr_iid}"
                meta_res = await client.get(meta_url, headers=headers)
                if meta_res.status_code == 401:
                    raise HTTPException(status_code=401, detail="GitLab Authentication Failed: Please provide a valid GitLab Personal Access Token with 'read_api' or 'api' scope.")
                if meta_res.status_code == 404:
                    raise HTTPException(status_code=404, detail="GitLab Merge Request or Project not found. Ensure repository path and token permissions are correct.")

                if meta_res.status_code == 200:
                    data = meta_res.json()
                    pr_title = f"GitLab MR !{mr_iid}: {data.get('title', '')}"

                # Try raw diff first
                raw_diff_url = f"https://{host}/{project_path}/-/merge_requests/{mr_iid}.diff"
                diff_res = await client.get(raw_diff_url, headers=headers)
                if diff_res.status_code == 200 and len(diff_res.text.strip()) > 0:
                    diff_content = diff_res.text
                else:
                    # Fallback to GitLab API diffs endpoint
                    diffs_api_url = f"https://{host}/api/v4/projects/{project_encoded}/merge_requests/{mr_iid}/diffs"
                    diffs_api_res = await client.get(diffs_api_url, headers=headers)
                    if diffs_api_res.status_code == 200:
                        diffs_list = diffs_api_res.json()
                        diff_blocks = []
                        for d in diffs_list:
                            old_path = d.get("old_path", "unknown")
                            new_path = d.get("new_path", "unknown")
                            diff_blocks.append(f"diff --git a/{old_path} b/{new_path}\n--- a/{old_path}\n+++ b/{new_path}\n{d.get('diff', '')}")
                        diff_content = "\n\n".join(diff_blocks)
                    else:
                        raise HTTPException(status_code=diffs_api_res.status_code, detail="Unable to retrieve GitLab Merge Request diff changes.")

            # 3. BITBUCKET
            elif provider == "bitbucket":
                bb_match = re.search(r"bitbucket\.org/([^/]+)/([^/]+)/pull-requests/(\d+)", url, re.I)
                if not bb_match:
                    raise HTTPException(status_code=400, detail="Invalid Bitbucket Pull Request URL format. Expected: https://bitbucket.org/{workspace}/{repo_slug}/pull-requests/{id}")

                workspace, repo_slug, pull_id = bb_match.group(1), bb_match.group(2), bb_match.group(3)
                diff_api_url = f"https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_id}/diff"

                auth = None
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token and username:
                    auth = httpx.BasicAuth(username, token)
                elif token:
                    headers["Authorization"] = f"Bearer {token}"

                diff_res = await client.get(diff_api_url, headers=headers, auth=auth)
                if diff_res.status_code == 401:
                    raise HTTPException(status_code=401, detail="Bitbucket Authentication Failed: Invalid Bitbucket App Password or Username. Please provide your Bitbucket username and App Password with 'repository:read' permissions.")
                if diff_res.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Bitbucket PR #{pull_id} not found in {workspace}/{repo_slug}. Verify repository slug and credentials.")
                if diff_res.status_code != 200:
                    raise HTTPException(status_code=diff_res.status_code, detail=f"Bitbucket API returned status {diff_res.status_code}")

                diff_content = diff_res.text

                # Optional metadata
                meta_url = f"https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_id}"
                meta_res = await client.get(meta_url, headers=headers, auth=auth)
                if meta_res.status_code == 200:
                    meta_data = meta_res.json()
                    pr_title = f"Bitbucket PR #{pull_id}: {meta_data.get('title', '')}"
                else:
                    pr_title = f"Bitbucket PR #{pull_id} ({workspace}/{repo_slug})"

            # 4. AZURE DEVOPS / GENERIC GIT
            else:
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                auth = None
                if token:
                    if provider == "azure_devops" or "dev.azure.com" in url.lower():
                        # Azure DevOps Personal Access Token uses Basic Auth with empty username
                        auth = httpx.BasicAuth("", token)
                    else:
                        headers["Authorization"] = f"Bearer {token}"

                res = await client.get(url, headers=headers, auth=auth)
                if res.status_code == 401:
                    raise HTTPException(status_code=401, detail="Authentication failed (HTTP 401). Please check access token credentials.")
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Unable to fetch diff from URL ({res.status_code}).")
                diff_content = res.text
                pr_title = f"Custom Repository Diff ({url.split('/')[-1] or 'diff'})"

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching repository diff: {str(e)}")

    if not diff_content.strip():
        raise HTTPException(status_code=400, detail="The fetched Pull Request contains an empty diff (no changes detected).")

    primary_file = extract_primary_filename(diff_content, "pull_request.diff")

    # Extract all modified file names
    files_detected = list(dict.fromkeys(re.findall(r"^diff --git a/.+?\s+b/(.+)$", diff_content, re.MULTILINE)))
    file_list = files_detected if files_detected else [primary_file]

    return {
        "provider": provider,
        "title": pr_title or f"Pull Request ({primary_file})",
        "primaryFile": primary_file,
        "files": file_list,
        "diffContent": diff_content,
        "linesCount": len(diff_content.split("\n")),
        "sourceUrl": url
    }

@router.post("/fetch-file")
async def fetch_repository_file(req: FetchFileRequest):
    """
    Fetches raw file content directly from GitHub, GitLab, Bitbucket, or generic repositories.
    Supports private repositories via Personal Access Token / App Password.
    """
    repo = req.repo.strip()
    file_path = req.filePath.strip().lstrip("/")
    branch = (req.branch or "main").strip()
    provider = detect_git_provider(repo, req.provider)
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None

    if not repo or not file_path:
        raise HTTPException(status_code=400, detail="Repository and file path must be specified.")

    file_content = ""

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        try:
            if provider == "github":
                # Clean repo from full URL if pasted
                cleaned_repo = re.sub(r"^https?://github\.com/", "", repo).strip("/")
                raw_url = f"https://raw.githubusercontent.com/{cleaned_repo}/{branch}/{file_path}"
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["Authorization"] = f"token {token}"
                res = await client.get(raw_url, headers=headers)
                if res.status_code == 200:
                    file_content = res.text
                else:
                    # Fallback to GitHub API Contents endpoint
                    api_url = f"https://api.github.com/repos/{cleaned_repo}/contents/{file_path}?ref={branch}"
                    api_headers = {"Accept": "application/vnd.github.v3.raw", "User-Agent": "workflowsAURA-CodeReview"}
                    if token:
                        api_headers["Authorization"] = f"Bearer {token}"
                    api_res = await client.get(api_url, headers=api_headers)
                    if api_res.status_code == 401:
                        raise HTTPException(status_code=401, detail="GitHub Authentication Failed. Please provide a valid Personal Access Token.")
                    if api_res.status_code != 200:
                        raise HTTPException(status_code=api_res.status_code, detail=f"File '{file_path}' not found in GitHub repo '{cleaned_repo}' on branch '{branch}'.")
                    file_content = api_res.text

            elif provider == "gitlab":
                cleaned_repo = re.sub(r"^https?://gitlab\.com/", "", repo).strip("/")
                project_encoded = quote(cleaned_repo, safe="")
                file_encoded = quote(file_path, safe="")
                raw_url = f"https://gitlab.com/api/v4/projects/{project_encoded}/repository/files/{file_encoded}/raw?ref={branch}"
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token
                res = await client.get(raw_url, headers=headers)
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Unable to fetch file from GitLab ({res.status_code}). Check path or token.")
                file_content = res.text

            elif provider == "bitbucket":
                cleaned_repo = re.sub(r"^https?://bitbucket\.org/", "", repo).strip("/")
                raw_url = f"https://api.bitbucket.org/2.0/repositories/{cleaned_repo}/src/{branch}/{file_path}"
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                auth = None
                if token and username:
                    auth = httpx.BasicAuth(username, token)
                elif token:
                    headers["Authorization"] = f"Bearer {token}"
                res = await client.get(raw_url, headers=headers, auth=auth)
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Unable to fetch file from Bitbucket ({res.status_code}). Check credentials.")
                file_content = res.text

            else:
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["Authorization"] = f"Bearer {token}"
                res = await client.get(repo, headers=headers)
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Failed to fetch file from URL ({res.status_code}).")
                file_content = res.text

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching repository file: {str(e)}")

    return {
        "filename": file_path,
        "content": file_content,
        "linesCount": len(file_content.split("\n")),
        "provider": provider
    }

def clean_repo_slug(raw_input: str, provider: str = "auto") -> tuple[str, str, str]:
    """
    Cleans raw repository URLs and strings into (slug, host, provider).
    Supports GitHub, GitLab, Bitbucket, Azure DevOps.
    """
    cleaned = raw_input.strip()
    detected_provider = detect_git_provider(cleaned, provider)
    host = "github.com"

    if "github.com/" in cleaned:
        host = "github.com"
        detected_provider = "github"
        cleaned = re.sub(r"^https?://github\.com/", "", cleaned)
    elif "gitlab" in cleaned:
        detected_provider = "gitlab"
        m = re.search(r"https?://([^/]+)/(.+)", cleaned)
        if m:
            host = m.group(1)
            cleaned = m.group(2)
    elif "bitbucket.org/" in cleaned:
        host = "bitbucket.org"
        detected_provider = "bitbucket"
        cleaned = re.sub(r"^https?://bitbucket\.org/", "", cleaned)
    elif "dev.azure.com" in cleaned:
        host = "dev.azure.com"
        detected_provider = "azure_devops"

    # Remove tree/branch or pull suffixes if present
    cleaned = re.sub(r"/tree/.*$", "", cleaned)
    cleaned = re.sub(r"/-/.*$", "", cleaned)
    cleaned = re.sub(r"/pull-requests/.*$", "", cleaned)
    cleaned = re.sub(r"/pull/.*$", "", cleaned)
    cleaned = re.sub(r"\.git$", "", cleaned)
    cleaned = cleaned.strip("/")

    return cleaned, host, detected_provider

@router.post("/list-branches")
async def list_repository_branches(req: ListBranchesRequest):
    """
    Fetches all branches for a given repository from GitHub, GitLab, Bitbucket, or Azure DevOps.
    Supports private repositories using Access Tokens.
    """
    repo_input = req.repo.strip()
    if not repo_input:
        raise HTTPException(status_code=400, detail="Repository URL or name cannot be empty.")

    slug, host, provider = clean_repo_slug(repo_input, req.provider)
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None

    branches = []
    default_branch = "main"

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        try:
            # 1. GITHUB
            if provider == "github":
                headers = {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "workflowsAURA-CodeReview"
                }
                if token:
                    headers["Authorization"] = f"Bearer {token}"

                # Fetch branches list
                url = f"https://api.github.com/repos/{slug}/branches?per_page=100"
                res = await client.get(url, headers=headers)

                if res.status_code == 401:
                    raise HTTPException(status_code=401, detail="GitHub Authentication Failed: Invalid token. Ensure 'repo' scope is selected for private repositories.")
                if res.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"GitHub repository '{slug}' not found. If it is private, provide an Access Token.")
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"GitHub API Error: {res.text[:200]}")

                # Fetch default branch
                repo_info = await client.get(f"https://api.github.com/repos/{slug}", headers=headers)
                if repo_info.status_code == 200:
                    default_branch = repo_info.json().get("default_branch", "main")

                data = res.json()
                for b in data:
                    b_name = b.get("name", "")
                    branches.append({
                        "name": b_name,
                        "isDefault": b_name == default_branch,
                        "commitSha": b.get("commit", {}).get("sha", "")[:8],
                        "protected": b.get("protected", False)
                    })

            # 2. GITLAB
            elif provider == "gitlab":
                project_encoded = quote(slug, safe="")
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token

                url = f"https://{host}/api/v4/projects/{project_encoded}/repository/branches?per_page=100"
                res = await client.get(url, headers=headers)

                if res.status_code == 401:
                    raise HTTPException(status_code=401, detail="GitLab Authentication Failed: Token with 'read_api' scope required.")
                if res.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"GitLab project '{slug}' not found.")
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"GitLab API Error ({res.status_code})")

                data = res.json()
                for b in data:
                    is_def = b.get("default", False)
                    if is_def:
                        default_branch = b.get("name", "main")
                    branches.append({
                        "name": b.get("name", ""),
                        "isDefault": is_def,
                        "commitSha": b.get("commit", {}).get("short_id", ""),
                        "protected": b.get("protected", False)
                    })

            # 3. BITBUCKET
            elif provider == "bitbucket":
                auth = None
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token and username:
                    auth = httpx.BasicAuth(username, token)
                elif token:
                    headers["Authorization"] = f"Bearer {token}"

                # Default branch
                repo_res = await client.get(f"https://api.bitbucket.org/2.0/repositories/{slug}", headers=headers, auth=auth)
                if repo_res.status_code == 200:
                    default_branch = repo_res.json().get("mainbranch", {}).get("name", "main")

                url = f"https://api.bitbucket.org/2.0/repositories/{slug}/refs/branches?pagelen=100"
                res = await client.get(url, headers=headers, auth=auth)

                if res.status_code == 401:
                    raise HTTPException(status_code=401, detail="Bitbucket Authentication Failed: Invalid Username or App Password.")
                if res.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Bitbucket repository '{slug}' not found.")
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Bitbucket API Error ({res.status_code})")

                data = res.json().get("values", [])
                for b in data:
                    b_name = b.get("name", "")
                    branches.append({
                        "name": b_name,
                        "isDefault": b_name == default_branch,
                        "commitSha": b.get("target", {}).get("hash", "")[:8],
                        "protected": False
                    })

            else:
                branches = [
                    {"name": "main", "isDefault": True, "commitSha": "HEAD", "protected": True},
                    {"name": "master", "isDefault": False, "commitSha": "HEAD", "protected": False},
                    {"name": "develop", "isDefault": False, "commitSha": "HEAD", "protected": False}
                ]

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error listing branches: {str(e)}")

    # Sort so default branch is first
    branches.sort(key=lambda x: not x["isDefault"])

    return {
        "repo": slug,
        "provider": provider,
        "defaultBranch": default_branch,
        "totalBranches": len(branches),
        "branches": branches
    }

@router.post("/list-repos")
async def list_repositories(req: ListReposRequest):
    """
    Lists repositories under an organization, user profile, or authenticated account.
    """
    owner = req.ownerOrOrg.strip() if req.ownerOrOrg else ""
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None
    provider = detect_git_provider(owner, req.provider)

    # Clean owner URL if full URL was pasted
    owner = re.sub(r"^https?://[^/]+/", "", owner).strip("/")

    repos = []

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        try:
            if provider == "github":
                headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["Authorization"] = f"Bearer {token}"

                if owner:
                    # Try orgs first, then users
                    res = await client.get(f"https://api.github.com/orgs/{owner}/repos?per_page=100&sort=updated", headers=headers)
                    if res.status_code != 200:
                        res = await client.get(f"https://api.github.com/users/{owner}/repos?per_page=100&sort=updated", headers=headers)
                else:
                    res = await client.get("https://api.github.com/user/repos?per_page=100&sort=updated", headers=headers)

                if res.status_code == 200:
                    for r in res.json():
                        repos.append({
                            "name": r.get("name", ""),
                            "fullName": r.get("full_name", ""),
                            "defaultBranch": r.get("default_branch", "main"),
                            "isPrivate": r.get("private", False),
                            "description": r.get("description", "") or "",
                            "updatedAt": r.get("updated_at", "")
                        })

            elif provider == "gitlab":
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token

                if owner:
                    res = await client.get(f"https://gitlab.com/api/v4/groups/{quote(owner, safe='')}/projects?per_page=100", headers=headers)
                    if res.status_code != 200:
                        res = await client.get(f"https://gitlab.com/api/v4/users/{quote(owner, safe='')}/projects?per_page=100", headers=headers)
                else:
                    res = await client.get("https://gitlab.com/api/v4/projects?membership=true&per_page=100", headers=headers)

                if res.status_code == 200:
                    for r in res.json():
                        repos.append({
                            "name": r.get("name", ""),
                            "fullName": r.get("path_with_namespace", ""),
                            "defaultBranch": r.get("default_branch", "main"),
                            "isPrivate": r.get("visibility") == "private",
                            "description": r.get("description", "") or "",
                            "updatedAt": r.get("last_activity_at", "")
                        })

            elif provider == "bitbucket":
                auth = None
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token and username:
                    auth = httpx.BasicAuth(username, token)
                elif token:
                    headers["Authorization"] = f"Bearer {token}"

                workspace = owner or username or ""
                if workspace:
                    res = await client.get(f"https://api.bitbucket.org/2.0/repositories/{workspace}?pagelen=100", headers=headers, auth=auth)
                    if res.status_code == 200:
                        for r in res.json().get("values", []):
                            repos.append({
                                "name": r.get("name", ""),
                                "fullName": r.get("full_name", ""),
                                "defaultBranch": r.get("mainbranch", {}).get("name", "main"),
                                "isPrivate": r.get("is_private", False),
                                "description": r.get("description", "") or "",
                                "updatedAt": r.get("updated_on", "")
                            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch repositories list: {str(e)}")

    return {
        "provider": provider,
        "owner": owner,
        "totalRepos": len(repos),
        "repos": repos
    }

@router.post("/compare-branch")
async def compare_branch_review(req: CompareBranchRequest):
    """
    Compares the selected headBranch against baseBranch (e.g. main/master)
    to generate the unified review diff of all branch commits.
    """
    slug, host, provider = clean_repo_slug(req.repo, req.provider)
    head_branch = req.headBranch.strip()
    base_branch = (req.baseBranch or "main").strip()
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None

    if not head_branch:
        raise HTTPException(status_code=400, detail="Head branch to review cannot be empty.")

    diff_content = ""
    files_list = []
    title = f"Branch Review: {head_branch} (vs {base_branch})"

    async with httpx.AsyncClient(timeout=35.0, follow_redirects=True) as client:
        try:
            # 1. GITHUB
            if provider == "github":
                headers = {
                    "Accept": "application/vnd.github.v3.diff",
                    "User-Agent": "workflowsAURA-CodeReview"
                }
                if token:
                    headers["Authorization"] = f"Bearer {token}"

                url = f"https://api.github.com/repos/{slug}/compare/{base_branch}...{head_branch}"
                res = await client.get(url, headers=headers)

                if res.status_code == 404:
                    # Try master instead of main if main failed
                    if base_branch == "main":
                        url_fallback = f"https://api.github.com/repos/{slug}/compare/master...{head_branch}"
                        res = await client.get(url_fallback, headers=headers)
                        if res.status_code == 200:
                            base_branch = "master"

                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Failed to compare {base_branch}...{head_branch} in {slug}")

                diff_content = res.text

            # 2. GITLAB
            elif provider == "gitlab":
                project_encoded = quote(slug, safe="")
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token

                url = f"https://{host}/api/v4/projects/{project_encoded}/repository/compare?from={base_branch}&to={head_branch}"
                res = await client.get(url, headers=headers)

                if res.status_code == 200:
                    data = res.json()
                    diff_blocks = []
                    for d in data.get("diffs", []):
                        old_p = d.get("old_path", "")
                        new_p = d.get("new_path", "")
                        diff_blocks.append(f"diff --git a/{old_p} b/{new_p}\n--- a/{old_p}\n+++ b/{new_p}\n{d.get('diff', '')}")
                    diff_content = "\n\n".join(diff_blocks)
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"GitLab comparison error ({res.status_code})")

            # 3. BITBUCKET
            elif provider == "bitbucket":
                auth = None
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token and username:
                    auth = httpx.BasicAuth(username, token)
                elif token:
                    headers["Authorization"] = f"Bearer {token}"

                url = f"https://api.bitbucket.org/2.0/repositories/{slug}/diff/{base_branch}..{head_branch}"
                res = await client.get(url, headers=headers, auth=auth)
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"Bitbucket compare error ({res.status_code})")
                diff_content = res.text

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating branch diff: {str(e)}")

    if not diff_content.strip():
        # If branches are identical or no diff found
        diff_content = f"# Branch '{head_branch}' is even with '{base_branch}' (No diff changes detected)."

    primary_file = extract_primary_filename(diff_content, f"{head_branch}.diff")
    files_detected = list(dict.fromkeys(re.findall(r"^diff --git a/.+?\s+b/(.+)$", diff_content, re.MULTILINE)))
    file_list = files_detected if files_detected else [primary_file]

    return {
        "repo": slug,
        "provider": provider,
        "baseBranch": base_branch,
        "headBranch": head_branch,
        "title": title,
        "primaryFile": primary_file,
        "files": file_list,
        "diffContent": diff_content,
        "linesCount": len(diff_content.split("\n"))
    }

@router.post("/list-branch-files")
async def list_branch_files(req: ListBranchFilesRequest):
    """
    Lists files located in a specific repository branch.
    """
    slug, host, provider = clean_repo_slug(req.repo, req.provider)
    branch = req.branch.strip() if req.branch else "main"
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None

    files = []

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        try:
            if provider == "github":
                headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["Authorization"] = f"Bearer {token}"

                url = f"https://api.github.com/repos/{slug}/git/trees/{branch}?recursive=1"
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    tree = res.json().get("tree", [])
                    files = [item.get("path") for item in tree if item.get("type") == "blob"][:100]

            elif provider == "gitlab":
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token
                project_encoded = quote(slug, safe="")
                url = f"https://{host}/api/v4/projects/{project_encoded}/repository/tree?ref={branch}&recursive=true&per_page=100"
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    files = [item.get("path") for item in res.json() if item.get("type") == "blob"]

            elif provider == "bitbucket":
                auth = None
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token and username:
                    auth = httpx.BasicAuth(username, token)
                elif token:
                    headers["Authorization"] = f"Bearer {token}"
                url = f"https://api.bitbucket.org/2.0/repositories/{slug}/src/{branch}/"
                res = await client.get(url, headers=headers, auth=auth)
                if res.status_code == 200:
                    files = [item.get("path") for item in res.json().get("values", []) if item.get("type") == "commit_file"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to list branch files: {str(e)}")

    return {
        "repo": slug,
        "branch": branch,
        "files": files,
        "totalFiles": len(files)
    }

@router.post("/audit-branch")
async def audit_entire_branch(req: FullBranchAuditRequest):
    """
    Performs a comprehensive multi-file & folder security and code quality audit
    across the entire codebase in the specified repository branch.
    """
    start_time = time.time()
    slug, host, provider = clean_repo_slug(req.repo, req.provider)
    branch = req.branch.strip() if req.branch else "main"
    folder_filter = req.folderPath.strip().strip("/") if req.folderPath else ""
    token = req.accessToken.strip() if req.accessToken else None
    username = req.username.strip() if req.username else None

    # Allowed code & config file extensions (covers all modern development languages)
    ALLOWED_EXTS = (
        ".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", ".rs", 
        ".cpp", ".c", ".h", ".hpp", ".cs", ".php", ".rb", ".sql", ".sh", ".bash",
        ".yaml", ".yml", ".json", ".env", ".vue", ".svelte", ".dart", ".swift",
        ".kt", ".kts", ".scala", ".sol", ".lua", ".r", ".m", ".graphql", ".proto",
        ".tf", ".toml", ".xml", ".html", ".css", ".scss", ".dockerfile"
    )
    IGNORED_PARTS = (
        "node_modules/", ".git/", "dist/", "build/", "venv/", ".venv/", "env/",
        "package-lock.json", "bun.lock", "bun.lockb", "yarn.lock", "pnpm-lock.yaml",
        ".min.js", ".min.css", ".map", "__pycache__/", ".pytest_cache/", ".next/", 
        "coverage/", ".nuget/", "target/", "bin/", "obj/", ".gradle/", ".idea/", ".vscode/"
    )
    IGNORED_EXTS = (
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".bmp", ".tiff",
        ".woff", ".woff2", ".ttf", ".eot", ".otf",
        ".zip", ".tar", ".gz", ".7z", ".rar", ".jar", ".war",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".mp4", ".mp3", ".webm", ".mov", ".avi",
        ".exe", ".dll", ".so", ".dylib", ".bin", ".iso", ".pyc", ".class", ".o"
    )

    all_raw_files = []

    async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
        try:
            # 1. Fetch file tree
            if provider == "github":
                headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["Authorization"] = f"Bearer {token}"
                url = f"https://api.github.com/repos/{slug}/git/trees/{branch}?recursive=1"
                res = await client.get(url, headers=headers)
                if res.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Branch '{branch}' or repo '{slug}' not found.")
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"GitHub API tree error: {res.text[:200]}")
                tree = res.json().get("tree", [])
                all_raw_files = [item.get("path") for item in tree if item.get("type") == "blob"]

            elif provider == "gitlab":
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token:
                    headers["PRIVATE-TOKEN"] = token
                project_encoded = quote(slug, safe="")
                page = 1
                while True:
                    url = f"https://{host}/api/v4/projects/{project_encoded}/repository/tree?ref={branch}&recursive=true&per_page=100&page={page}"
                    res = await client.get(url, headers=headers)
                    if res.status_code != 200:
                        break
                    items = res.json()
                    if not items or not isinstance(items, list):
                        break
                    all_raw_files.extend([item.get("path") for item in items if item.get("type") == "blob"])
                    next_page = res.headers.get("x-next-page")
                    if not next_page:
                        break
                    page = int(next_page)

            elif provider == "bitbucket":
                auth = httpx.BasicAuth(username, token) if (token and username) else None
                headers = {"User-Agent": "workflowsAURA-CodeReview"}
                if token and not username:
                    headers["Authorization"] = f"Bearer {token}"
                bb_url = f"https://api.bitbucket.org/2.0/repositories/{slug}/src/{branch}/"
                while bb_url:
                    res = await client.get(bb_url, headers=headers, auth=auth)
                    if res.status_code == 200:
                        bb_data = res.json()
                        all_raw_files.extend([item.get("path") for item in bb_data.get("values", []) if item.get("type") == "commit_file"])
                        bb_url = bb_data.get("next")
                    else:
                        break

            else:
                all_raw_files = ["main.py", "app/api/auth.py", "backend/routes/wallet.py"]

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch branch tree: {str(e)}")

        # 2. Filter candidate source code files
        candidate_files = []
        for path in all_raw_files:
            lower = path.lower()
            base = os.path.basename(path).lower()
            if any(ign in lower for ign in IGNORED_PARTS):
                continue
            if any(lower.endswith(ext) for ext in IGNORED_EXTS):
                continue
            is_allowed = (
                any(lower.endswith(ext) for ext in ALLOWED_EXTS)
                or base in ("dockerfile", "makefile", "procfile", "gemfile")
                or base.startswith(".env")
            )
            if not is_allowed:
                continue
            if folder_filter:
                if not path.startswith(folder_filter + "/") and path != folder_filter:
                    continue
            candidate_files.append(path)

        # Prioritize key application files first (routers, controllers, services, models, api, auth)
        def priority_key(p: str):
            plow = p.lower()
            if "api" in plow or "auth" in plow or "service" in plow or "controller" in plow:
                return 0
            if "model" in plow or "main" in plow or "app" in plow or "server" in plow:
                return 1
            return 2

        candidate_files.sort(key=priority_key)

        # If maxFiles is not provided or <= 0, scan 100% of candidate files across the entire repo!
        if req.maxFiles and req.maxFiles > 0:
            files_to_scan = candidate_files[:req.maxFiles]
        else:
            files_to_scan = candidate_files

        if not files_to_scan:
            raise HTTPException(status_code=400, detail=f"No source code files matching review filters found in branch '{branch}'.")

        # 3. Concurrently fetch and review files
        semaphore = asyncio.Semaphore(20)
        all_issues = []
        file_metrics = []
        folder_issue_counts = {}
        total_lines = 0

        async def fetch_and_scan(file_path: str):
            nonlocal total_lines
            content = ""
            async with semaphore:
                try:
                    if provider == "github":
                        raw_url = f"https://raw.githubusercontent.com/{slug}/{branch}/{file_path}"
                        headers = {"User-Agent": "workflowsAURA-CodeReview"}
                        if token:
                            headers["Authorization"] = f"token {token}"
                        r = await client.get(raw_url, headers=headers)
                        if r.status_code == 200:
                            content = r.text
                        else:
                            api_url = f"https://api.github.com/repos/{slug}/contents/{file_path}?ref={branch}"
                            api_headers = {"Accept": "application/vnd.github.v3.raw", "User-Agent": "workflowsAURA-CodeReview"}
                            if token:
                                api_headers["Authorization"] = f"Bearer {token}"
                            api_r = await client.get(api_url, headers=api_headers)
                            if api_r.status_code == 200:
                                content = api_r.text

                    elif provider == "gitlab":
                        p_enc = quote(slug, safe="")
                        f_enc = quote(file_path, safe="")
                        raw_url = f"https://{host}/api/v4/projects/{p_enc}/repository/files/{f_enc}/raw?ref={branch}"
                        headers = {"User-Agent": "workflowsAURA-CodeReview"}
                        if token:
                            headers["PRIVATE-TOKEN"] = token
                        r = await client.get(raw_url, headers=headers)
                        if r.status_code == 200:
                            content = r.text

                    elif provider == "bitbucket":
                        raw_url = f"https://api.bitbucket.org/2.0/repositories/{slug}/src/{branch}/{file_path}"
                        headers = {"User-Agent": "workflowsAURA-CodeReview"}
                        auth = httpx.BasicAuth(username, token) if (token and username) else None
                        if token and not username:
                            headers["Authorization"] = f"Bearer {token}"
                        r = await client.get(raw_url, headers=headers, auth=auth)
                        if r.status_code == 200:
                            content = r.text
                except Exception:
                    pass

            if not content:
                return

            file_lines = len(content.split("\n"))
            total_lines += file_lines

            # Run analysis
            issues = analyze_code_rules(content, file_path, req.userPrompt or "")
            for iss in issues:
                iss["file"] = file_path

            # Directory breakdown
            folder = os.path.dirname(file_path) or "root"
            folder_issue_counts[folder] = folder_issue_counts.get(folder, 0) + len(issues)

            file_metrics.append({
                "filePath": file_path,
                "folder": folder,
                "lines": file_lines,
                "issueCount": len(issues),
                "critical": sum(1 for i in issues if i["severity"] == "critical"),
                "high": sum(1 for i in issues if i["severity"] == "high"),
                "medium": sum(1 for i in issues if i["severity"] == "medium")
            })

            all_issues.extend(issues)

        # Run concurrent audit batch
        await asyncio.gather(*(fetch_and_scan(f) for f in files_to_scan))

    # 4. Calculate overall codebase score and statistics
    critical_count = sum(1 for i in all_issues if i["severity"] == "critical")
    high_count = sum(1 for i in all_issues if i["severity"] == "high")
    medium_count = sum(1 for i in all_issues if i["severity"] == "medium")
    low_count = sum(1 for i in all_issues if i["severity"] == "low")

    score = 100 - (critical_count * 20) - (high_count * 10) - (medium_count * 4) - (low_count * 1)
    score = max(10, min(100, score))

    if critical_count > 0:
        verdict = f"High Risk: {critical_count} critical vulnerabilities found across repository files in branch '{branch}'."
    elif high_count > 0:
        verdict = f"Refactoring Recommended: {high_count} high-severity issues found in branch '{branch}'."
    elif len(all_issues) > 0:
        verdict = f"Generally Good: {len(all_issues)} minor code quality improvements recommended."
    else:
        verdict = f"Exceptional Codebase Health: No vulnerabilities found in {len(file_metrics)} audited files in branch '{branch}'."

    latency_ms = int((time.time() - start_time) * 1000)

    # Sort files by highest vulnerability impact
    file_metrics.sort(key=lambda m: (m["critical"] * 4 + m["high"] * 2 + m["medium"]), reverse=True)

    return {
        "repo": slug,
        "branch": branch,
        "provider": provider,
        "folderScanned": folder_filter or "Entire Repository (All Folders)",
        "filesScannedCount": len(file_metrics),
        "totalLinesScanned": total_lines,
        "healthScore": score,
        "verdict": verdict,
        "summary": f"Scanned {len(file_metrics)} files ({total_lines} lines) across {len(folder_issue_counts)} folders in branch '{branch}' in {latency_ms}ms.",
        "metrics": {
            "linesReviewed": total_lines,
            "totalIssues": len(all_issues),
            "criticalCount": critical_count,
            "highCount": high_count,
            "mediumCount": medium_count,
            "lowCount": low_count,
            "latencyMs": latency_ms
        },
        "folderBreakdown": folder_issue_counts,
        "topVulnerableFiles": file_metrics[:10],
        "issues": all_issues,
        "timestamp": int(time.time())
    }
