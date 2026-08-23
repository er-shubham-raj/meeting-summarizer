import React, { useState } from 'react';
import { Search, Copy, Download, Check, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface TranscriptTabProps {
  transcript: string | null;
  title: string;
}

export const TranscriptTab: React.FC<TranscriptTabProps> = ({ transcript, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!transcript) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <FileText className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-base font-semibold text-white">No transcript available.</p>
        <p className="text-sm text-slate-400">Speech-to-text processing is incomplete or failed.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    toast.success('Transcript copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Downloaded transcript file.');
  };

  // Split transcript into paragraphs
  const paragraphs = transcript.split('\n\n').filter((p) => p.trim().length > 0);

  const filteredParagraphs = searchQuery.trim()
    ? paragraphs.filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
    : paragraphs;

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-dark-border">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Copy / Download buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-dark-bg hover:bg-dark-border border border-dark-border px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copied!' : 'Copy Transcript'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-md shadow-brand-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download TXT</span>
          </button>
        </div>
      </div>

      {/* Transcript Text Content */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {filteredParagraphs.length > 0 ? (
          filteredParagraphs.map((para, idx) => (
            <div
              key={idx}
              className="bg-dark-bg/40 border border-dark-border/40 p-4 rounded-xl text-sm text-slate-300 leading-relaxed font-normal hover:border-dark-border transition-colors"
            >
              {para}
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-slate-500 py-8">
            No text matches query "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  );
};
