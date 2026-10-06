# 🌐 100% Free Deployment Blueprint - workflowsAURA

This guide provides step-by-step instructions to deploy the complete **workflowsAURA** platform for **100% FREE** with **zero hosting costs**, using top-tier developer platforms:

| Component | Free Cloud Provider | Free Tier Benefits | Live Production URL Format |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Vercel** | Unlimited bandwidth, global CDN, auto-deploy from GitHub | `https://workflowsaura.vercel.app` |
| **FastAPI Backend** | **Render.com** | 750 free web service hours/month, automatic SSL | `https://workflowsaura-backend.onrender.com` |
| **LangFlow Microservice** | **Hugging Face Spaces** | Free Docker hosting (2 vCPU, 16 GB RAM) | `https://yourusername-langflow.hf.space` |
| **Database** | **Neon PostgreSQL** | Free serverless PostgreSQL (0.5 GB storage, 100% free) | `postgresql://user:pass@ep-xyz.neon.tech/db` |

---

## 🛠️ Step 1: Deploy LangFlow Microservice (Hugging Face Spaces - FREE)

1. Create a free account at [HuggingFace.co](https://huggingface.co).
2. Click **New Space** -> Choose Space Name: `workflowsaura-langflow`.
3. Select **Space SDK**: **Docker** (Blank).
4. Clone your space repository locally or push your `langflow/` directory:
   ```bash
   git init
   git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/workflowsaura-langflow
   git add Dockerfile src/
   git commit -m "Deploy LangFlow Microservice"
   git push origin main
   ```
5. Hugging Face will automatically build your Docker container and give you a public HTTPS URL:
   `https://YOUR_USERNAME-workflowsaura-langflow.hf.space`

---

## 🛠️ Step 2: Deploy FastAPI Backend (Render.com - FREE)

1. Create a free account at [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing the `AI-Application/backend` code.
4. Set the following settings:
   - **Environment**: `Python 3`
   - **Root Directory**: `AI-Application/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**.
6. Render will assign you a live HTTPS backend URL:
   `https://workflowsaura-backend.onrender.com`

---

## 🛠️ Step 3: Deploy Frontend UI (Vercel - FREE)

1. Create a free account at [Vercel.com](https://vercel.com).
2. Click **Add New** -> **Project** -> Import your GitHub repository.
3. Select root directory: `AI-Application`.
4. Set Framework Preset: **Vite**.
5. Add Environment Variables (optional):
   - `VITE_API_URL`: `https://workflowsaura-backend.onrender.com`
   - `VITE_LANGFLOW_URL`: `https://YOUR_USERNAME-workflowsaura-langflow.hf.space`
6. Click **Deploy**. Vercel will generate your live production URL:
   `https://workflowsaura.vercel.app`

---

## ⚡ Alternative: Instant Free Live Tunnel (Zero Cloud Setup)

If you want to give a live demo **right now** directly from your machine without uploading code:

1. Install free **Cloudflare Tunnel (`cloudflared`)** or **ngrok**:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Start an instant HTTPS tunnel to your local app:
   ```powershell
   cloudflared tunnel --url http://localhost:5174
   ```
3. Cloudflare will output a live global HTTPS URL (e.g. `https://random-words.trycloudflare.com`) that anyone in the world can visit!

---

## 🔒 Free Database Setup (Neon Serverless Postgres)

1. Sign up for a free database at [Neon.tech](https://neon.tech).
2. Create a database named `workflowsaura_db`.
3. Copy the Postgres Connection URI string into your **`ApiKeyManagerView`** inside the app.
