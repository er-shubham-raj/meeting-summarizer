import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, X, AlertCircle, CheckCircle, Music } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AudioUploaderProps {
  onUploadSuccess: (meetingId: string) => void;
  onClose?: () => void;
}

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg'];
const MAX_SIZE_MB = 25;

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onUploadSuccess, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setErrorMsg(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload ${ALLOWED_EXTENSIONS.join(', ')}.`);
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`File size (${sizeMb} MB) exceeds maximum 25 MB limit.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    const toastId = toast.loading('Uploading meeting audio...');

    try {
      const res = await api.uploadAudio(selectedFile, meetingTitle.trim() || undefined);
      if (res.success && res.data) {
        toast.success('Audio uploaded! Processing started.', { id: toastId });
        onUploadSuccess(res.data.id);
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error uploading file.';
      setErrorMsg(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-brand-500" /> Upload Meeting Audio
          </h2>
          <p className="text-sm text-slate-400">Select or drop audio recording for AI analysis</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Meeting Title Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Meeting Title (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Q3 Engineering Roadmap & Review"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          disabled={isUploading}
          className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Drop Zone */}
      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
            isDragging
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-slate-700 hover:border-slate-500 bg-dark-bg/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Click to select or drag and drop audio file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports MP3, WAV, M4A, MP4 (Max {MAX_SIZE_MB} MB)
            </p>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Local Audio Player preview */}
          <audio controls className="w-full h-8 rounded-lg outline-none">
            <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
            Your browser does not support audio elements.
          </audio>
        </div>
      )}

      {/* Validation Error banner */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        {onClose && (
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUploadSubmit}
          disabled={!selectedFile || isUploading}
          className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Start Analysis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
