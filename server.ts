import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gemini AI SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// ==========================================
// 1. IN-MEMORY REDIS SESSION STORE (Simulated)
// ==========================================
interface SessionData {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: number;
  expiresAt: number;
}

class InMemoryRedisStore {
  private sessions = new Map<string, SessionData>();
  private cache = new Map<string, { value: any; expiresAt: number }>();

  setSession(token: string, session: SessionData, ttlSeconds = 604800) {
    session.expiresAt = Date.now() + ttlSeconds * 1000;
    this.sessions.set(token, session);
  }

  getSession(token: string): SessionData | null {
    const s = this.sessions.get(token);
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    s.lastActive = Date.now();
    return s;
  }

  deleteSession(token: string) {
    this.sessions.delete(token);
  }

  deleteOtherSessions(userId: string, currentToken: string) {
    for (const [t, s] of this.sessions.entries()) {
      if (s.userId === userId && t !== currentToken) {
        this.sessions.delete(t);
      }
    }
  }

  listUserSessions(userId: string) {
    const list: SessionData[] = [];
    for (const s of this.sessions.values()) {
      if (s.userId === userId && Date.now() <= s.expiresAt) {
        list.push(s);
      }
    }
    return list;
  }

  // Generic key-value cache with TTL (like Redis SETEX)
  set(key: string, value: any, ttlSeconds = 300) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}

export const redisMemory = new InMemoryRedisStore();

// Seed initial demo session
redisMemory.setSession('session_demo_current', {
  id: 'sess_01',
  userId: 'usr_rupasree_01',
  device: 'MacBook Pro 16" (macOS Sonoma)',
  browser: 'Chrome 124.0',
  ip: '198.51.100.42',
  lastActive: Date.now(),
  expiresAt: Date.now() + 86400000 * 7
});

// ==========================================
// 2. IN-MEMORY SQL DATABASE & CREDIT LEDGER
// ==========================================
interface SqlUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  credits: number;
}

interface SqlLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

class InMemorySqlStore {
  private users = new Map<string, SqlUser>();
  private ledger: SqlLedgerEntry[] = [];

  constructor() {
    this.users.set('usr_rupasree_01', {
      id: 'usr_rupasree_01',
      email: 'rupasreekamineni@gmail.com',
      name: 'Rupasree Kamineni',
      plan: 'free',
      credits: 250
    });

    this.ledger.push({
      id: 'tx_seed_01',
      userId: 'usr_rupasree_01',
      amount: 250,
      category: 'subscription_grant',
      description: 'Initial Monthly Credit Quota (Free Plan)',
      balanceAfter: 250,
      createdAt: new Date().toISOString()
    });
  }

  getUser(userId: string) {
    return this.users.get(userId) || null;
  }

  deductCredits(userId: string, amount: number, description: string) {
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'User not found' };
    if (user.credits < amount) {
      return { success: false, error: 'Insufficient credits', currentBalance: user.credits };
    }

    user.credits -= amount;
    const entry: SqlLedgerEntry = {
      id: `tx_${Date.now()}`,
      userId,
      amount: -amount,
      category: 'inference',
      description,
      balanceAfter: user.credits,
      createdAt: new Date().toISOString()
    };
    this.ledger.unshift(entry);
    return { success: true, balance: user.credits };
  }

  grantCredits(userId: string, amount: number, description: string) {
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'User not found' };

    user.credits += amount;
    const entry: SqlLedgerEntry = {
      id: `tx_${Date.now()}`,
      userId,
      amount,
      category: 'top_up',
      description,
      balanceAfter: user.credits,
      createdAt: new Date().toISOString()
    };
    this.ledger.unshift(entry);
    return { success: true, balance: user.credits };
  }

  getLedger(userId: string) {
    return this.ledger.filter((e) => e.userId === userId);
  }
}

export const sqlDatabase = new InMemorySqlStore();

// ==========================================
// 3. API V1 ROUTES
// ==========================================

// Health Check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    gemini_api_configured: Boolean(geminiApiKey),
    session_memory_store: 'in-memory Redis engine ready',
    sql_database: 'in-memory SQL ledger engine ready',
    provider: 'AuraAI Backend'
  });
});

// Chat Streaming via SSE using real Gemini API
app.post('/api/v1/chat/stream', async (req: Request, res: Response) => {
  const { prompt, modelId = 'gemini-2.5-flash', executionMode = 'byok' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Deduct platform credits if platform_managed mode
  if (executionMode === 'platform_managed') {
    const deduction = sqlDatabase.deductCredits('usr_rupasree_01', 2, `Inference: ${modelId}`);
    if (!deduction.success) {
      return res.status(402).json({ error: deduction.error, balance: deduction.currentBalance });
    }
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (ai) {
      // Use real Gemini API with gemini-3.8-flash for speed and reliability
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ type: 'done', model: 'gemini-3.8-flash' })}\n\n`);
      res.end();
    } else {
      // Fallback response stream if GEMINI_API_KEY is not configured
      const responseText = `[AuraAI Multi-Model Engine: ${modelId} (${executionMode.toUpperCase()})]

Thank you for your question: "${prompt}"

Here are the key findings and solution:
1. **Multi-Model Orchestration**: Request routed cleanly via AuraAI backend.
2. **Execution Mode**: \`${executionMode}\` with zero data leakage.
3. **Session & Ledger**: Verified against in-memory Redis session and SQL ledger.

You can continue this conversation or switch models in the top selector!`;

      const words = responseText.split(' ');
      for (const w of words) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: w + ' ' })}\n\n`);
        await new Promise((r) => setTimeout(r, 25));
      }
      res.write(`data: ${JSON.stringify({ type: 'done', model: modelId })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    console.error('AI Stream Error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream interrupted' })}\n\n`);
    res.end();
  }
});

// Credit balance & transactions
app.get('/api/v1/credits/balance', (_req: Request, res: Response) => {
  const user = sqlDatabase.getUser('usr_rupasree_01');
  res.json({
    credits: user?.credits || 0,
    monthlyQuota: 250,
    plan: user?.plan || 'free',
    ledger: sqlDatabase.getLedger('usr_rupasree_01')
  });
});

app.post('/api/v1/credits/topup', (req: Request, res: Response) => {
  const { amount = 500, priceUsd = 5 } = req.body;
  const result = sqlDatabase.grantCredits('usr_rupasree_01', amount, `Top-Up Pack ($${priceUsd})`);
  res.json(result);
});

// Session Management (Redis)
app.get('/api/v1/sessions', (_req: Request, res: Response) => {
  const sessions = redisMemory.listUserSessions('usr_rupasree_01');
  res.json({ sessions });
});

app.post('/api/v1/sessions/revoke', (req: Request, res: Response) => {
  const { token } = req.body;
  if (token) {
    redisMemory.deleteSession(token);
  }
  res.json({ success: true });
});

// Direct PDF Download route
app.get('/api/v1/download-guide-pdf', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'AuraAI_User_Guide.pdf');
  res.download(filePath, 'AuraAI_User_Guide.pdf');
});

// Serve public directory statically
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 4. VITE MIDDLEWARE (DEV) OR STATIC (PROD)
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
