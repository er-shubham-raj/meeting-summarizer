import React from 'react';
import { Meeting } from '../types';
import { Sparkles, CheckSquare, MessageSquareText } from 'lucide-react';

interface SummaryTabProps {
  meeting: Meeting;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ meeting }) => {
  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="bg-gradient-to-r from-brand-900/40 via-dark-card to-indigo-900/30 border border-brand-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-brand-400 font-bold text-sm uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Executive Summary</span>
        </div>
        <p className="text-slate-100 text-base leading-relaxed font-normal">
          {meeting.summary || 'No summary generated yet.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Decisions Preview */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" />
            <span>Key Decisions ({meeting.keyDecisions?.length || 0})</span>
          </div>

          {meeting.keyDecisions && meeting.keyDecisions.length > 0 ? (
            <ul className="space-y-3">
              {meeting.keyDecisions.map((decision, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 text-sm text-slate-200 bg-dark-bg/60 border border-dark-border p-3 rounded-xl"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-snug">{decision}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No formal decisions recorded.</p>
          )}
        </div>

        {/* Important Discussion Points */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
            <MessageSquareText className="w-4 h-4" />
            <span>Important Discussion Points ({meeting.importantPoints?.length || 0})</span>
          </div>

          {meeting.importantPoints && meeting.importantPoints.length > 0 ? (
            <ul className="space-y-3">
              {meeting.importantPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 text-sm text-slate-200 bg-dark-bg/60 border border-dark-border p-3 rounded-xl"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-2" />
                  <span className="leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No discussion points recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};
