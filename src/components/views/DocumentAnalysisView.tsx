import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DocumentAnalysisView: React.FC = () => {
  const { startNewChat, addToast, deductCredits, executionMode } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<string | null>('system_architecture_whitepaper.pdf');
  const [analyzing, setAnalyzing] = useState(false);

  const sampleDocuments = [
    {
      name: 'system_architecture_whitepaper.pdf',
      size: '2.4 MB',
      pages: 18,
      status: 'Indexed & Ready',
      summary: 'High-availability multi-cloud Kubernetes deployment blueprint with zero-trust networking.'
    },
    {
      name: 'quarterly_saas_metrics_q3.csv',
      size: '840 KB',
      pages: 4,
      status: 'Indexed & Ready',
      summary: 'User retention cohort analysis, MRR growth, and API token burn rates.'
    }
  ];

  const handleAskQuestion = (question: string) => {
    if (executionMode === 'platform_managed') {
      deductCredits(2, 'Document Vector Semantic Query');
    }
    const fullPrompt = `Based on the document "${selectedDoc}":\n\n${question}\n\nPlease cite page numbers or sections where relevant.`;
    startNewChat(fullPrompt);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
          <FileText className="h-4 w-4" />
          <span>DEEP DOCUMENT RETRIEVAL (RAG)</span>
        </div>
        <h1 className="text-2xl font-bold text-[#172554]">Document & File Analysis</h1>
        <p className="text-xs text-slate-500">
          Upload PDF whitepapers, spreadsheets, and technical docs for semantic chunking and instant Q&A.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => addToast('Document upload dialog triggered. Supported: PDF, DOCX, CSV, TXT.', 'info')}
        className="rounded-3xl border-2 border-dashed border-indigo-200 bg-white p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer shadow-2xs group"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform mb-3">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Documents for AI Analysis</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
          Drag and drop your files here or click to browse. Files are chunked and converted to local vectors.
        </p>
        <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Max 25MB per file • PDF, TXT, CSV, Markdown
        </span>
      </div>

      {/* Ready Documents List */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Indexed Documents Ready for Querying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleDocuments.map((doc, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedDoc(doc.name)}
              className={`rounded-2xl border p-5 bg-white shadow-2xs transition-all cursor-pointer ${
                selectedDoc === doc.name
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                    <span className="text-[10px] text-slate-400">
                      {doc.size} • {doc.pages} pages
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {doc.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{doc.summary}</p>
              <div className="flex items-center text-xs font-semibold text-indigo-600">
                <span>Select for Q&A</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Q&A Prompts for Selected Doc */}
      {selectedDoc && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Suggested Questions for: <span className="text-indigo-600">{selectedDoc}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              'Summarize the core architectural recommendations in 5 bullet points.',
              'Extract all security compliance measures and threat mitigation steps.',
              'What are the key cost optimization strategies highlighted in section 3?',
              'Generate an executive summary table comparing proposed vs legacy stacks.'
            ].map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleAskQuestion(q)}
                className="text-left rounded-xl bg-slate-50 hover:bg-indigo-50 p-3 text-slate-700 hover:text-indigo-900 transition-colors border border-slate-100 flex items-center justify-between"
              >
                <span>{q}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
