# ⚡ workflowsAURA & AI Platform - Full Setup & Run Guide

Welcome to **workflowsAURA**, an enterprise-grade AI Automation Platform featuring **Multi-Agent Orchestration**, **RAG Knowledge Base**, **WhatsApp & Email Automations**, **Database Tools**, and full integration with the **Official LangFlow Studio Microservice**.

---

## 🏗️ Architecture Overview

```
                      +------------------------------------------+
                      |         workflowsAURA Frontend           |
                      |   React 19 + Vite + Tailwind (Port 5174) |
                      +--------------------+---------------------+
                                           |
                                  +--------+--------+
                                  |                 |
                                  v                 v
           +----------------------+------+   +------+-----------------------+
           |   workflowsAURA Backend      |   |  Official LangFlow Frontend  |
           |  FastAPI + Python (Port 8000)|   |     Vite (Port 3001)          |
           +--------------+---------------+   +--------------+--------------+
                          |                                  |
                          +----------------+-----------------+
                                           |
                                           v
                        +------------------+-------------------+
                        |   Official LangFlow Backend Engine   |
                        |   Uvicorn / FastAPI (Port 7860)      |
                        +--------------------------------------+
```

---

## 🚀 Step-by-Step Launch Instructions

To run the complete platform, execute the following 3 commands in separate terminal windows:

### 1️⃣ Start the FastAPI Backend (`Port 8000`)
```powershell
cd AI-Application\backend
python -m uvicorn app.main:app --reload --port 8000
```
- **Health Check**: `http://localhost:8000/api/v1/health`

---

### 2️⃣ Start the Official LangFlow Microservice (`Port 7860` & `Port 3001`)

**Backend Server (`Port 7860`):**
```powershell
cd langflow\src\backend\base
python -m uvicorn langflow.main:create_app --factory --host 0.0.0.0 --port 7860
```
- **Health Check**: `http://localhost:7860/health`

**Frontend UI (`Port 3001`):**
```powershell
cd langflow\src\frontend
npx vite --port 3001
```
- **Direct Access**: `http://localhost:3001`

---

### 3️⃣ Start the main workflowsAURA Web App (`Port 5174`)
```powershell
cd AI-Application
npm run dev -- --port 5174
```
- **Application URL**: `http://localhost:5174`

---

## 💡 Key Features Implemented

1. **workflowsAURA Canvas**:
   - 2D Spatial Movable Node Layout (Drag, reorder, move left/right).
   - Parallel Multi-Agent Execution (Fan-out to multiple LLMs simultaneously + Merge Join Arbitrator).
   - Integrated Python execution script nodes, PostgreSQL/MySQL database query tools, WhatsApp Cloud API senders, and Gmail IMAP/SMTP dispatchers.
2. **Embedded LangFlow Studio Microservice**:
   - Seamlessly embedded inside `workflowsAURA` with 1-click View Mode tab toggle.
3. **Multi-Agent AI Studio (`ChatView`)**:
   - Model switching between Local Ollama (Qwen 2.5 Coder), Cloud Reasoning (Gemini 2.5 Flash), and Claude 3.5 Sonnet.
4. **API Key & Credentials Manager (`ApiKeyManagerView`)**:
   - Secure management for WhatsApp Meta Access Tokens, Gmail OAuth, Database URIs, and LLM Provider Keys.
5. **Analytics & Admin Console (`AdminConsoleView` & `AnalyticsView`)**:
   - Live token usage charts, system health metrics, and audit logs.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Backend**: Python 3.12, FastAPI, SQLModel, Alembic, SQLite
- **Microservice**: Official LangFlow Engine
