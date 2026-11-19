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

// Default starter presentation deck
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
    name: 'Obsidian Indigo',
    mode: 'dark',
    background: 'from-[#090d16] via-[#0f172a] to-[#1e1b4b]',
    bgHex: '#0b0f19',
    primary: '#6366f1',
    accent: '#22d3ee',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    cardBg: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeText: '#a5b4fc',
    fontHeading: 'Inter, sans-serif',
    fontBody: 'Inter, sans-serif'
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
  { id: 'obsidian_indigo', name: 'Obsidian Indigo', mode: 'dark', primary: '#6366f1', accent: '#22d3ee', bg: '#0b0f19' },
  { id: 'cyberpunk_neon', name: 'Cyberpunk Neon', mode: 'dark', primary: '#ec4899', accent: '#06b6d4', bg: '#050505' },
  { id: 'minimal_pearl', name: 'Minimal Pearl', mode: 'light', primary: '#2563eb', accent: '#0d9488', bg: '#ffffff' },
  { id: 'forest_emerald', name: 'Forest Emerald', mode: 'dark', primary: '#10b981', accent: '#34d399', bg: '#022c22' },
  { id: 'sunset_coral', name: 'Sunset Coral', mode: 'dark', primary: '#f43f5e', accent: '#fb923c', bg: '#1a0a1e' }
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
      if (isEditing) return; // don't navigate when typing
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
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
      addToast(`Dynamic deck "${newDeck.deckTitle}" generated with ${newDeck.slides.length} slides!`, 'success');
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
      badge: 'NEW SLIDE',
      title: 'New Section Title',
      subtitle: 'Add a supporting explanation or key takeaway here.',
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
      background: found.mode === 'dark' ? `from-[#090d16] via-[#0f172a] to-[#1e1b4b]` : `from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]`,
      bgHex: found.bg,
      primary: found.primary,
      accent: found.accent,
      textPrimary: found.mode === 'dark' ? '#f8fafc' : '#0f172a',
      textSecondary: found.mode === 'dark' ? '#94a3b8' : '#64748b',
      cardBg: found.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
      borderColor: found.mode === 'dark' ? 'rgba(99, 102, 241, 0.25)' : '#e2e8f0',
      badgeBg: found.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : '#eff6ff',
      badgeText: found.mode === 'dark' ? '#a5b4fc' : '#1d4ed8',
      fontHeading: 'Inter, sans-serif',
      fontBody: 'Inter, sans-serif'
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
      const primaryColor = theme.primary.replace('#', '') || '6366F1';
      const accentColor = theme.accent.replace('#', '') || '22D3EE';
      const textPrimaryColor = isDark ? 'F8FAFC' : '0F172A';
      const textSecondaryColor = isDark ? '94A3B8' : '64748B';
      const cardBgColor = isDark ? '1E293B' : 'F1F5F9';

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

        // Render based on layout archetype
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
            color: 'F43F5E'
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
            color: '10B981'
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
              color: accentColor,
              align: 'center'
            });
          }
        } else {
          // feature_matrix or fallback
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

      // Loop through all slides and snapshot
      for (let i = 0; i < deck.slides.length; i++) {
        setCurrentSlideIndex(i);
        // Wait for DOM to render slide
        await new Promise((r) => setTimeout(r, 150));

        if (slideCanvasRef.current) {
          const canvas = await html2canvas(slideCanvasRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: deck.theme.bgHex || '#0b0f19'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage([1280, 720], 'landscape');
          pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        }
      }

      // Restore original slide
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
    <div className="flex h-[calc(100vh-64px)] w-full flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                AI Slide & Doc Studio
                <span className="rounded-full bg-indigo-500/10 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                  Dynamic Layouts
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Generates tailored presentations without hardcoded templates using semantic component grammars
            </p>
          </div>
        </div>

        {/* Model Indicator & Quick Switch */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 shadow-xs">
            {selectedModel.isLocal ? (
              <Server className="h-4 w-4 text-emerald-400 animate-pulse" />
            ) : (
              <Cpu className="h-4 w-4 text-indigo-400" />
            )}
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Model</span>
              <span className="text-xs font-semibold text-slate-200">{selectedModel.name}</span>
            </div>
            <button
              onClick={() => setCurrentView('explore')}
              title="Change active model in Explore Models"
              className="ml-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
            >
              Switch
            </button>
          </div>

          {/* Export Actions */}
          <button
            onClick={handleExportPptx}
            disabled={isExportingPptx}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Download editable PowerPoint (.pptx) file"
          >
            {isExportingPptx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Export PPTX</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Download print-ready vector PDF file"
          >
            {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
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
          <aside className="w-80 md:w-96 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between overflow-hidden">
            {/* Sidebar Tab Selector */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
              <button
                onClick={() => setSidebarTab('create')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sidebarTab === 'create' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Generate
              </button>
              <button
                onClick={() => setSidebarTab('slides')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sidebarTab === 'slides' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Slides ({deck.slides.length})
              </button>
              <button
                onClick={() => setSidebarTab('theme')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sidebarTab === 'theme' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Themes
              </button>
              <button
                onClick={() => setSidebarTab('history')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sidebarTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                History
              </button>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sidebarTab === 'create' && (
                <div className="space-y-4">
                  {/* Topic / Prompt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Presentation Topic / Prompt</span>
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Series A pitch deck for an Autonomous Multi-Agent AI Healthcare Platform..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        'AI Multi-Agent Pitch Deck',
                        'Q3 SaaS Financial Health',
                        'Clean Energy 2030 Transition',
                        'Cybersecurity Zero Trust'
                      ].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setPrompt(chip)}
                          className="rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resource Document Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Resource Document (Optional)</span>
                      <span className="text-[10px] text-slate-400">PDF, DOCX, TXT</span>
                    </label>
                    <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-3 hover:border-indigo-500 hover:bg-slate-800/40 transition-all cursor-pointer">
                      <Upload className="h-5 w-5 text-indigo-400 mb-1" />
                      <span className="text-xs font-medium text-slate-300">
                        {sourceFile ? sourceFile.name : 'Upload PDF / Word Document'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {isParsingFile ? 'Extracting text...' : sourceFile ? `${fileCharCount.toLocaleString()} chars loaded` : 'AI will extract key facts and numbers'}
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
                        className="text-[10px] text-rose-400 hover:underline block text-right cursor-pointer"
                      >
                        Remove attached file
                      </button>
                    )}
                  </div>

                  {/* Slide Count Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Target Slide Count</span>
                      <span className="font-mono text-indigo-400 font-bold">{slideCount} Slides</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      value={slideCount}
                      onChange={(e) => setSlideCount(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Tone / Audience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Tone & Narrative Arc</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
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
                    <label className="text-xs font-bold text-slate-300">Visual Vibe Preference</label>
                    <select
                      value={themePreference}
                      onChange={(e) => setThemePreference(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="auto">Auto AI Selection (Matches topic sentiment)</option>
                      <option value="obsidian_indigo">Obsidian Indigo (Dark Modern, Deep Purples)</option>
                      <option value="cyberpunk_neon">Cyberpunk Neon (Dark Synthwave, High Contrast)</option>
                      <option value="minimal_pearl">Minimal Pearl (Clean Light, Enterprise Slate)</option>
                      <option value="forest_emerald">Forest Emerald (Climate, Health, Organic)</option>
                      <option value="sunset_coral">Sunset Coral (Vibrant Rose & Warm Accents)</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateDeck}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white py-2.5 text-xs font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer mt-2"
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
                    <span className="text-xs font-bold text-slate-300">Slide Sequence</span>
                    <button
                      onClick={handleAddSlide}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
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
                              ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-xs'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-semibold truncate text-[11px]">{s.title || `Slide ${idx + 1}`}</p>
                              <span className="text-[10px] uppercase font-mono text-indigo-400">{s.layout.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteSlide(idx, e)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
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
                  <p className="text-xs text-slate-400">
                    Click any theme to dynamically restyle all slides while preserving layout and content:
                  </p>
                  <div className="space-y-2">
                    {THEME_OPTIONS.map((th) => (
                      <div
                        key={th.id}
                        onClick={() => handleApplyTheme(th.id)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer ${
                          deck.theme.name === th.name
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: th.bg }} />
                            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: th.primary }} />
                            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: th.accent }} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{th.name}</p>
                            <span className="text-[10px] uppercase text-slate-400">{th.mode} mode</span>
                          </div>
                        </div>
                        {deck.theme.name === th.name && <Check className="h-4 w-4 text-indigo-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: History */}
              {sidebarTab === 'history' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">Saved Presentations</span>
                  {isLoadingHistory ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    </div>
                  ) : savedDecks.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No saved presentations yet.</p>
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
                        className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 hover:border-indigo-500 hover:bg-slate-800/60 transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-200 truncate">{d.deckTitle}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{d.slideCount || 0} slides</span>
                          <span>{d.modelUsed || 'gemini'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Footer info */}
            <div className="border-t border-slate-800 p-3 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="font-mono">{deck.aspectRatio || '16:9'} Widescreen</span>
              <span>{deck.slides.length} Dynamic Slides</span>
            </div>
          </aside>
        )}

        {/* Main Stage & Slide Canvas Viewport */}
        <main className="flex-1 flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-900/60 overflow-y-auto">
          {/* Slide Floating Controller */}
          <div className="flex items-center justify-between w-full max-w-5xl mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                title="Previous Slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-300 px-2">
                Slide {currentSlideIndex + 1} of {deck.slides.length}
              </span>

              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === deck.slides.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                title="Next Slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Slide Layout Switcher & Edit Mode Toggle */}
            <div className="flex items-center gap-2">
              {/* Layout Switcher */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Layout:</span>
                <select
                  value={currentSlide.layout}
                  onChange={(e) => updateSlideField('layout', e.target.value as SlideLayoutType)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isEditing ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditing ? 'Done Editing' : 'Edit Slide'}</span>
              </button>
            </div>
          </div>

          {/* 16:9 Aspect Ratio Interactive Slide Canvas */}
          <div
            ref={slideCanvasRef}
            style={{
              backgroundColor: deck.theme.bgHex || '#0b0f19',
              color: deck.theme.textPrimary || '#f8fafc',
              borderColor: deck.theme.borderColor || 'rgba(99, 102, 241, 0.25)'
            }}
            className={`aspect-[16/9] w-full max-w-5xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-12 transition-all border border-opacity-40 select-none ${
              deck.theme.background ? `bg-gradient-to-br ${deck.theme.background}` : ''
            }`}
          >
            {/* Top Bar: Badge & Metadata */}
            <div className="flex items-center justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={currentSlide.badge || ''}
                  onChange={(e) => updateSlideField('badge', e.target.value)}
                  className="rounded-lg border border-indigo-500 bg-slate-900/60 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400 focus:outline-none"
                />
              ) : (
                <span
                  style={{
                    backgroundColor: deck.theme.badgeBg || 'rgba(99, 102, 241, 0.15)',
                    color: deck.theme.badgeText || deck.theme.accent || '#a5b4fc',
                    borderColor: deck.theme.borderColor || 'rgba(99, 102, 241, 0.3)'
                  }}
                  className="rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-xs"
                >
                  {currentSlide.badge || 'INSIGHT'}
                </span>
              )}

              <span className="text-[10px] font-mono opacity-50 tracking-widest uppercase">
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
                    className="w-full rounded-lg border border-indigo-500 bg-slate-900/60 px-3 py-1 text-2xl sm:text-3xl font-extrabold focus:outline-none"
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
                      className="w-full rounded-lg border border-indigo-500 bg-slate-900/60 px-3 py-1 text-xs sm:text-sm text-slate-300 focus:outline-none"
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
                          className="rounded-2xl border p-4 backdrop-blur-md shadow-xs flex items-center gap-2.5"
                        >
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: deck.theme.accent }} />
                          <span className="text-xs sm:text-sm font-semibold">{hl}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentSlide.presenter && (
                    <p className="text-xs italic opacity-75 pt-2">
                      Presented by <strong style={{ color: deck.theme.accent }}>{currentSlide.presenter}</strong> · {currentSlide.date || '2026'}
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
                      className="rounded-2xl border p-4 sm:p-5 flex flex-col justify-between backdrop-blur-md shadow-xs"
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
                              backgroundColor: deck.theme.badgeBg || 'rgba(99, 102, 241, 0.15)',
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
                      borderColor: 'rgba(244, 63, 94, 0.3)'
                    }}
                    className="rounded-2xl border p-4 sm:p-5 backdrop-blur-md space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-400" />
                      <h3 className="text-sm font-bold text-rose-400">
                        {currentSlide.left?.title || 'Conventional Approach'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                      {(currentSlide.left?.items || []).map((it, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column (workflowsAURA / Positive) */}
                  <div
                    style={{
                      backgroundColor: deck.theme.cardBg,
                      borderColor: 'rgba(16, 185, 129, 0.35)'
                    }}
                    className="rounded-2xl border p-4 sm:p-5 backdrop-blur-md space-y-3 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-emerald-400">
                        {currentSlide.right?.title || 'Next-Gen Intelligent Engine'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm font-medium">
                      {(currentSlide.right?.items || []).map((it, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
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
                      className="rounded-2xl border p-4 backdrop-blur-md flex flex-col justify-between space-y-2"
                    >
                      <span
                        style={{ color: deck.theme.accent }}
                        className="text-xs font-mono font-extrabold tracking-wider"
                      >
                        STEP {st.step}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold">{st.title}</h4>
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
                      className="rounded-2xl border p-4 sm:p-5 backdrop-blur-md flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {ft.tag && (
                          <span
                            style={{
                              backgroundColor: deck.theme.badgeBg || 'rgba(99, 102, 241, 0.15)',
                              color: deck.theme.accent
                            }}
                            className="inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2"
                          >
                            {ft.tag}
                          </span>
                        )}
                        <h4 className="text-sm font-bold">{ft.title}</h4>
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
                  className="rounded-3xl border p-6 sm:p-8 backdrop-blur-md text-center max-w-3xl mx-auto my-2 space-y-4"
                >
                  <p className="text-lg sm:text-2xl font-serif italic font-bold leading-relaxed">
                    “{currentSlide.quote || 'Transforming communication through dynamic generative design.'}”
                  </p>
                  {currentSlide.author && (
                    <p
                      style={{ color: deck.theme.accent }}
                      className="text-xs sm:text-sm font-mono uppercase tracking-wider font-bold"
                    >
                      — {currentSlide.author}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Footer Bar */}
            <div className="flex items-center justify-between text-[10px] sm:text-xs opacity-60 border-t border-slate-700/40 pt-3">
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
                    ? 'w-8 bg-indigo-500 shadow-xs'
                    : 'w-2.5 bg-slate-700 hover:bg-slate-500'
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
