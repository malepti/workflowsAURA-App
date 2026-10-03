import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  Download,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Server,
  MessageSquare,
  Wallet,
  Boxes,
  Code2,
  FileText,
  ImageIcon,
  ShieldCheck,
  BarChart3,
  Sliders,
  MousePointer,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface UIStep {
  stepNumber: string;
  uiArea: string;
  title: string;
  whatYouSee: string;
  howToUseIt: string[];
  whyUseful: string;
  uiElements: string[];
}

export const UserGuideView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'all'>('walkthrough');

  const uiGuideSteps: UIStep[] = [
    {
      stepNumber: '01',
      uiArea: 'Top Navigation Bar',
      title: 'Global Search, Credits Badge & Profile Control',
      whatYouSee:
        'A clean top bar containing the AuraAI Logo, Global Search input ("Search model, plugin..."), Credit Balance badge, Admin/User mode toggle, Notification bell, User Profile pill ("Rupasree Kamineni"), and the Right Drawer toggle icon.',
      howToUseIt: [
        'Search Anything: Type into the center search bar to quickly jump to models, tools, or prior conversation topics.',
        'Check / Top-Up Credits: Click the amber pill with the coin icon (e.g. "250 Credits") to immediately open your credit wallet.',
        'Toggle Admin Mode: Click the "Admin Mode / User Mode" badge in the top bar to test role-protected features.',
        'Open Profile Menu: Click on your avatar/name pill to access Account Settings, Subscription, or API Key Manager.',
        'Toggle Quick Panel: Click the panel icon on the far right to show/hide the contextual right sidebar.'
      ],
      whyUseful:
        'Provides instant one-click access from any screen without losing your active chat state or interrupting your work.',
      uiElements: ['Search Bar', 'Credit Coin Pill', 'Admin/User Mode Button', 'Profile Dropdown', 'Right Panel Toggle']
    },
    {
      stepNumber: '02',
      uiArea: 'Left Navigation Sidebar',
      title: 'Workspace Navigation & Chat History Management',
      whatYouSee:
        'The left sidebar with the purple "+ New Chat" button, main workspace icons (Home, Explore, Image Gen, Code, Docs, Plugins, API Keys, Wallet, Subscription, Analytics, Account), a search filter for chats, and your recent conversations grouped by "Pinned", "Today", "Yesterday", and "Previous 7 Days".',
      howToUseIt: [
        'Start a New Conversation: Click "+ New Chat" or press the keyboard shortcut Cmd+K (or Ctrl+K).',
        'Find a Past Chat: Type into the "Filter chats..." input above your history to find past answers in real time.',
        'Manage Chat History: Hover over any conversation in the list to reveal quick action icons: Pin (pin to top), Edit (rename conversation inline), and Trash (delete).',
        'Switch Workspaces: Click any item in the menu list (e.g. "Image Generation", "Code Assistant", "Plugin Marketplace") to switch interfaces.',
        'Collapse Sidebar: Click the hamburger menu icon at the top left to minimize the sidebar and maximize chat space.'
      ],
      whyUseful:
        'Keeps all your AI tasks organized chronologically with zero clutter, so you never lose important project research or code snippets.',
      uiElements: ['+ New Chat Button (Cmd+K)', 'Filter Chats Input', 'Pinned Chat Group', 'Rename & Delete Icons', 'Workspace Links']
    },
    {
      stepNumber: '03',
      uiArea: 'Home Dashboard (Central Workspace)',
      title: 'Model Selection, Execution Mode & Central Prompting',
      whatYouSee:
        'The welcoming hero banner ("Good Afternoon, Rupasree!"), the Model Dropdown, the API Key/Model Source toggle, Credit indicator, Action Category Pills (All, Write, Code, Image, Doc, Research), the central Prompt Composer, Three Setup Cards, Quick Access Tools, and Popular Prompts.',
      howToUseIt: [
        'Step 1 - Select a Model: Click the "Select Model" dropdown to pick between Gemini 2.5 Flash, GPT-4o, Claude 3.5 Sonnet, or local models (Llama 3.3, DeepSeek R1, Qwen Coder).',
        'Step 2 - Choose Execution Mode: Click "Use My API Key" to use your personal key (0 platform credits charged), or click "Platform Credits" to use admin-managed local/cloud GPU credits.',
        'Step 3 - Compose Prompt: Type your instructions into the large text area. Use Shift+Enter for newlines and Enter to send.',
        'Step 4 - Add Tools & Attachments: Click "Attach" to upload files, "Web Search" to pull live internet data, or "Code Runner" to enable sandbox execution.',
        'Step 5 - 1-Click Popular Prompts: Click any popular card (e.g., "Kubernetes Cluster Architecture" or "Full-Stack SaaS Roadmap") to start an instant deep-dive.'
      ],
      whyUseful:
        'Empowers you to configure model choice and billing source before sending a single prompt, preventing unexpected charges and guaranteeing optimal intelligence.',
      uiElements: ['Select Model Dropdown', 'BYOK vs Platform Mode Switcher', 'Action Pills', 'Prompt Composer', 'Attach / Web Search Buttons']
    },
    {
      stepNumber: '04',
      uiArea: 'Chat Workspace',
      title: 'Real-Time Streaming, Code Blocks & Response Controls',
      whatYouSee:
        'A dedicated conversation screen showing your prompt bubbles and the assistant\'s live streaming answers, along with model badges (e.g. "Gemini 2.5 Flash • BYOK" or "Llama 3.3 • Platform Credits"), formatted tables, and syntax-highlighted code blocks.',
      howToUseIt: [
        'Watch Real-Time Output: The response streams word-by-word with live token counts.',
        'Stop Generation: If the AI begins outputting something you want to interrupt, click the red "Stop" button in the bottom composer.',
        'Copy or Run Code: In any code block, click "Copy" to put it on your clipboard, or click "Run Sandbox" to load it straight into the Interactive Code Sandbox.',
        'Edit & Resend: Hover over your user message and click "Edit" to modify your prompt and regenerate the thread.',
        'Regenerate Answer: Click the circular arrow icon below the AI response to get an alternative answer.',
        'Export Chat: Click "Export" in the top workspace header to save the conversation as a clean Markdown (.md) document.'
      ],
      whyUseful:
        'Gives you complete control over the conversational flow, eliminates manual copy-pasting of code, and provides full Markdown export for project docs.',
      uiElements: ['Active Model Badge', 'Streaming Pulse Indicator', 'Copy / Run Sandbox Code Buttons', 'Edit Message Button', 'Export Markdown Button']
    },
    {
      stepNumber: '05',
      uiArea: 'API Key Management (BYOK)',
      title: 'Connecting Personal Provider Keys for Zero Platform Fees',
      whatYouSee:
        'A grid of provider cards for OpenAI, Google Gemini, Anthropic, and Local Ollama, showing masked key identifiers (e.g. "sk-proj-••••••••4829"), connection status, last tested date, and action buttons ("Test", "Power Toggle", "Delete").',
      howToUseIt: [
        'Add a New Key: Click "+ Add API Key" in the top-right. Select your provider (OpenAI, Gemini, Anthropic), paste your key, give it an optional label, and submit.',
        'Test Connection: Click the "Test" button on any card. The backend verifies the connection and marks it with a green "Verified" badge.',
        'Toggle / Deactivate: Click the power button to temporarily disable a key without deleting it.',
        'Security Assurance: Notice all keys are encrypted at rest with AES-256 and masked in the UI.'
      ],
      whyUseful:
        'Enables you to run unlimited inference at raw provider wholesale costs with zero platform fee deduction.',
      uiElements: ['+ Add API Key Button', 'Provider Cards', 'Test Connection Button', 'Active/Inactive Toggle', 'Security Notice']
    },
    {
      stepNumber: '06',
      uiArea: 'Credit Wallet & Auditable Ledger',
      title: 'Managing Platform Credits & Tracking Expenditures',
      whatYouSee:
        'Your available credit balance, monthly plan quota progress, instant top-up packs ($5 for 500, $15 for 2,000, $35 for 5,000), and an auditable transaction ledger table showing every inference deduction, model used, and balance after.',
      howToUseIt: [
        'Purchase Credit Packs: Click "Top-Up Credits" or pick a card (e.g. $15 for 2,000 credits) to instantly add credits to your balance.',
        'Audit Your Spend: Scroll down to the "Auditable Credit Transaction Ledger" table to inspect the exact timestamp, model, and credit delta for every query.',
        'Export Records: Click "Export CSV" to download an auditable financial spreadsheet for accounting or team reporting.'
      ],
      whyUseful:
        'Provides total financial transparency with no recurring lock-in, guaranteeing you always know exactly where every credit was spent.',
      uiElements: ['Available Credits Card', 'Top-Up Pack Cards', 'Transaction Ledger Table', 'Export CSV Button']
    },
    {
      stepNumber: '07',
      uiArea: 'Interactive Code Assistant & Sandbox',
      title: 'Writing, Debugging & Executing Code in the Browser',
      whatYouSee:
        'A split-screen developer IDE with a code editor on the left and an isolated terminal stdout console on the right, plus language dropdown (Python, TypeScript, SQL) and quick AI action pills.',
      howToUseIt: [
        'Select Language: Pick Python 3.12, TypeScript 5.4, or PostgreSQL 16 from the top dropdown.',
        'Write or Paste Code: Type your algorithms or functions into the dark-themed editor.',
        'Execute in Sandbox: Click the green "Execute Code" button. The backend runs the code in an isolated container and prints stdout, memory, and runtime latency in the terminal.',
        '1-Click AI Actions: Click "Explain", "Optimize", or "Security Audit" below the editor to auto-analyze your snippet in the Chat Workspace.'
      ],
      whyUseful:
        'Enables you to test and benchmark scripts immediately without installing runtime dependencies or compilers on your computer.',
      uiElements: ['Language Dropdown', 'Execute Code Button', 'Terminal Output Console', 'AI Action Pills (Explain, Optimize, Audit)']
    },
    {
      stepNumber: '08',
      uiArea: 'Document Analysis & RAG Studio',
      title: 'Uploading Files & Question-Answering on Whitepapers',
      whatYouSee:
        'A drag-and-drop upload zone, indexed document cards with page counts and summaries, and suggested questions for instant semantic retrieval.',
      howToUseIt: [
        'Upload Documents: Drag & drop your PDF, TXT, or CSV file onto the dashed box (or click to browse).',
        'Select Active Document: Click any document card (e.g. "system_architecture_whitepaper.pdf") to view its overview.',
        'Ask Questions: Click any suggested question (e.g. "Summarize core recommendations" or "Extract security compliance") to launch a targeted Q&A session with citations.'
      ],
      whyUseful:
        'Extracts exact answers from lengthy 100-page manuals and datasets in seconds without manual scanning.',
      uiElements: ['Upload Dropzone', 'Indexed Documents List', 'Suggested Question Chips']
    },
    {
      stepNumber: '09',
      uiArea: 'Creative Image Generation Studio',
      title: 'Prompt-to-Image Generation & Resolution Presets',
      whatYouSee:
        'A creative prompt input box, Aspect Ratio buttons (1:1, 16:9, 9:16), Style Preset selector (Photorealistic 3D, Anime, Cyberpunk, Vector), and a history gallery of generated visuals.',
      howToUseIt: [
        'Describe Image: Type your visual concept into the prompt box (e.g. "Minimalist glass computer on clean desk, violet glow").',
        'Choose Aspect Ratio: Select 1:1 for square avatars, 16:9 for presentations/headers, or 9:16 for mobile layouts.',
        'Select Style: Pick from Photorealistic 3D, Anime Art, Cyberpunk, or Vector.',
        'Generate & Save: Click "Generate Artwork", wait for the render, and click "Save PNG" on the card to download.'
      ],
      whyUseful:
        'Creates high-resolution concept art, blog banners, and product illustrations directly inside your AI workspace.',
      uiElements: ['Prompt Input Area', 'Aspect Ratio Buttons', 'Style Preset Dropdown', 'Generate Artwork Button', 'Save PNG Button']
    },
    {
      stepNumber: '10',
      uiArea: 'Account Settings & Device Sessions',
      title: 'Profile Customization, Multi-Device Management & Security',
      whatYouSee:
        'Profile details (Name, Email, Avatar), Active Sessions table with device type, browser, IP address, and location, connected accounts, and conversation retention settings.',
      howToUseIt: [
        'Update Profile: Modify your full name or email and click "Save Profile".',
        'Review Active Devices: Check all phones, laptops, and tablets currently signed into your account.',
        'Remote Sign-Out: Click the logout icon next to any specific session to revoke it remotely, or click "Sign Out All Other Sessions" to disconnect everything else.',
        'Retention Policy: Select whether conversation histories should be retained for 30 days, 90 days, 1 year, or indefinitely.'
      ],
      whyUseful:
        'Protects against unauthorized account access and ensures enterprise privacy compliance across all your team devices.',
      uiElements: ['Profile Form', 'Active Devices List', 'Remote Sign-Out Buttons', 'Retention Policy Selector']
    },
    {
      stepNumber: '11',
      uiArea: 'Contextual Right Panel (Quick Inspector)',
      title: 'Always-Available Sidebar for Keys, Quota & Status',
      whatYouSee:
        'A collapsible right drawer accessible from anywhere displaying your top active API keys with green status dots, your monthly credit usage progress bar, a quick "Upgrade Plan" button, and local Ollama cluster health.',
      howToUseIt: [
        'Open / Close Panel: Click the panel icon in the top navigation bar at any time to toggle this drawer.',
        'Quick Key Overview: See which provider keys are currently active without leaving your chat.',
        'Monitor Quota: Keep an eye on your remaining monthly credits as you prompt.'
      ],
      whyUseful:
        'Eliminates page switching by giving you continuous visibility into credits and API connections while you work.',
      uiElements: ['Active Keys Quick List', 'Monthly Quota Progress Bar', 'Upgrade Plan Button', 'Ollama Status Card']
    },
    {
      stepNumber: '12',
      uiArea: 'Admin Governance Console',
      title: 'Cluster Telemetry, Pricing Governance & User Audits',
      whatYouSee:
        'Visible when role is set to Admin: Dashboard KPIs (Total Users, Active Users, Request Volume, Credit Consumption, Provider Costs), Model Governance table, User Management table with credit grants, and privileged audit logs.',
      howToUseIt: [
        'Access Admin: Click the "Admin Mode" badge in the top bar, then select "Admin Console" from the left sidebar.',
        'Adjust Model Pricing: Go to the "Model Governance" tab and click "+1 cr" or "Enable/Disable" to control credit costs per request.',
        'Grant User Credits: Go to "User Management", find a user, click "Grant Credits", enter an amount and mandatory audit reason, and submit.',
        'Inspect Audit Trail: Click "Audit Logs" to view an immutable timestamped log of all privileged system operations.'
      ],
      whyUseful:
        'Gives administrators complete operational oversight and governance over AI infrastructure, costs, and access permissions.',
      uiElements: ['KPI Stat Cards', 'Model Governance Table', 'User Search & Grant Credits Modal', 'Audit Trail Table']
    }
  ];

  const handleDownloadPDF = () => {
    addToast('Downloading AuraAI_User_Guide.pdf...', 'success');
    const link = document.createElement('a');
    link.href = '/api/v1/download-guide-pdf';
    link.download = 'AuraAI_User_Guide.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    addToast('Opening print dialog. Select "Save as PDF" to preview.', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleDownloadMarkdown = () => {
    let md = `# AuraAI — Complete UI Walkthrough & User Guide (How to Use the Application)\n`;
    md += `*Generated on: ${new Date().toLocaleDateString()} | Author: AuraAI Platform Engineering*\n\n`;
    md += `## Table of Contents\n`;
    uiGuideSteps.forEach((s) => {
      md += `- Step ${s.stepNumber}: [${s.title} (${s.uiArea})](#step-${s.stepNumber})\n`;
    });
    md += `\n---\n\n`;

    uiGuideSteps.forEach((s) => {
      md += `### Step ${s.stepNumber}: ${s.title}\n`;
      md += `**UI Screen / Area:** \`${s.uiArea}\`\n\n`;
      md += `#### What You See on the Screen:\n${s.whatYouSee}\n\n`;
      md += `#### How to Use It (Step-by-Step UI Actions):\n`;
      s.howToUseIt.forEach((h) => {
        md += `- ${h}\n`;
      });
      md += `\n#### Why This Feature is Useful:\n${s.whyUseful}\n\n`;
      md += `**Key UI Controls:** ${s.uiElements.join(' • ')}\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuraAI_UI_User_Guide.md`;
    a.click();
    addToast('UI User Guide downloaded as Markdown.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & PDF Actions (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <BookOpen className="h-4 w-4" />
            <span>HOW TO USE AURAAI — UI STEP-BY-STEP USER GUIDE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172554]">
            AuraAI UI User Guide (PDF Ready)
          </h1>
          <p className="text-xs text-slate-500">
            A practical visual manual: what you see on each screen, how to click and use each control, and why each feature is useful.
          </p>
        </div>

        {/* Export / Print Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
            title="Download as Markdown"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Download MD</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
            title="Open browser print dialog"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-indigo-600 transition-all active:scale-[0.98]"
            title="Download official PDF file"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Download User Guide (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8">
        {/* PDF Document Cover Header */}
        <div className="border-b border-slate-200 pb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold shadow-sm text-lg">
                ✦
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 block tracking-tight">
                  AuraAI User Guide: How to Use the Platform
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  End-to-End Visual Walkthrough from the UI Perspective
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span className="font-semibold text-slate-800 block">Official Application Manual</span>
              <span>Version 1.2 • Light Theme Edition</span>
            </div>
          </div>

          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-xs text-slate-700 leading-relaxed">
            <strong>Welcome to AuraAI!</strong> This visual guide walks you through every screen of the application in sequence. Follow along step-by-step to learn where each button is located, how to select models, how to bring your own API keys for zero fees, and how to harness private local AI.
          </div>
        </div>

        {/* Step-by-Step UI Guide Cards */}
        <div className="space-y-8">
          {uiGuideSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="print-break-inside-avoid rounded-2xl border border-slate-200 bg-[#F8FAFF]/60 p-6 transition-all hover:border-indigo-300 space-y-4"
            >
              {/* Step Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-mono font-extrabold text-xs shadow-2xs">
                    {step.stepNumber}
                  </span>
                  <div>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
                      Screen: {step.uiArea}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {step.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* What You See */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-indigo-500" />
                  What You See on the Screen:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{step.whatYouSee}</p>
              </div>

              {/* How to Use It (Step-by-step clicks) */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MousePointer className="h-3 w-3 text-indigo-500" />
                  How to Use It (Step-by-Step Actions):
                </span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {step.howToUseIt.map((action, aIdx) => (
                    <div key={aIdx} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {aIdx + 1}
                      </span>
                      <span className="leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why This Feature is Useful */}
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Why This Feature is Useful:
                </span>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  {step.whyUseful}
                </p>
              </div>

              {/* Key UI Elements Checklist */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 mr-1 uppercase">Key Controls:</span>
                {step.uiElements.map((el, elIdx) => (
                  <span
                    key={elIdx}
                    className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 font-medium text-slate-600 text-[10px]"
                  >
                    {el}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Document Footer */}
        <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400 space-y-1">
          <p className="font-bold text-slate-700">AuraAI Multi-Model Assistant Platform</p>
          <p>Complete User Manual & Visual Interface Architecture • Ready for Print / PDF Export</p>
        </div>
      </div>
    </div>
  );
};
