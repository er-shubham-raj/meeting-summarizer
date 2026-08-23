import React from 'react';
import { CheckSquare } from 'lucide-react';

interface DecisionsTabProps {
  keyDecisions: string[] | null;
}

export const DecisionsTab: React.FC<DecisionsTabProps> = ({ keyDecisions }) => {
  if (!keyDecisions || keyDecisions.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <CheckSquare className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-base font-semibold text-white">No key decisions recorded.</p>
        <p className="text-sm text-slate-400">The meeting discussion did not yield formal agreed decisions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Key Decisions Agreed Upon ({keyDecisions.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {keyDecisions.map((decision, index) => (
          <div
            key={index}
            className="bg-dark-card border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-dark-card to-dark-card rounded-2xl p-5 flex items-start space-x-4 shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-medium text-white leading-relaxed">{decision}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
