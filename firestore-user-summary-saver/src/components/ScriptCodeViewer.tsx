/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, Shield, Info } from 'lucide-react';
import { generatePythonScript, generateTypeScriptScript } from '../lib/summaryService';

interface ScriptCodeViewerProps {
  userId: string;
}

export const ScriptCodeViewer: React.FC<ScriptCodeViewerProps> = ({ userId }) => {
  const [lang, setLang] = useState<'ts' | 'python' | 'rules'>('ts');
  const [copied, setCopied] = useState(false);

  const sampleTitle = 'Weekly Sprint Retrospective & Architecture Review';
  const sampleContent =
    'The engineering team completed the Firestore subcollection isolation implementation. Benchmark tests show subcollection queries scale with O(1) query planning time while maintaining zero cross-tenant leakage.';

  const tsCode = generateTypeScriptScript(userId, sampleTitle, sampleContent);
  const pythonCode = generatePythonScript(userId, sampleTitle, sampleContent);
  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Multi-tenant path-based security isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /summaries/{summaryId} {
        allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  const currentCode = lang === 'ts' ? tsCode : lang === 'python' ? pythonCode : rulesCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md text-slate-200">
      {/* Tab Switcher & Action */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/70 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setLang('ts')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'ts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> TypeScript / Web SDK
            </button>
            <button
              onClick={() => setLang('python')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'python'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Python (Cloud Firestore)
            </button>
            <button
              onClick={() => setLang('rules')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'rules'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Firestore Rules
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy Code
            </>
          )}
        </button>
      </div>

      {/* Security explanation note */}
      <div className="bg-blue-950/30 border-b border-slate-800/80 px-4 py-2 flex items-center gap-2 text-xs text-blue-300">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          {lang === 'ts' &&
            'Direct browser-to-Firestore execution using modular Web SDK v9+ with verified UID validation.'}
          {lang === 'python' &&
            'Production-ready Python function with explicit typing, input sanitization, and /users/{user_id}/summaries path isolation.'}
          {lang === 'rules' &&
            'Deployed security rules enforcing strict tenant subcollection access controls.'}
        </span>
      </div>

      {/* Code Display Area */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs text-slate-300 leading-relaxed">
          <code>{currentCode}</code>
        </pre>
      </div>
    </div>
  );
};
