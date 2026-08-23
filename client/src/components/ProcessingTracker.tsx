import React, { useEffect, useState } from 'react';
import { MeetingStatus } from '../types';
import { api } from '../services/api';
import { Loader2, CheckCircle2, AlertTriangle, FileText, Sparkles, Database, X, RefreshCw, ArrowRight } from 'lucide-react';

interface ProcessingTrackerProps {
  meetingId: string;
  onComplete: () => void;
  onFailed?: (error: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  onTryAgain?: () => void;
}

const STEPS: { status: MeetingStatus; label: string; icon: any }[] = [
  { status: 'UPLOADED', label: 'Audio Uploaded', icon: FileText },
  { status: 'TRANSCRIBING', label: 'Transcribing Audio (Groq Whisper STT)', icon: Loader2 },
  { status: 'SUMMARIZING', label: 'Generating LLM Summary & Action Items', icon: Sparkles },
  { status: 'COMPLETED', label: 'Finalizing Meeting Analysis', icon: Database },
];

export const ProcessingTracker: React.FC<ProcessingTrackerProps> = ({
  meetingId,
  onComplete,
  onFailed,
  onCancel,
  onClose,
  onTryAgain,
}) => {
  const [currentStatus, setCurrentStatus] = useState<MeetingStatus>('UPLOADED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    let timer: ReturnType<typeof setTimeout>;

    const pollStatus = async () => {
      try {
        const res = await api.getMeetingStatus(meetingId);
        if (!isSubscribed) return;

        if (res.success && res.data) {
          const status = res.data.status;
          setCurrentStatus(status);

          if (status === 'COMPLETED') {
            onComplete();
            return;
          }

          if (status === 'FAILED') {
            const err = res.data.errorMessage || 'An error occurred during speech-to-text summarization.';
            setErrorMessage(err);
            if (onFailed) onFailed(err);
            return; // Stop polling on failure
          }
        }
      } catch (err: any) {
        console.error('Status polling error:', err?.message || err);
        const is404 = err?.response?.status === 404;
        const msg = is404
          ? 'Meeting processing session expired or not found. Please re-upload.'
          : err?.response?.data?.message || err?.message || 'Database or server connection error.';

        setCurrentStatus('FAILED');
        setErrorMessage(msg);
        if (onFailed) onFailed(msg);
        return; // Stop polling on error/404!
      }

      // Schedule next poll in 2 seconds
      timer = setTimeout(pollStatus, 2000);
    };

    pollStatus();

    return () => {
      isSubscribed = false;
      if (timer) clearTimeout(timer);
    };
  }, [meetingId, onComplete, onFailed]);

  // Handle Escape key to dismiss modal when FAILED or COMPLETED
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
        else if (onCancel) onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onCancel]);

  const getStepState = (stepStatus: MeetingStatus) => {
    const order: MeetingStatus[] = ['UPLOADED', 'TRANSCRIBING', 'SUMMARIZING', 'COMPLETED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepStatus);

    if (currentStatus === 'FAILED') return 'failed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-xl w-full mx-auto text-center space-y-8 shadow-2xl relative">
      {/* Close button top right */}
      {(onClose || onCancel) && (
        <button
          onClick={onClose || onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-border transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Animated status ring icon */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        {currentStatus === 'FAILED' ? (
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-brand-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-9 h-9 animate-pulse" />
            </div>
          </>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-white">
          {currentStatus === 'FAILED'
            ? 'Processing Failed'
            : currentStatus === 'COMPLETED'
            ? 'Analysis Complete!'
            : 'Analyzing Meeting Audio...'}
        </h3>
        <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
          {currentStatus === 'FAILED'
            ? errorMessage
            : 'Converting speech into transcript and generating structured insights.'}
        </p>
      </div>

      {/* Progress timeline */}
      <div className="space-y-4 text-left max-w-md mx-auto">
        {STEPS.map((step) => {
          const state = getStepState(step.status);
          const StepIcon = step.icon;

          return (
            <div
              key={step.status}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                state === 'active'
                  ? 'bg-brand-500/10 border border-brand-500/30 text-white'
                  : state === 'completed'
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}
            >
              {state === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : state === 'active' ? (
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin shrink-0" />
              ) : (
                <StepIcon className="w-5 h-5 shrink-0 opacity-40" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Modal Action Controls */}
      <div className="flex items-center justify-center space-x-3 pt-2">
        {currentStatus === 'FAILED' ? (
          <>
            {onTryAgain && (
              <button
                onClick={onTryAgain}
                className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-brand-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-dark-bg hover:bg-dark-border text-slate-300 border border-dark-border rounded-xl font-semibold text-sm transition-colors"
              >
                Close
              </button>
            )}
          </>
        ) : currentStatus === 'COMPLETED' ? (
          <button
            onClick={onComplete}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
          >
            <span>View Results</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          /* Processing state - show cancel */
          onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-dark-bg hover:bg-dark-border border border-dark-border rounded-xl transition-colors"
            >
              Cancel Processing
            </button>
          )
        )}
      </div>
    </div>
  );
};
