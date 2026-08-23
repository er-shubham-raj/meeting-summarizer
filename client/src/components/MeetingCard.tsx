import React from 'react';
import { Meeting } from '../types';
import { FileAudio, Calendar, ChevronRight, CheckCircle2, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MeetingCardProps {
  meeting: Meeting;
  onDelete?: (id: string) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onDelete }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'TRANSCRIBING':
      case 'SUMMARIZING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {meeting.title}
          </h3>
          {getStatusBadge()}
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-3">
          <FileAudio className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{meeting.originalFileName}</span>
        </div>

        {meeting.summary && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
            {meeting.summary}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dark-border/60 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatDate(meeting.createdAt)}</span>
        </div>

        <div className="flex items-center space-x-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(meeting.id);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete meeting"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <Link
            to={`/meetings/${meeting.id}`}
            className="flex items-center space-x-1 text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            <span>View Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
