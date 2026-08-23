import React, { useEffect, useState, useCallback } from 'react';
import { Meeting } from '../types';
import { api } from '../services/api';
import { MeetingCard } from '../components/MeetingCard';
import { AudioUploader } from '../components/AudioUploader';
import { ProcessingTracker } from '../components/ProcessingTracker';
import { Plus, Search, FileAudio, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [processingMeetingId, setProcessingMeetingId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await api.getMeetings(searchQuery);
      if (res.success && res.data) {
        setMeetings(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch meetings:', err);
      toast.error('Could not load meetings list.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting recording and summary?')) {
      return;
    }

    try {
      const res = await api.deleteMeeting(id);
      if (res.success) {
        toast.success('Meeting deleted successfully.');
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete meeting.');
    }
  };

  const totalCount = meetings.length;
  const completedCount = meetings.filter((m) => m.status === 'COMPLETED').length;
  const processingCount = meetings.filter(
    (m) => m.status === 'TRANSCRIBING' || m.status === 'SUMMARIZING' || m.status === 'UPLOADED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Meeting Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Speech-to-text transcripts, executive summaries, and action item extraction powered by OpenAI
          </p>
        </div>

        <button
          onClick={() => {
            setProcessingMeetingId(null);
            setShowUploadModal(true);
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-brand-500/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Audio File</span>
        </button>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <FileAudio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Meetings</p>
            <p className="text-2xl font-extrabold text-white">{totalCount}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Analyses</p>
            <p className="text-2xl font-extrabold text-white">{completedCount}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing Queue</p>
            <p className="text-2xl font-extrabold text-white">{processingCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-white tracking-tight self-start">Recent Meetings</h2>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Meetings List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-dark-card/50 border border-dark-border rounded-2xl p-5 space-y-4" />
          ))}
        </div>
      ) : meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onDelete={handleDeleteMeeting} />
          ))}
        </div>
      ) : (
        /* Useful Empty State */
        <div className="glass-panel rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Meetings Recorded Yet</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Upload your first meeting audio file (MP3, WAV, M4A) to automatically transcribe speech, extract key decisions, and assign action items.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Your First Meeting</span>
          </button>
        </div>
      )}

      {/* Upload & Processing Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          {!processingMeetingId ? (
            <AudioUploader
              onUploadSuccess={(meetingId) => {
                setProcessingMeetingId(meetingId);
                fetchMeetings();
              }}
              onClose={() => setShowUploadModal(false)}
            />
          ) : (
            <ProcessingTracker
              meetingId={processingMeetingId}
              onComplete={() => {
                toast.success('Meeting analysis finished!');
                setShowUploadModal(false);
                setProcessingMeetingId(null);
                fetchMeetings();
              }}
              onFailed={() => {
                fetchMeetings();
              }}
              onClose={() => {
                setShowUploadModal(false);
                setProcessingMeetingId(null);
                fetchMeetings();
              }}
              onCancel={() => {
                setShowUploadModal(false);
                setProcessingMeetingId(null);
                fetchMeetings();
              }}
              onTryAgain={() => {
                setProcessingMeetingId(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
