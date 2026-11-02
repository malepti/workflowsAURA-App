import React, { useState } from 'react';
import { UserCheck, Check, Sparkles, Send, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { HITLQuestion } from '../../types';

interface HITLQuestionCardProps {
  question: HITLQuestion;
  conversationId: string;
  onSubmit: (
    conversationId: string,
    questionId: string,
    selectedOptionIds: string[],
    selectedOptionLabels: string[],
    customText?: string
  ) => void;
  isSubmitting?: boolean;
}

export const HITLQuestionCard: React.FC<HITLQuestionCardProps> = ({
  question,
  conversationId,
  onSubmit,
  isSubmitting = false
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    question.selectedOptionIds || (question.options.find(o => o.recommended)?.id ? [question.options.find(o => o.recommended)!.id] : [])
  );
  const [customText, setCustomText] = useState(question.customResponse || '');

  const isAnswered = question.status === 'answered';

  const handleToggleOption = (id: string) => {
    if (isAnswered || isSubmitting) return;

    if (question.multiSelect) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(item => item !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || isSubmitting) return;
    if (selectedIds.length === 0 && !customText.trim()) return;

    const selectedLabels = question.options
      .filter(o => selectedIds.includes(o.id))
      .map(o => o.label);

    onSubmit(conversationId, question.id, selectedIds, selectedLabels, customText.trim() || undefined);
  };

  return (
    <div className={`my-3.5 rounded-2xl border transition-all ${
      isAnswered
        ? 'border-emerald-200/90 bg-emerald-50/30'
        : 'border-indigo-200/90 bg-gradient-to-b from-indigo-50/50 via-white to-white shadow-sm ring-1 ring-indigo-500/10'
    } p-4 sm:p-5 space-y-4 font-sans text-slate-800`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/70 pb-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            isAnswered ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
          }`}>
            {isAnswered ? <CheckCircle2 className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Human-in-the-Loop Clarification
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isAnswered 
                  ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' 
                  : 'bg-indigo-100/80 text-indigo-700 border-indigo-200 animate-pulse'
              }`}>
                {isAnswered ? 'Decision Confirmed' : 'Input Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAnswered 
                ? `Confirmed at ${question.answeredAt || 'recent'} • Agent resumed with your directive`
                : 'The agent paused execution to request your strategic guidance before proceeding'}
            </p>
          </div>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="text-sm font-semibold text-slate-900 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
        <span>{question.prompt}</span>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={isAnswered || isSubmitting}
              onClick={() => handleToggleOption(option.id)}
              className={`w-full text-left rounded-xl p-3 border transition-all flex items-start gap-3 ${
                isSelected
                  ? isAnswered
                    ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 text-emerald-950'
                    : 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/20 text-indigo-950 shadow-xs'
                  : isAnswered
                    ? 'border-slate-200/60 bg-slate-50/40 opacity-60 text-slate-500'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-${
                question.multiSelect ? 'md' : 'full'
              } border transition-all ${
                isSelected
                  ? isAnswered
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold">{option.label}</span>
                  {option.recommended && (
                    <span className="rounded-md bg-indigo-600/10 border border-indigo-500/30 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                      Recommended
                    </span>
                  )}
                </div>
                {option.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Notes / Directive Input */}
      {question.allowCustomText && (
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-semibold text-slate-700 block">
            {isAnswered ? 'Your Additional Guidance / Constraints:' : 'Additional Instructions (Optional):'}
          </label>
          {isAnswered ? (
            customText ? (
              <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-mono text-emerald-900">
                "{customText}"
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">No additional custom notes provided.</div>
            )
          ) : (
            <textarea
              rows={2}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Please also configure CORS, rate limiting, and write unit tests for this approach..."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
            />
          )}
        </div>
      )}

      {/* Confirmation Submit Bar (only if pending) */}
      {!isAnswered && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-indigo-100/60">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            Selection directly steers the agent's next execution step
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedIds.length === 0 && !customText.trim())}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSubmitting ? (
              <span>Resuming Agent...</span>
            ) : (
              <>
                <span>Confirm Decision & Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
