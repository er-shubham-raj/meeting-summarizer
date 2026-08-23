import React from 'react';
import { ActionItem } from '../types';
import { CheckCircle2, User, Calendar, AlertCircle } from 'lucide-react';

interface ActionItemsTabProps {
  actionItems: ActionItem[] | null;
}

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({ actionItems }) => {
  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-base font-semibold text-white">No action items assigned.</p>
        <p className="text-sm text-slate-400">The transcript did not contain specific deliverables or task assignments.</p>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Action Items & Deliverables ({actionItems.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {actionItems.map((item, index) => (
          <div
            key={index}
            className="bg-dark-card border border-dark-border hover:border-brand-500/40 transition-all rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
          >
            {/* Task title */}
            <div className="flex items-start space-x-3.5">
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white leading-snug">{item.task}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {/* Owner */}
                  <div className="flex items-center space-x-1.5 bg-dark-bg px-2.5 py-1 rounded-lg border border-dark-border">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Owner: {item.owner || 'Unassigned'}</span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center space-x-1.5 bg-dark-bg px-2.5 py-1 rounded-lg border border-dark-border">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deadline: {item.deadline || 'No deadline'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority badge */}
            <div className="shrink-0 self-start md:self-center">
              {getPriorityBadge(item.priority)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
