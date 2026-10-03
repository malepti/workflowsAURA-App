import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 16;
const contentWidth = pageWidth - margin * 2;

let y = margin;

function checkPageBreak(neededHeight = 25) {
  if (y + neededHeight > pageHeight - margin) {
    doc.addPage();
    y = margin + 8;
    // Header on every page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 150, 165);
    doc.text('AuraAI — Multi-Model AI Chat Platform | UI User Guide', margin, margin);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, margin, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
    y += 4;
  }
}

// ------------------------------------
// COVER / TITLE SECTION
// ------------------------------------
doc.setFillColor(79, 70, 229); // Indigo 600
doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(255, 255, 255);
doc.text('AuraAI — Application User Guide', margin + 6, y + 12);

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(224, 231, 255);
doc.text('Step-by-Step UI Manual: How to Use Every Feature & Why It Is Useful', margin + 6, y + 20);

doc.setFontSize(8);
doc.setTextColor(199, 210, 254);
doc.text('Official User Documentation • Version 1.2 • Light Theme Architecture', margin + 6, y + 27);

y += 42;

// Overview note
doc.setFillColor(248, 250, 255);
doc.setDrawColor(226, 232, 240);
doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(23, 37, 84);
doc.text('Overview & Objective:', margin + 4, y + 6);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(100, 116, 139);
const intro = 'This manual provides an end-to-end visual walkthrough of the AuraAI platform. It explains what you see on each screen, how to click and operate each control, and why each feature is useful and valuable for your workflow.';
const introLines = doc.splitTextToSize(intro, contentWidth - 8);
doc.text(introLines, margin + 4, y + 12);

y += 26;

// ------------------------------------
// UI GUIDE SECTIONS (12 SCREENS)
// ------------------------------------
const sections = [
  {
    step: '01',
    area: 'Top Navigation Bar',
    title: 'Global Search, Credits Badge & Profile Control',
    see: 'AuraAI logo, center search input ("Search model, plugin..."), Credit Balance pill (e.g. 250 Credits), Mode toggle (Admin/User), Notification bell, and User Profile pill (Rupasree Kamineni).',
    how: [
      'Search: Click the center search bar to locate models, past conversation topics, or tools.',
      'Check / Buy Credits: Click the amber Credit Badge to open the Credit Wallet immediately.',
      'Toggle Role: Click the "Admin Mode / User Mode" badge to test role-protected features.',
      'Profile Menu: Click your avatar to access Account Settings, Subscriptions, or API Keys.',
      'Right Drawer: Click the panel icon on the far right to show/hide the quick inspector panel.'
    ],
    why: 'Provides instant one-click navigation across your account, credits, and keys from any workspace without losing your active conversation state.'
  },
  {
    step: '02',
    area: 'Left Navigation Sidebar',
    title: 'Workspace Navigation & Chat History Management',
    see: '+ New Chat button (Cmd+K), navigation links (Home, Explore Models, Image Gen, Code Assistant, Document Analysis, Plugins, API Keys, Wallet, Subscription, Analytics, Account), and Recent Chats grouped by Pinned, Today, Yesterday, and Previous 7 Days.',
    how: [
      'Start Chat: Click "+ New Chat" or press Cmd+K / Ctrl+K anywhere in the app.',
      'Filter Chats: Type in "Filter chats..." to search conversation titles in real time.',
      'Manage Chats: Hover over any chat in the history list to Pin, Edit (rename), or Delete it.',
      'Switch Tools: Click any menu item (e.g. Code Assistant or Image Generation) to switch workspaces.',
      'Minimize Sidebar: Click the hamburger icon at top left to expand or collapse the sidebar.'
    ],
    why: 'Keeps all multi-model discussions and research neatly organized chronologically with zero clutter.'
  },
  {
    step: '03',
    area: 'Home Dashboard (Main Screen)',
    title: 'Model Selection, Execution Mode & Central Prompting',
    see: 'Greeting banner ("Good Afternoon, Rupasree!"), Model Dropdown, Mode toggle ("Use My API Key" vs "Platform Credits"), Credit balance, Action pills (All, Write, Code, Image, Doc), central Prompt Composer, Three Setup Cards, and Quick Access tools.',
    how: [
      'Select Model: Click the "Select Model" dropdown to pick Gemini 2.5 Flash, GPT-4o, Claude 3.5, or local Ollama models.',
      'Choose Mode: Select "Use My API Key" (deducts 0 platform credits) or "Platform Credits" (deducts transparent platform credits).',
      'Enter Prompt: Type your query in the composer box. Use Shift+Enter for newline and Enter to send.',
      'Attach Tools: Click "Attach" for files, "Web Search" for live citations, or "Code Runner" for sandbox execution.',
      '1-Click Popular Prompts: Click any suggested card (e.g. Kubernetes Cluster or Full-Stack Roadmap) to run instantly.'
    ],
    why: 'Lets you configure model choice, billing source, and tools before sending a single prompt, preventing unexpected costs.'
  },
  {
    step: '04',
    area: 'Chat Workspace',
    title: 'Real-Time Streaming, Code Blocks & Response Controls',
    see: 'Conversation bubbles, real-time token streaming, active model badge (e.g. "Gemini 2.5 Flash • BYOK"), syntax-highlighted code blocks with Copy & Run Sandbox buttons, and bottom composer.',
    how: [
      'Stream Output: Responses stream word-by-word with live token count metrics.',
      'Stop Generation: Click the red "Stop" button in the composer at any time during generation.',
      'Copy / Run Code: In any code block, click "Copy" or click "Run Sandbox" to execute the code live in the sandbox.',
      'Edit & Resend: Hover over your user message, click "Edit", modify your text, and resend.',
      'Regenerate: Click the circular reload arrow below the AI response to get an alternative answer.',
      'Export Markdown: Click "Export" in the workspace header to save the conversation as a .md file.'
    ],
    why: 'Provides instant zero-latency reading through real-time streaming, eliminates manual code copy-pasting, and lets you branch conversations easily.'
  },
  {
    step: '05',
    area: 'API Key Management (BYOK)',
    title: 'Connecting Personal Provider Keys for Zero Platform Fees',
    see: 'Provider cards for OpenAI, Google Gemini, Anthropic, and Local Ollama, showing masked keys (sk-proj-••••4829), verified connection badges, last tested date, and "+ Add API Key" button.',
    how: [
      'Add Key: Click "+ Add API Key" at top-right. Select provider, paste your key secret, and save.',
      'Test Key: Click "Test" on any key card to verify live HTTP status (shows green Verified badge).',
      'Toggle Active: Click the power button to temporarily deactivate a key without purging it.',
      'Security: All keys are encrypted at rest with AES-256 and never logged or exposed in raw plaintext.'
    ],
    why: 'Enables unlimited inference billed directly through your provider account with zero platform fees.'
  },
  {
    step: '06',
    area: 'Credit Wallet & Auditable Ledger',
    title: 'Managing Platform Credits & Tracking Expenditures',
    see: 'Available credit balance, monthly quota progress, instant top-up packs ($5 for 500, $15 for 2,000, $35 for 5,000), and the auditable Credit Ledger table.',
    how: [
      'Top-Up Credits: Click "Top-Up Credits" or pick a pack card to instantly purchase credits.',
      'Inspect Spend: Scroll to the Credit Transaction Ledger to view exact timestamps, models used, and balances after.',
      'Export CSV: Click "Export CSV" to download an auditable financial record for accounting.'
    ],
    why: 'Provides total financial transparency with no recurring surprise fees; credits are deducted atomically per request.'
  },
  {
    step: '07',
    area: 'Interactive Code Assistant & Sandbox',
    title: 'Writing, Debugging & Executing Code in the Browser',
    see: 'Split-screen IDE with a code editor on the left and an isolated terminal stdout console on the right, language dropdown (Python, TypeScript, SQL), and action pills (Explain, Optimize, Audit).',
    how: [
      'Select Language: Pick Python 3.12, TypeScript 5.4, or PostgreSQL 16 from the top dropdown.',
      'Write / Paste: Enter your algorithms or functions in the dark-themed editor.',
      'Execute: Click green "Execute Code". The backend runs the snippet in an isolated container and prints stdout to terminal.',
      'AI Actions: Click "Explain", "Optimize", or "Security Audit" to auto-analyze code in the chat workspace.'
    ],
    why: 'Safely test and benchmark code directly in your browser without installing compilers, runtimes, or libraries locally.'
  },
  {
    step: '08',
    area: 'Document Analysis & RAG Studio',
    title: 'Uploading Files & Question-Answering on Whitepapers',
    see: 'Dashed drag-and-drop file upload zone, indexed document cards with page counts, and pre-built question chips.',
    how: [
      'Upload: Drag & drop any PDF, CSV, or TXT file into the dashed zone (up to 25MB).',
      'Select Doc: Click any document card to view its summary and page count.',
      'Ask Questions: Click a suggested chip (e.g. "Summarize core recommendations") to query with exact citations.'
    ],
    why: 'Extracts precise insights and citations from 100-page enterprise PDFs in seconds without manual skimming.'
  },
  {
    step: '09',
    area: 'Creative Image Generation Studio',
    title: 'Prompt-to-Image Generation & Resolution Presets',
    see: 'Creative prompt box, Aspect Ratio buttons (1:1, 16:9, 9:16), Style dropdown (Photorealistic, Anime, Cyberpunk, Vector), and a history gallery.',
    how: [
      'Describe: Enter your image prompt into the text box.',
      'Configure: Select aspect ratio (1:1 square, 16:9 widescreen, 9:16 portrait) and style preset.',
      'Generate & Save: Click "Generate Artwork", wait for render, and click "Save PNG" on the card.'
    ],
    why: 'Create visual assets, website banners, and UI mockups directly in your workflow without third-party design apps.'
  },
  {
    step: '10',
    area: 'Account Settings & Active Sessions',
    title: 'Profile Customization, Multi-Device Management & Security',
    see: 'Profile details form, connected OAuth accounts, data retention selector, and Active Sessions table with device, browser, and IP.',
    how: [
      'Update Profile: Modify full name or email and click "Save Profile".',
      'Audit Devices: Check all phones, laptops, and tablets currently logged into your account.',
      'Remote Sign-Out: Click the logout icon next to any specific device or click "Sign Out All Other Sessions".',
      'Data Retention: Choose history retention (30 days, 90 days, or indefinitely).'
    ],
    why: 'Protects your account against unauthorized logins and lets you remotely terminate forgotten sessions with a single click.'
  },
  {
    step: '11',
    area: 'Contextual Right Panel (Quick Inspector)',
    title: 'Always-Available Sidebar for Keys, Quota & Status',
    see: 'Collapsible right drawer showing active API keys with green status dots, monthly credit quota progress bar, quick Upgrade button, and local Ollama status.',
    how: [
      'Toggle Panel: Click the panel icon in the top navigation bar at any time to open/close.',
      'Monitor Quota: View remaining monthly credits as you prompt without leaving chat.',
      'Quick Key View: Check which provider keys are currently active at a glance.'
    ],
    why: 'Eliminates page switching by giving you continuous visibility into credits and API connections while you work.'
  },
  {
    step: '12',
    area: 'Admin Governance Console',
    title: 'Cluster Telemetry, Pricing Governance & User Audits',
    see: 'Dashboard KPIs (Total Users, Active Users, Request Volume, Credits Consumed, Provider Costs), Model Governance table, User Management table, and immutable Audit Logs.',
    how: [
      'Access Console: Click the "Admin Mode" badge in top bar, then click "Admin Console" in sidebar.',
      'Adjust Pricing: Go to "Model Governance" tab and click "+1 cr" or "Enable/Disable" to tune credit costs.',
      'Grant Credits: Go to "User Management", find user, click "Grant Credits", enter amount and mandatory audit reason.',
      'Inspect Audit Trail: Click "Audit Logs" to view timestamped logs of all privileged operations.'
    ],
    why: 'Gives administrators complete operational oversight and governance over AI infrastructure, costs, and access permissions.'
  }
];

sections.forEach((sec) => {
  checkPageBreak(50);

  // Section Header Box
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202); // Indigo 700
  doc.text(`STEP ${sec.step}: ${sec.area.toUpperCase()} — ${sec.title}`, margin + 3, y + 6.5);

  y += 14;

  // What you see
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('What You See on Screen:', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const seeLines = doc.splitTextToSize(sec.see, contentWidth);
  doc.text(seeLines, margin, y);
  y += seeLines.length * 4 + 3;

  // How to use it
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('How to Use It (Step-by-Step UI Actions):', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  sec.how.forEach((action, i) => {
    checkPageBreak(10);
    const actionText = `${i + 1}. ${action}`;
    const actionLines = doc.splitTextToSize(actionText, contentWidth - 4);
    doc.text(actionLines, margin + 2, y);
    y += actionLines.length * 4;
  });

  y += 2;

  // Why Useful Box (Green accent)
  checkPageBreak(18);
  const whyLines = doc.splitTextToSize(`Why This Feature Is Useful: ${sec.why}`, contentWidth - 6);
  const boxHeight = whyLines.length * 4 + 6;

  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61); // Emerald 700
  doc.text(whyLines, margin + 3, y + 4.5);

  y += boxHeight + 7;
});

// Write to file in public directory
const outputPath = path.join(publicDir, 'AuraAI_User_Guide.pdf');
const pdfBytes = doc.output();
fs.writeFileSync(outputPath, Buffer.from(pdfBytes, 'binary'));

console.log(`PDF successfully created at ${outputPath} (${pdfBytes.length} bytes)`);
