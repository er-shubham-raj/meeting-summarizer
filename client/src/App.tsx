import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { MeetingDetailsPage } from './pages/MeetingDetailsPage';
import { AudioUploader } from './components/AudioUploader';
import { ProcessingTracker } from './components/ProcessingTracker';
import { Toaster } from 'react-hot-toast';

export const App: React.FC = () => {
  const [showGlobalUploadModal, setShowGlobalUploadModal] = useState(false);
  const [globalProcessingId, setGlobalProcessingId] = useState<string | null>(null);

  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#131927',
              color: '#fff',
              border: '1px solid #1E293B',
              borderRadius: '12px',
            },
          }}
        />

        <Navbar onOpenUploadModal={() => setShowGlobalUploadModal(true)} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/meetings/:id" element={<MeetingDetailsPage />} />
          </Routes>
        </main>

        <footer className="border-t border-dark-border py-6 text-center text-xs text-slate-500">
          <p>© 2026 SummizeAI - Production-Quality Meeting Audio Summarizer & Insights Engine</p>
        </footer>

        {/* Global Upload Modal */}
        {showGlobalUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            {!globalProcessingId ? (
              <AudioUploader
                onUploadSuccess={(id) => setGlobalProcessingId(id)}
                onClose={() => setShowGlobalUploadModal(false)}
              />
            ) : (
              <ProcessingTracker
                meetingId={globalProcessingId}
                onComplete={() => {
                  setShowGlobalUploadModal(false);
                  setGlobalProcessingId(null);
                  window.location.reload();
                }}
                onClose={() => {
                  setShowGlobalUploadModal(false);
                  setGlobalProcessingId(null);
                }}
                onCancel={() => {
                  setShowGlobalUploadModal(false);
                  setGlobalProcessingId(null);
                }}
                onTryAgain={() => {
                  setGlobalProcessingId(null);
                }}
              />
            )}
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
