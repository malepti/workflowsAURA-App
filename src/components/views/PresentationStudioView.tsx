import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Sparkles,
  Download,
  FileText,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Edit3,
  Check,
  RefreshCw,
  Palette,
  Sliders,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Server,
  Compass,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  FolderOpen,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import {
  PresentationDeck,
  PresentationSlide,
  PresentationTheme,
  SlideLayoutType,
  AIModel
} from '../../types';
import { getApiBase } from '../../lib/apiConfig';

const API_BASE = getApiBase();

// Default starter presentation deck with native AuraAI clean light styling
const DEFAULT_STARTER_DECK: PresentationDeck = {
  id: 'starter_deck_1',
  deckTitle: 'workflowsAURA Autonomous Intelligence',
  deckSubtitle: 'Next-Gen Multi-Agent Swarms & Dynamic Visual Orchestration',
  topic: 'Autonomous AI Agents',
  tone: 'investor_pitch',
  modelUsed: 'gemini-2.5-flash',
  executionMode: 'live_gemini',
  aspectRatio: '16:9',
  theme: {
    name: 'Aura Indigo',
    mode: 'light',
    background: 'from-[#ffffff] via-[#f8fafc] to-[#eef2ff]',
    bgHex: '#ffffff',
    primary: '#4f46e5',
    accent: '#06b6d4',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    cardBg: '#ffffff',
    borderColor: '#e2e8f0',
    badgeBg: '#eef2ff',
    badgeText: '#4f46e5',
    fontHeading: 'Plus Jakarta Sans, sans-serif',
    fontBody: 'Plus Jakarta Sans, sans-serif'
  },
  slides: [
    {
      id: 'slide_1',
      index: 1,
      layout: 'hero_badge',
      badge: 'EXECUTIVE BRIEFING 2026',
      title: 'workflowsAURA Platform',
      subtitle: 'Self-orchestrating multi-agent swarms with zero hardcoded templates and real-time tool synthesis.',
      presenter: 'AuraAI Systems Architecture',
      date: 'Q4 2026',
      highlights: ['Dynamic Semantic Grammars', 'Local Ollama + Cloud BYOK', 'Real-time Vector PDF & PPTX']
    },
    {
      id: 'slide_2',
      index: 2,
      layout: 'stat_grid',
      badge: 'TRACTION & BENCHMARKS',
      title: 'Measurable Velocity & Scale',
      subtitle: 'Empirical performance improvements recorded across enterprise deployments.',
      stats: [
        { value: '10x', label: 'Faster Execution Velocity', change: '+900%', isPositive: true },
        { value: '99.4%', label: 'Decision Accuracy', change: '+14.2%', isPositive: true },
        { value: '$0.002', label: 'Avg. Cost Per Workflow', change: '-78%', isPositive: true },
        { value: '450k+', label: 'Active Monthly Automations', change: 'Viral', isPositive: true }
      ]
    },
    {
      id: 'slide_3',
      index: 3,
      layout: 'split_comparison',
      badge: 'PARADIGM SHIFT',
      title: 'Legacy Hardcoded Templates vs. Dynamic AI Grammars',
      subtitle: 'Why static slide generators fail and how semantic composition creates tailored outcomes.',
      left: {
        title: 'Legacy Static Templates',
        tone: 'negative',
        items: [
          'Rigid 2003-era bullet point dumps with awkward spacing',
          'Text overflowing canvas boundaries or clipping margins',
          'Repetitive corporate color palettes with zero contextual mood',
          'Manual repositioning required for every single slide'
        ]
      },
      right: {
        title: 'workflowsAURA Dynamic Engine',
        tone: 'positive',
        items: [
          'Semantic component grammar matching content meaning',
          '16:9 responsive self-healing container with auto-flow padding',
          'Topic-tailored mood palettes and glassmorphism tokens',
          '1-click export to editable PowerPoint (.pptx) & vector PDF'
        ]
      }
    },
    {
      id: 'slide_4',
      index: 4,
      layout: 'process_timeline',
      badge: 'EXECUTION PIPELINE',
      title: 'How Dynamic Synthesis Works',
      subtitle: 'From raw user intent or uploaded resource files to polished executive presentations.',
      steps: [
        { step: '01', title: 'Context Parsing', desc: 'Extracts semantic entities and figures from PDF, DOCX, or user prompts.' },
        { step: '02', title: 'Layout Assignment', desc: 'AI visual director assigns optimal semantic archetypes per slide.' },
        { step: '03', title: 'Theme Generation', desc: 'Synthesizes matching dynamic color tokens, fonts, and card styling.' },
        { step: '04', title: 'Dual Export Engine', desc: 'Renders high-DPI vector PDF and native editable PPTX on demand.' }
      ]
    },
    {
      id: 'slide_5',
      index: 5,
      layout: 'feature_matrix',
      badge: 'CORE CAPABILITIES',
      title: 'Engineered for Enterprise Versatility',
      subtitle: 'Modular architectural pillars supporting diverse presentation and documentation workflows.',
      features: [
        { title: 'Zero Hardcoded Templates', desc: 'Layouts are assembled on the fly based on the specific semantics of the data.', tag: 'Design AI' },
        { title: 'Hybrid Model Gateway', desc: 'Runs seamlessly on Google Gemini 2.5 Flash Cloud or Local Ollama with full BYOK privacy.', tag: 'Inference' },
        { title: 'In-Place Live Editing', desc: 'Click any headline, metric, or bullet directly on the canvas to refine before exporting.', tag: 'Productivity' }
      ]
    },
    {
      id: 'slide_6',
      index: 6,
      layout: 'quote_takeaway',
      badge: 'THE STRATEGIC TAKEAWAY',
      title: 'The Takeaway',
      quote: 'The future of communication belongs not to static slide templates, but to dynamic intelligence that understands ideas and sculpts their visual form instantly.',
      author: 'workflowsAURA Strategic Roadmap',
      ctaText: 'Start Generating Decks'
    }
  ]
};

const THEME_OPTIONS: { id: string; name: string; mode: 'dark' | 'light'; primary: string; accent: string; bg: string }[] = [
  { id: 'aura_indigo', name: 'Aura Indigo (Default)', mode: 'light', primary: '#4f46e5', accent: '#06b6d4', bg: '#ffffff' },
  { id: 'minimal_pearl', name: 'Minimal Pearl', mode: 'light', primary: '#2563eb', accent: '#0d9488', bg: '#ffffff' },
  { id: 'forest_emerald', name: 'Forest Emerald', mode: 'light', primary: '#10b981', accent: '#059669', bg: '#ffffff' },
  { id: 'sunset_coral', name: 'Sunset Coral', mode: 'light', primary: '#f43f5e', accent: '#fb923c', bg: '#ffffff' },
  { id: 'obsidian_indigo', name: 'Obsidian Dark', mode: 'dark', primary: '#6366f1', accent: '#22d3ee', bg: '#0b0f19' },
  { id: 'cyberpunk_neon', name: 'Cyberpunk Neon', mode: 'dark', primary: '#ec4899', accent: '#06b6d4', bg: '#050505' }
];

export const PresentationStudioView: React.FC = () => {
  const { models, selectedModel, setSelectedModel, addToast, setCurrentView } = useApp();

  // Deck State
  const [deck, setDeck] = useState<PresentationDeck>(DEFAULT_STARTER_DECK);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'create' | 'slides' | 'theme' | 'history'>('create');

  // Input & Generation State
  const [prompt, setPrompt] = useState<string>('Pitch deck for an Autonomous Multi-Agent AI Healthcare Platform');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [extractedSourceText, setExtractedSourceText] = useState<string>('');
  const [fileCharCount, setFileCharCount] = useState<number>(0);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [slideCount, setSlideCount] = useState<number>(6);
  const [tone, setTone] = useState<string>('investor_pitch');
  const [themePreference, setThemePreference] = useState<string>('auto');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // History State
  const [savedDecks, setSavedDecks] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Slide Canvas Ref for PDF & screenshot capture
  const slideCanvasRef = useRef<HTMLDivElement>(null);

  const currentSlide = deck.slides[currentSlideIndex] || deck.slides[0];

  // Fetch Deck History on Tab Change
  useEffect(() => {
    if (sidebarTab === 'history') {
      fetchHistory();
    }
  }, [sidebarTab]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/presentation/history`);
      if (res.ok) {
        const data = await res.json();
        setSavedDecks(data.decks || []);
      }
    } catch {
      // silently fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept keystrokes if the user is typing in ANY form input or textarea!
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isEditing) return;

      // Spacebar only triggers slide advancement in Fullscreen presentation mode
      if (isFullscreen) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          handleNextSlide();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevSlide();
        } else if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      } else {
        if (e.key === 'ArrowRight') {
          handleNextSlide();
        } else if (e.key === 'ArrowLeft') {
          handlePrevSlide();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, deck.slides.length, isEditing, isFullscreen]);

  // File Upload & Parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceFile(file);
    setIsParsingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/v1/presentation/parse-file`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to parse file');
      }

      const data = await res.json();
      setExtractedSourceText(data.extracted_text || '');
      setFileCharCount(data.char_count || 0);
      addToast(`Extracted ${data.char_count.toLocaleString()} characters from ${file.name}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error extracting file text', 'error');
      setSourceFile(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  // Generate Dynamic Presentation
  const handleGenerateDeck = async () => {
    if (!prompt.trim() && !extractedSourceText.trim()) {
      addToast('Please provide a prompt topic or upload a source document', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/presentation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          source_text: extractedSourceText,
          model_id: selectedModel.id,
          slide_count: slideCount,
          tone: tone,
          theme_preference: themePreference,
          aspect_ratio: '16:9',
          execution_mode: 'byok'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${res.status}`);
      }

      const newDeck: PresentationDeck = await res.json();
      setDeck(newDeck);
      setCurrentSlideIndex(0);
      addToast(`✨ Deck "${newDeck.deckTitle}" generated with ${newDeck.slides.length} slides!`, 'success');
      setSidebarTab('slides');
    } catch (err: any) {
      addToast(`Generation note: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigation
  const handleNextSlide = () => {
    if (currentSlideIndex < deck.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Update current slide field
  const updateSlideField = (field: string, value: any) => {
    const updatedSlides = [...deck.slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      [field]: value
    };
    setDeck({ ...deck, slides: updatedSlides });
  };

  // Add new slide
  const handleAddSlide = () => {
    const newSlide: PresentationSlide = {
      id: `slide_${Date.now()}`,
      index: deck.slides.length + 1,
      layout: 'feature_matrix',
      badge: 'NEW SECTION',
      title: 'New Section Title',
      subtitle: 'Add a supporting explanation or key observation here.',
      features: [
        { title: 'Core Element 1', desc: 'Description of key feature or observation.', tag: 'Pillar' },
        { title: 'Core Element 2', desc: 'Description of key feature or observation.', tag: 'Pillar' },
        { title: 'Core Element 3', desc: 'Description of key feature or observation.', tag: 'Pillar' }
      ]
    };
    setDeck({ ...deck, slides: [...deck.slides, newSlide] });
    setCurrentSlideIndex(deck.slides.length);
    addToast('New slide added to deck', 'info');
  };

  // Delete slide
  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deck.slides.length <= 1) {
      addToast('A deck must have at least one slide', 'warning');
      return;
    }
    const updated = deck.slides.filter((_, i) => i !== idx).map((s, i) => ({ ...s, index: i + 1 }));
    setDeck({ ...deck, slides: updated });
    if (currentSlideIndex >= updated.length) {
      setCurrentSlideIndex(updated.length - 1);
    }
    addToast('Slide removed', 'info');
  };

  // Theme Swap
  const handleApplyTheme = (themeId: string) => {
    const found = THEME_OPTIONS.find((t) => t.id === themeId);
    if (!found) return;

    const newTheme: PresentationTheme = {
      name: found.name,
      mode: found.mode,
      background: found.mode === 'dark' ? `from-[#090d16] via-[#0f172a] to-[#1e1b4b]` : `from-[#ffffff] via-[#f8fafc] to-[#eef2ff]`,
      bgHex: found.bg,
      primary: found.primary,
      accent: found.accent,
      textPrimary: found.mode === 'dark' ? '#f8fafc' : '#0f172a',
      textSecondary: found.mode === 'dark' ? '#94a3b8' : '#64748b',
      cardBg: found.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
      borderColor: found.mode === 'dark' ? 'rgba(99, 102, 241, 0.25)' : '#e2e8f0',
      badgeBg: found.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
      badgeText: found.mode === 'dark' ? '#a5b4fc' : '#4f46e5',
      fontHeading: 'Plus Jakarta Sans, sans-serif',
      fontBody: 'Plus Jakarta Sans, sans-serif'
    };

    setDeck({ ...deck, theme: newTheme });
    addToast(`Theme switched to ${found.name}`, 'info');
  };

  // ----------------- NATIVE PPTX EXPORT ENGINE (pptxgenjs) -----------------
  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    addToast('Compiling native PowerPoint presentation (.pptx)...', 'info');

    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'workflowsAURA AI Platform';
      pptx.title = deck.deckTitle;

      const theme = deck.theme;
      const isDark = theme.mode === 'dark';
      const bgColor = theme.bgHex.replace('#', '') || (isDark ? '0B0F19' : 'FFFFFF');
      const primaryColor = theme.primary.replace('#', '') || '4F46E5';
      const accentColor = theme.accent.replace('#', '') || '06B6D4';
      const textPrimaryColor = isDark ? 'F8FAFC' : '0F172A';
      const textSecondaryColor = isDark ? '94A3B8' : '64748B';
      const cardBgColor = isDark ? '1E293B' : 'F8FAFC';

      deck.slides.forEach((slide) => {
        const pSlide = pptx.addSlide();
        pSlide.background = { color: bgColor };

        // Badge Pill
        if (slide.badge) {
          pSlide.addText(slide.badge.toUpperCase(), {
            x: 0.8,
            y: 0.6,
            w: 4.0,
            h: 0.35,
            fontSize: 10,
            bold: true,
            color: accentColor,
            isTextBox: true
          });
        }

        // Title Header
        pSlide.addText(slide.title, {
          x: 0.8,
          y: 0.95,
          w: 8.5,
          h: 0.8,
          fontSize: 26,
          bold: true,
          color: textPrimaryColor,
          fontFace: 'Arial'
        });

        // Subtitle
        if (slide.subtitle) {
          pSlide.addText(slide.subtitle, {
            x: 0.8,
            y: 1.75,
            w: 8.5,
            h: 0.6,
            fontSize: 13,
            color: textSecondaryColor,
            fontFace: 'Arial'
          });
        }

        // Layout Renderers
        if (slide.layout === 'hero_badge') {
          if (slide.highlights && slide.highlights.length > 0) {
            slide.highlights.forEach((hl, i) => {
              const xPos = 0.8 + i * 2.8;
              pSlide.addShape(pptx.ShapeType.roundRect, {
                x: xPos,
                y: 3.2,
                w: 2.6,
                h: 1.2,
                fill: { color: cardBgColor },
                line: { color: primaryColor, width: 1 }
              });
              pSlide.addText(hl, {
                x: xPos + 0.15,
                y: 3.35,
                w: 2.3,
                h: 0.9,
                fontSize: 12,
                bold: true,
                color: textPrimaryColor,
                align: 'center'
              });
            });
          }
          if (slide.presenter) {
            pSlide.addText(`Presented by: ${slide.presenter} · ${slide.date || '2026'}`, {
              x: 0.8,
              y: 4.8,
              w: 8.0,
              h: 0.4,
              fontSize: 11,
              italic: true,
              color: textSecondaryColor
            });
          }
        } else if (slide.layout === 'stat_grid' && slide.stats) {
          slide.stats.forEach((st, i) => {
            const col = i % 4;
            const xPos = 0.8 + col * 2.15;
            pSlide.addShape(pptx.ShapeType.roundRect, {
              x: xPos,
              y: 2.7,
              w: 2.0,
              h: 2.2,
              fill: { color: cardBgColor },
              line: { color: primaryColor, width: 1 }
            });
            pSlide.addText(st.value, {
              x: xPos + 0.1,
              y: 2.9,
              w: 1.8,
              h: 0.7,
              fontSize: 28,
              bold: true,
              color: primaryColor,
              align: 'center'
            });
            pSlide.addText(st.label, {
              x: xPos + 0.1,
              y: 3.65,
              w: 1.8,
              h: 0.6,
              fontSize: 11,
              color: textSecondaryColor,
              align: 'center'
            });
            if (st.change) {
              pSlide.addText(st.change, {
                x: xPos + 0.1,
                y: 4.3,
                w: 1.8,
                h: 0.35,
                fontSize: 10,
                bold: true,
                color: accentColor,
                align: 'center'
              });
            }
          });
        } else if (slide.layout === 'split_comparison') {
          // Left Box
          pSlide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 2.6,
            w: 4.1,
            h: 2.5,
            fill: { color: cardBgColor },
            line: { color: 'E11D48', width: 1 }
          });
          pSlide.addText(slide.left?.title || 'Conventional Approach', {
            x: 1.0,
            y: 2.75,
            w: 3.7,
            h: 0.4,
            fontSize: 13,
            bold: true,
            color: 'E11D48'
          });
          const leftBullets = (slide.left?.items || []).map((it) => ({
            text: it,
            options: { bullet: true, fontSize: 11, color: textSecondaryColor, breakLine: true }
          }));
          pSlide.addText(leftBullets as any, { x: 1.0, y: 3.2, w: 3.7, h: 1.7 });

          // Right Box
          pSlide.addShape(pptx.ShapeType.roundRect, {
            x: 5.1,
            y: 2.6,
            w: 4.1,
            h: 2.5,
            fill: { color: cardBgColor },
            line: { color: '10B981', width: 1 }
          });
          pSlide.addText(slide.right?.title || 'workflowsAURA Solution', {
            x: 5.3,
            y: 2.75,
            w: 3.7,
            h: 0.4,
            fontSize: 13,
            bold: true,
            color: '059669'
          });
          const rightBullets = (slide.right?.items || []).map((it) => ({
            text: it,
            options: { bullet: true, fontSize: 11, color: textPrimaryColor, bold: true, breakLine: true }
          }));
          pSlide.addText(rightBullets as any, { x: 5.3, y: 3.2, w: 3.7, h: 1.7 });
        } else if (slide.layout === 'process_timeline' && slide.steps) {
          slide.steps.forEach((st, i) => {
            const xPos = 0.8 + i * 2.15;
            pSlide.addShape(pptx.ShapeType.roundRect, {
              x: xPos,
              y: 2.7,
              w: 2.0,
              h: 2.2,
              fill: { color: cardBgColor },
              line: { color: primaryColor, width: 1 }
            });
            pSlide.addText(st.step, {
              x: xPos + 0.15,
              y: 2.85,
              w: 1.7,
              h: 0.35,
              fontSize: 12,
              bold: true,
              color: accentColor
            });
            pSlide.addText(st.title, {
              x: xPos + 0.15,
              y: 3.25,
              w: 1.7,
              h: 0.5,
              fontSize: 12,
              bold: true,
              color: textPrimaryColor
            });
            pSlide.addText(st.desc, {
              x: xPos + 0.15,
              y: 3.8,
              w: 1.7,
              h: 0.95,
              fontSize: 9.5,
              color: textSecondaryColor
            });
          });
        } else if (slide.layout === 'quote_takeaway') {
          pSlide.addShape(pptx.ShapeType.roundRect, {
            x: 1.2,
            y: 2.6,
            w: 7.6,
            h: 2.3,
            fill: { color: cardBgColor },
            line: { color: primaryColor, width: 1.5 }
          });
          pSlide.addText(`“${slide.quote || ''}”`, {
            x: 1.5,
            y: 2.85,
            w: 7.0,
            h: 1.3,
            fontSize: 16,
            italic: true,
            bold: true,
            color: textPrimaryColor,
            align: 'center'
          });
          if (slide.author) {
            pSlide.addText(`— ${slide.author}`, {
              x: 1.5,
              y: 4.25,
              w: 7.0,
              h: 0.4,
              fontSize: 12,
              color: primaryColor,
              align: 'center'
            });
          }
        } else {
          const items = slide.features || [];
          items.forEach((ft, i) => {
            const xPos = 0.8 + i * 2.85;
            pSlide.addShape(pptx.ShapeType.roundRect, {
              x: xPos,
              y: 2.7,
              w: 2.7,
              h: 2.2,
              fill: { color: cardBgColor },
              line: { color: primaryColor, width: 1 }
            });
            if (ft.tag) {
              pSlide.addText(ft.tag.toUpperCase(), {
                x: xPos + 0.15,
                y: 2.85,
                w: 2.4,
                h: 0.3,
                fontSize: 9,
                bold: true,
                color: accentColor
              });
            }
            pSlide.addText(ft.title, {
              x: xPos + 0.15,
              y: 3.2,
              w: 2.4,
              h: 0.5,
              fontSize: 13,
              bold: true,
              color: textPrimaryColor
            });
            pSlide.addText(ft.desc, {
              x: xPos + 0.15,
              y: 3.75,
              w: 2.4,
              h: 1.0,
              fontSize: 10,
              color: textSecondaryColor
            });
          });
        }
      });

      const fileName = `${deck.deckTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
      await pptx.writeFile({ fileName });
      addToast(`PowerPoint deck downloaded as ${fileName}!`, 'success');
    } catch (err: any) {
      addToast(`Export PPTX failed: ${err.message}`, 'error');
    } finally {
      setIsExportingPptx(false);
    }
  };

  // ----------------- VECTOR PDF EXPORT ENGINE (jspdf + html2canvas) -----------------
  const handleExportPdf = async () => {
    if (!slideCanvasRef.current) return;
    setIsExportingPdf(true);
    addToast('Rendering high-resolution vector PDF...', 'info');

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      const originalSlideIndex = currentSlideIndex;

      for (let i = 0; i < deck.slides.length; i++) {
        setCurrentSlideIndex(i);
        await new Promise((r) => setTimeout(r, 150));

        if (slideCanvasRef.current) {
          const canvas = await html2canvas(slideCanvasRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: deck.theme.bgHex || '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage([1280, 720], 'landscape');
          pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        }
      }

      setCurrentSlideIndex(originalSlideIndex);
      const fileName = `${deck.deckTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      pdf.save(fileName);
      addToast(`PDF document saved as ${fileName}!`, 'success');
    } catch (err: any) {
      addToast(`PDF export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8FAFF] text-slate-800 font-sans">
      {/* Top Header Bar matching native AuraAI Header */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <Presentation className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">AI Slide & Doc Studio</h1>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                Dynamic Layouts
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Generates tailored presentations without hardcoded templates using semantic component grammars.
            </p>
          </div>
        </div>

        {/* Header Right Actions & Model Indicator */}
        <div className="flex items-center gap-3">
          {/* Active Model Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 shadow-2xs">
            {selectedModel.isLocal ? (
              <Server className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Cpu className="h-4 w-4 text-indigo-600 shrink-0" />
            )}
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Active Model</span>
              <span className="text-xs font-bold text-slate-800 max-w-[140px] sm:max-w-[180px] truncate">
                {selectedModel.name}
              </span>
            </div>
            <button
              onClick={() => setCurrentView('explore')}
              title="Change active model in Explore Models"
              className="ml-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer"
            >
              Switch
            </button>
          </div>

          {/* Export Actions */}
          <button
            onClick={handleExportPptx}
            disabled={isExportingPptx}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Download editable PowerPoint (.pptx) file"
          >
            {isExportingPptx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Export PPTX</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Download print-ready vector PDF file"
          >
            {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Present Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Sidebar */}
        {!isFullscreen && (
          <aside className="w-80 md:w-96 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between overflow-hidden shadow-2xs">
            {/* Sidebar Tab Selector */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/70">
              <div className="flex bg-slate-200/70 p-1 rounded-xl">
                <button
                  onClick={() => setSidebarTab('create')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    sidebarTab === 'create' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Generate
                </button>
                <button
                  onClick={() => setSidebarTab('slides')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    sidebarTab === 'slides' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Slides ({deck.slides.length})
                </button>
                <button
                  onClick={() => setSidebarTab('theme')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    sidebarTab === 'theme' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Themes
                </button>
                <button
                  onClick={() => setSidebarTab('history')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    sidebarTab === 'history' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sidebarTab === 'create' && (
                <div className="space-y-4">
                  {/* Model Selector within Form */}
                  <div className="space-y-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-2.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                        AI Generation Engine
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase font-mono">
                        {selectedModel.isLocal ? 'Local Mode' : 'Cloud API'}
                      </span>
                    </label>
                    <select
                      value={selectedModel.id}
                      onChange={(e) => {
                        const m = models.find((mod) => mod.id === e.target.value);
                        if (m) setSelectedModel(m);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <optgroup label="✨ Cloud Models (Google Gemini API)">
                        {models.filter((m) => !m.isLocal).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.providerName})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🖥️ Local Models (Ollama)">
                        {models.filter((m) => m.isLocal).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Local Ollama • Auto-Fallback to Gemini if offline)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Topic / Prompt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Presentation Topic / Prompt</span>
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="e.g. Series A pitch deck for an Autonomous Multi-Agent AI Healthcare Platform..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs leading-relaxed"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        'AI Multi-Agent Pitch Deck',
                        'Q3 SaaS Financial Health',
                        'Clean Energy 2030 Transition',
                        'Cybersecurity Zero Trust'
                      ].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setPrompt(chip)}
                          className="rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 px-2.5 py-0.5 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resource Document Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Resource Document (Optional)</span>
                      <span className="text-[10px] text-slate-400 font-mono">PDF, DOCX, TXT</span>
                    </label>
                    <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-3.5 hover:border-indigo-400 hover:bg-indigo-50/60 transition-all cursor-pointer">
                      <Upload className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="text-xs font-bold text-slate-700">
                        {sourceFile ? sourceFile.name : 'Upload PDF or Word Document'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {isParsingFile ? 'Extracting text...' : sourceFile ? `${fileCharCount.toLocaleString()} chars loaded` : 'AI extracts data, metrics, and insights'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.md,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {sourceFile && (
                      <button
                        onClick={() => {
                          setSourceFile(null);
                          setExtractedSourceText('');
                        }}
                        className="text-[10px] text-rose-500 hover:underline block text-right cursor-pointer"
                      >
                        Remove attached file
                      </button>
                    )}
                  </div>

                  {/* Slide Count Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Target Slide Count</span>
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                        {slideCount} Slides
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      value={slideCount}
                      onChange={(e) => setSlideCount(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Tone / Audience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tone & Narrative Arc</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="investor_pitch">Investor Pitch (High Impact, Visionary, Traction)</option>
                      <option value="tech_deep_dive">Tech Deep Dive (Architecture, Performance, Benchmarks)</option>
                      <option value="executive_brief">Executive Brief (Clear, Concise, Actionable)</option>
                      <option value="creative_bold">Creative & Bold (Provocative, Vibrant, Narrative)</option>
                      <option value="educational">Educational & Structured (Pillars, Chronology, Takeaways)</option>
                    </select>
                  </div>

                  {/* Theme Vibe Preference */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Visual Vibe Preference</label>
                    <select
                      value={themePreference}
                      onChange={(e) => setThemePreference(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="auto">Auto AI Selection (Matches topic sentiment)</option>
                      <option value="aura_indigo">Aura Indigo (Clean White, Deep Indigo)</option>
                      <option value="minimal_pearl">Minimal Pearl (Executive Light Slate)</option>
                      <option value="forest_emerald">Forest Emerald (Climate, Health, Organic)</option>
                      <option value="sunset_coral">Sunset Coral (Vibrant Warm Rose)</option>
                      <option value="obsidian_indigo">Obsidian Dark (Deep Modern Indigo)</option>
                      <option value="cyberpunk_neon">Cyberpunk Neon (Dark Synthwave)</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateDeck}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-2.5 text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer mt-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Composing Dynamic Layouts...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span>Generate Dynamic Deck</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab: Slide Navigator */}
              {sidebarTab === 'slides' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-slate-700">Slide Sequence</span>
                    <button
                      onClick={handleAddSlide}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Slide</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {deck.slides.map((s, idx) => {
                      const isActive = idx === currentSlideIndex;
                      return (
                        <div
                          key={s.id || idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition-all cursor-pointer border ${
                            isActive
                              ? 'border-indigo-500 bg-indigo-50/70 text-slate-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-mono font-bold ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-bold truncate text-[11px] text-slate-800">{s.title || `Slide ${idx + 1}`}</p>
                              <span className="text-[10px] uppercase font-mono text-indigo-600 font-semibold">{s.layout.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteSlide(idx, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete slide"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Theme Presets */}
              {sidebarTab === 'theme' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Click any theme to dynamically restyle all slides while preserving layout and content:
                  </p>
                  <div className="space-y-2">
                    {THEME_OPTIONS.map((th) => (
                      <div
                        key={th.id}
                        onClick={() => handleApplyTheme(th.id)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer ${
                          deck.theme.name.includes(th.name.split(' ')[0])
                            ? 'border-indigo-500 bg-indigo-50/60 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: th.bg }} />
                            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: th.primary }} />
                            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: th.accent }} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{th.name}</p>
                            <span className="text-[10px] uppercase font-mono text-slate-400">{th.mode} mode</span>
                          </div>
                        </div>
                        {deck.theme.name.includes(th.name.split(' ')[0]) && <Check className="h-4 w-4 text-indigo-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: History */}
              {sidebarTab === 'history' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Saved Presentations</span>
                  {isLoadingHistory ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    </div>
                  ) : savedDecks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No saved presentations yet.</p>
                  ) : (
                    savedDecks.map((d) => (
                      <div
                        key={d.id}
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE}/api/v1/presentation/${d.id}`);
                            if (res.ok) {
                              const loaded = await res.json();
                              setDeck(loaded);
                              setCurrentSlideIndex(0);
                              addToast(`Loaded "${d.deckTitle}"`, 'info');
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer shadow-2xs"
                      >
                        <p className="text-xs font-bold text-slate-800 truncate">{d.deckTitle}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{d.slideCount || 0} slides</span>
                          <span className="font-mono text-indigo-600">{d.modelUsed || 'gemini'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Footer info */}
            <div className="border-t border-slate-200 p-3 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="font-mono">{deck.aspectRatio || '16:9'} Widescreen</span>
              <span className="font-medium">{deck.slides.length} Dynamic Slides</span>
            </div>
          </aside>
        )}

        {/* Main Stage & Slide Canvas Viewport */}
        <main className="flex-1 flex flex-col items-center justify-between p-4 sm:p-8 bg-[#F1F5F9]/70 overflow-y-auto">
          {/* Slide Floating Controller */}
          <div className="flex items-center justify-between w-full max-w-5xl mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-2xs cursor-pointer"
                title="Previous Slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-700 px-2 bg-white border border-slate-200 rounded-lg py-1 shadow-2xs">
                Slide {currentSlideIndex + 1} of {deck.slides.length}
              </span>

              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === deck.slides.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-2xs cursor-pointer"
                title="Next Slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Slide Layout Switcher & Edit Mode Toggle */}
            <div className="flex items-center gap-2">
              {/* Layout Switcher */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">Layout:</span>
                <select
                  value={currentSlide.layout}
                  onChange={(e) => updateSlideField('layout', e.target.value as SlideLayoutType)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-2xs focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="hero_badge">Hero Title & Highlights</option>
                  <option value="stat_grid">Metric Stat Grid</option>
                  <option value="split_comparison">Split Comparison</option>
                  <option value="process_timeline">Process Timeline</option>
                  <option value="feature_matrix">Feature Matrix Pillars</option>
                  <option value="quote_takeaway">Editorial Quote & Takeaway</option>
                </select>
              </div>

              {/* Inline Edit Toggle */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  isEditing ? 'bg-amber-500 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditing ? 'Done Editing' : 'Edit Slide'}</span>
              </button>
            </div>
          </div>

          {/* 16:9 Aspect Ratio Interactive Slide Canvas Card */}
          <div
            ref={slideCanvasRef}
            style={{
              backgroundColor: deck.theme.bgHex || '#ffffff',
              color: deck.theme.textPrimary || '#0f172a',
              borderColor: deck.theme.borderColor || '#e2e8f0'
            }}
            className={`aspect-[16/9] w-full max-w-5xl rounded-3xl shadow-xl shadow-slate-300/40 relative overflow-hidden flex flex-col justify-between p-6 sm:p-12 transition-all border select-none ${
              deck.theme.background ? `bg-gradient-to-br ${deck.theme.background}` : 'bg-white'
            }`}
          >
            {/* Top Bar: Badge & Metadata */}
            <div className="flex items-center justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={currentSlide.badge || ''}
                  onChange={(e) => updateSlideField('badge', e.target.value)}
                  className="rounded-lg border border-indigo-500 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 focus:outline-none shadow-2xs"
                />
              ) : (
                <span
                  style={{
                    backgroundColor: deck.theme.badgeBg || '#eef2ff',
                    color: deck.theme.badgeText || deck.theme.primary || '#4f46e5',
                    borderColor: deck.theme.borderColor || '#e0e7ff'
                  }}
                  className="rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-2xs"
                >
                  {currentSlide.badge || 'INSIGHT'}
                </span>
              )}

              <span className="text-[10px] font-mono opacity-60 tracking-widest uppercase font-semibold">
                {deck.deckTitle} · {currentSlideIndex + 1}/{deck.slides.length}
              </span>
            </div>

            {/* Main Center Content: Dynamically Rendered by Layout Archetype */}
            <div className="my-auto py-2 sm:py-4 space-y-4">
              {/* Slide Title & Subtitle Header */}
              <div className="space-y-1.5">
                {isEditing ? (
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => updateSlideField('title', e.target.value)}
                    className="w-full rounded-lg border border-indigo-500 bg-white px-3 py-1 text-2xl sm:text-3xl font-extrabold focus:outline-none shadow-2xs"
                  />
                ) : (
                  <h2
                    style={{ color: deck.theme.textPrimary }}
                    className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight"
                  >
                    {currentSlide.title}
                  </h2>
                )}

                {currentSlide.subtitle && (
                  isEditing ? (
                    <input
                      type="text"
                      value={currentSlide.subtitle}
                      onChange={(e) => updateSlideField('subtitle', e.target.value)}
                      className="w-full rounded-lg border border-indigo-500 bg-white px-3 py-1 text-xs sm:text-sm text-slate-600 focus:outline-none shadow-2xs"
                    />
                  ) : (
                    <p
                      style={{ color: deck.theme.textSecondary }}
                      className="text-xs sm:text-base leading-relaxed max-w-3xl font-medium"
                    >
                      {currentSlide.subtitle}
                    </p>
                  )
                )}
              </div>

              {/* Archetype 1: hero_badge */}
              {currentSlide.layout === 'hero_badge' && (
                <div className="space-y-4 pt-2">
                  {currentSlide.highlights && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {currentSlide.highlights.map((hl, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: deck.theme.cardBg,
                            borderColor: deck.theme.borderColor
                          }}
                          className="rounded-2xl border p-4 shadow-sm flex items-center gap-2.5"
                        >
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: deck.theme.primary }} />
                          <span className="text-xs sm:text-sm font-bold text-slate-800">{hl}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentSlide.presenter && (
                    <p className="text-xs italic opacity-75 pt-2">
                      Presented by <strong style={{ color: deck.theme.primary }}>{currentSlide.presenter}</strong> · {currentSlide.date || '2026'}
                    </p>
                  )}
                </div>
              )}

              {/* Archetype 2: stat_grid */}
              {currentSlide.layout === 'stat_grid' && currentSlide.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  {currentSlide.stats.map((st, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: deck.theme.cardBg,
                        borderColor: deck.theme.borderColor
                      }}
                      className="rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <span
                          style={{ color: deck.theme.primary }}
                          className="text-3xl sm:text-5xl font-black tracking-tight"
                        >
                          {st.value}
                        </span>
                        <p
                          style={{ color: deck.theme.textSecondary }}
                          className="text-xs sm:text-sm font-semibold mt-1"
                        >
                          {st.label}
                        </p>
                      </div>
                      {st.change && (
                        <div className="mt-3">
                          <span
                            style={{
                              backgroundColor: deck.theme.badgeBg || '#eef2ff',
                              color: deck.theme.accent
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          >
                            <TrendingUp className="h-3 w-3" />
                            {st.change}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Archetype 3: split_comparison */}
              {currentSlide.layout === 'split_comparison' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Left Column (Traditional / Negative) */}
                  <div
                    style={{
                      backgroundColor: deck.theme.cardBg,
                      borderColor: '#fecdd3'
                    }}
                    className="rounded-2xl border p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <h3 className="text-sm font-bold text-rose-600">
                        {currentSlide.left?.title || 'Conventional Approach'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      {(currentSlide.left?.items || []).map((it, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column (workflowsAURA / Positive) */}
                  <div
                    style={{
                      backgroundColor: deck.theme.cardBg,
                      borderColor: '#bbf7d0'
                    }}
                    className="rounded-2xl border p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-emerald-700">
                        {currentSlide.right?.title || 'Next-Gen Intelligent Engine'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-800">
                      {(currentSlide.right?.items || []).map((it, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Archetype 4: process_timeline */}
              {currentSlide.layout === 'process_timeline' && currentSlide.steps && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  {currentSlide.steps.map((st, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: deck.theme.cardBg,
                        borderColor: deck.theme.borderColor
                      }}
                      className="rounded-2xl border p-4 shadow-sm flex flex-col justify-between space-y-2"
                    >
                      <span
                        style={{ color: deck.theme.primary }}
                        className="text-xs font-mono font-extrabold tracking-wider"
                      >
                        STEP {st.step}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{st.title}</h4>
                        <p
                          style={{ color: deck.theme.textSecondary }}
                          className="text-[11px] sm:text-xs mt-1 leading-relaxed"
                        >
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Archetype 5: feature_matrix */}
              {currentSlide.layout === 'feature_matrix' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                  {(currentSlide.features || []).map((ft, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: deck.theme.cardBg,
                        borderColor: deck.theme.borderColor
                      }}
                      className="rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {ft.tag && (
                          <span
                            style={{
                              backgroundColor: deck.theme.badgeBg || '#eef2ff',
                              color: deck.theme.primary
                            }}
                            className="inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2"
                          >
                            {ft.tag}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-slate-900">{ft.title}</h4>
                        <p
                          style={{ color: deck.theme.textSecondary }}
                          className="text-xs leading-relaxed mt-1.5"
                        >
                          {ft.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Archetype 6: quote_takeaway */}
              {currentSlide.layout === 'quote_takeaway' && (
                <div
                  style={{
                    backgroundColor: deck.theme.cardBg,
                    borderColor: deck.theme.borderColor
                  }}
                  className="rounded-3xl border p-6 sm:p-8 shadow-sm text-center max-w-3xl mx-auto my-2 space-y-4"
                >
                  <p className="text-lg sm:text-2xl font-serif italic font-bold leading-relaxed text-slate-800">
                    “{currentSlide.quote || 'Transforming communication through dynamic generative design.'}”
                  </p>
                  {currentSlide.author && (
                    <p
                      style={{ color: deck.theme.primary }}
                      className="text-xs sm:text-sm font-mono uppercase tracking-wider font-bold"
                    >
                      — {currentSlide.author}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Footer Bar */}
            <div className="flex items-center justify-between text-[10px] sm:text-xs opacity-60 border-t border-slate-200/80 pt-3 text-slate-500">
              <span>workflowsAURA Intelligent Engine</span>
              <span>Model: {deck.modelUsed || selectedModel.name}</span>
            </div>
          </div>

          {/* Quick Slide Switcher Carousel below */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-5xl py-1">
            {deck.slides.map((s, idx) => (
              <button
                key={s.id || idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlideIndex
                    ? 'w-8 bg-indigo-600 shadow-xs'
                    : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
