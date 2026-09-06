/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, ensureAuthenticatedUser } from './lib/firebase';
import { subscribeUserSummaries } from './lib/summaryService';
import { UserSummary, SaveSummaryResult } from './types';
import { Header } from './components/Header';
import { SecurityBadge } from './components/SecurityBadge';
import { SummaryForm } from './components/SummaryForm';
import { SummaryList } from './components/SummaryList';
import { ScriptCodeViewer } from './components/ScriptCodeViewer';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'runner' | 'list' | 'script'>('runner');
  const [summaries, setSummaries] = useState<UserSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authenticate user on mount
  useEffect(() => {
    let unsubscribeAuth = () => {};

    const initAuth = async () => {
      try {
        setAuthLoading(true);
        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
            setAuthLoading(false);
          } else {
            // Automatically establish an authenticated guest session
            ensureAuthenticatedUser()
              .then((anonUser) => {
                setCurrentUser(anonUser);
                setAuthLoading(false);
              })
              .catch((err) => {
                setAuthError(err instanceof Error ? err.message : 'Auth initialization failed');
                setAuthLoading(false);
              });
          }
        });
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Auth error');
        setAuthLoading(false);
      }
    };

    initAuth();
    return () => unsubscribeAuth();
  }, []);

  // Realtime subscription to user's isolated Firestore subcollection
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoadingSummaries(true);
    const unsubscribe = subscribeUserSummaries(
      currentUser.uid,
      (data) => {
        setSummaries(data);
        setLoadingSummaries(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setLoadingSummaries(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleSaveSuccess = (result: SaveSummaryResult) => {
    setToastMessage(`Saved summary to Firestore (${result.docId})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summaryCount={summaries.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Security & Tenant Badge */}
        <SecurityBadge user={currentUser} loading={authLoading} />

        {/* Auth Error Warning */}
        {authError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Tab Views */}
        {authLoading ? (
          <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Initializing authenticated tenant session...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'runner' && (
              <SummaryForm
                userId={currentUser?.uid || ''}
                onSuccess={handleSaveSuccess}
              />
            )}

            {activeTab === 'list' && (
              <SummaryList
                userId={currentUser?.uid || ''}
                summaries={summaries}
                loading={loadingSummaries}
                onNavigateToCreate={() => setActiveTab('runner')}
              />
            )}

            {activeTab === 'script' && (
              <ScriptCodeViewer userId={currentUser?.uid || ''} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Cloud Firestore Path Isolation:{' '}
            <code className="text-slate-700 font-bold font-mono">/users/{currentUser?.uid || '{userId}'}/summaries/*</code>
          </div>
          <div>Strict Tenant Security Rules Active</div>
        </div>
      </footer>
    </div>
  );
}

