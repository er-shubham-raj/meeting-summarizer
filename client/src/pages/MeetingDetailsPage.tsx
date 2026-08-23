import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Meeting } from '../types';
import { api } from '../services/api';
import { SummaryTab } from '../components/SummaryTab';
import { TranscriptTab } from '../components/TranscriptTab';
import { ActionItemsTab } from '../components/ActionItemsTab';
import { DecisionsTab } from '../components/DecisionsTab';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  CheckSquare,
  ListTodo,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'summary' | 'transcript' | 'action-items' | 'decisions';

export const MeetingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const res = await api.getMeetingById(id);
        if (res.success && res.data) {
          setMeeting(res.data);
        } else {
          toast.error('Meeting not found.');
        }
      } catch (err: any) {
        console.error('Error fetching meeting details:', err);
        toast.error('Could not load meeting details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this meeting recording?')) return;

    try {
      const res = await api.deleteMeeting(id);
      if (res.success) {
        toast.success('Meeting deleted.');
        navigate('/');
      }
    } catch {
      toast.error('Failed to delete meeting.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading meeting recording and analysis...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Meeting Not Found</h2>
        <p className="text-sm text-slate-400">The requested meeting ID does not exist or has been deleted.</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Action items header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={handleDelete}
          className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl border border-red-500/20 transition-colors self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Meeting</span>
        </button>
      </div>

      {/* Meeting Overview Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{meeting.title}</h1>

          {/* Status Badge */}
          {meeting.status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Completed Analysis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Clock className="w-4 h-4" /> Status: {meeting.status}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-2 border-t border-dark-border/60">
          <div>
            <span className="text-slate-500">Filename:</span>{' '}
            <span className="text-slate-300 font-medium">{meeting.originalFileName}</span>
          </div>
          <div>
            <span className="text-slate-500">File Size:</span>{' '}
            <span className="text-slate-300 font-medium">
              {(meeting.fileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <div>
            <span className="text-slate-500">Date:</span>{' '}
            <span className="text-slate-300 font-medium">
              {new Date(meeting.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex border-b border-dark-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'summary'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'transcript'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Full Transcript</span>
        </button>

        <button
          onClick={() => setActiveTab('action-items')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'action-items'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Action Items ({meeting.actionItems?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'decisions'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Key Decisions ({meeting.keyDecisions?.length || 0})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'summary' && <SummaryTab meeting={meeting} />}
        {activeTab === 'transcript' && (
          <TranscriptTab transcript={meeting.transcript} title={meeting.title} />
        )}
        {activeTab === 'action-items' && <ActionItemsTab actionItems={meeting.actionItems} />}
        {activeTab === 'decisions' && <DecisionsTab keyDecisions={meeting.keyDecisions} />}
      </div>
    </div>
  );
};
