import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mic, Plus } from 'lucide-react';

interface NavbarProps {
  onOpenUploadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUploadModal }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-dark-border glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand logo & title */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-dark-bg rounded-[10px] flex items-center justify-center">
              <Mic className="w-5 h-5 text-brand-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">SummizeAI</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-500/10 text-brand-500 rounded-full border border-brand-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> OpenAI Whisper
              </span>
            </div>
            <p className="text-xs text-slate-400">Speech-to-Text & Actionable Summaries</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/25 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Meeting</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
