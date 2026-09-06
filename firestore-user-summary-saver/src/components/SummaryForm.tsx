/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle2, AlertCircle, Clock, Tag, ExternalLink, RefreshCw, Key } from 'lucide-react';
import { saveUserSummary } from '../lib/summaryService';
import { SaveSummaryInput, SaveSummaryResult, SummaryCategory } from '../types';

interface SummaryFormProps {
  userId: string;
  onSuccess: (result: SaveSummaryResult) => void;
}

const PRESET_SUMMARIES: Array<{ label: string; data: SaveSummaryInput }> = [
  {
    label: '📊 Product Roadmap Review',
    data: {
      title: 'Q4 AI Product Roadmap & Milestone Alignment',
      category: 'project',
      content:
        'The engineering and product teams aligned on delivering the multi-tenant Firestore persistence layer, subcollection security rules, and real-time streaming updates by mid-November. Key focus areas include zero-trust tenant boundaries and automated sanitization of all document writes.',
      tags: ['roadmap', 'product', 'firestore', 'q4-goals'],
      keyTakeaways: [
        'Multi-tenant isolation verified with path /users/{uid}/summaries',
        'Input sanitization active for all incoming payloads',
        'Beta release scheduled for November 15',
      ],
      sourceUrl: 'https://internal.wiki/roadmap-q4',
    },
  },
  {
    label: '🤝 Executive Sync Meeting',
    data: {
      title: 'Weekly Executive Strategy & Resource Allocation',
      category: 'meeting',
      content:
        'Reviewed current cloud infrastructure spend and approved resource allocation for scalable Cloud Firestore operations. Agreed on setting up automated CI/CD security audits for security rules deployment.',
      tags: ['executive', 'budget', 'security'],
      keyTakeaways: [
        'Cloud budget increased by 15% for enterprise workloads',
        'Security team given mandate to audit path permissions quarterly',
      ],
      sourceUrl: '',
    },
  },
  {
    label: '🔬 Research Paper Synthesis',
    data: {
      title: 'Synthesis: Vector Search vs Path-based Partitioning in Modern NoSQL',
      category: 'research',
      content:
        'Explored the performance trade-offs between path-based multi-tenant collection structuring and hybrid global indexing in distributed document stores. Path-based subcollections provide the strongest authorization boundaries at scale.',
      tags: ['research', 'database-architecture', 'nosql', 'performance'],
      keyTakeaways: [
        'Path-based subcollections minimize blast radius in multi-tenant systems',
        'Security rules evaluate with zero extra query latency on subcollection paths',
      ],
      sourceUrl: 'https://arxiv.org/abs/2301.99999',
    },
  },
];

export const SummaryForm: React.FC<SummaryFormProps> = ({ userId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SummaryCategory>('general');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [takeawayInput, setTakeawayInput] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [customDocId, setCustomDocId] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [lastResult, setLastResult] = useState<SaveSummaryResult | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const applyPreset = (preset: SaveSummaryInput) => {
    setTitle(preset.title);
    setCategory(preset.category || 'general');
    setContent(preset.content);
    setTagsInput((preset.tags || []).join(', '));
    setTakeawayInput((preset.keyTakeaways || []).join('\n'));
    setSourceUrl(preset.sourceUrl || '');
    setLastResult(null);
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setTakeawayInput('');
    setSourceUrl('');
    setCustomDocId('');
    setLastResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    setLastResult(null);
    const startTime = performance.now();

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const keyTakeaways = takeawayInput
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: SaveSummaryInput = {
      title,
      content,
      category,
      tags,
      keyTakeaways,
      sourceUrl: sourceUrl.trim() || undefined,
    };

    const result = await saveUserSummary(userId, payload, customDocId.trim() || undefined);
    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setIsSaving(false);
    setLastResult(result);

    if (result.success) {
      onSuccess(result);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quick Test Presets
          </span>
          <span className="text-xs text-slate-500">Click to populate sample summary</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_SUMMARIES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset.data)}
              className="text-left px-3 py-2 text-xs font-medium bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-800 transition-all flex items-center justify-between group shadow-2xs"
            >
              <span className="truncate">{preset.label}</span>
              <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                Load
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Summary Payload Form</h2>
            <p className="text-xs text-slate-500">
              Saves directly to user subcollection: <code className="text-blue-600 font-mono">/users/{userId || '{uid}'}/summaries</code>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Summary Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Strategic Planning & Architecture Notes"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SummaryCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 transition-all"
            >
              <option value="general">General</option>
              <option value="meeting">Meeting</option>
              <option value="research">Research</option>
              <option value="journal">Daily Journal</option>
              <option value="article">Article Synthesis</option>
              <option value="project">Project Milestone</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Summary Content <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {content.length} chars • {content.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the synthesized summary or paste AI-generated output..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 font-sans leading-relaxed"
          />
        </div>

        {/* Key Takeaways & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Key Takeaways (one per line)
            </label>
            <textarea
              rows={3}
              value={takeawayInput}
              onChange={(e) => setTakeawayInput(e.target.value)}
              placeholder="Key point 1&#10;Key point 2&#10;Action item"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="firestore, backend, architecture"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Source Reference URL (optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/source"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Custom Doc ID (Optional) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>Custom Document ID (optional):</span>
            <input
              type="text"
              value={customDocId}
              onChange={(e) => setCustomDocId(e.target.value)}
              placeholder="auto-generated if empty"
              className="px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || !userId}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving to Firestore...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Execute Script & Save to Firestore
              </>
            )}
          </button>
        </div>
      </form>

      {/* Execution Result Banner */}
      {lastResult && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            lastResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-red-50/80 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {lastResult.success ? 'Successfully Saved to Firestore!' : 'Error Saving Document'}
                </span>
                {executionTimeMs !== null && (
                  <span className="flex items-center gap-1 text-[11px] opacity-75 font-mono">
                    <Clock className="w-3 h-3" /> {executionTimeMs}ms
                  </span>
                )}
              </div>

              {lastResult.success && lastResult.path && (
                <div>
                  <span className="text-slate-600 font-medium">Isolated Document Path: </span>
                  <code className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300 font-mono text-emerald-800 font-bold">
                    /{lastResult.path}
                  </code>
                </div>
              )}

              {lastResult.error && (
                <p className="font-mono bg-red-100/60 p-2 rounded border border-red-300 text-red-800">
                  {lastResult.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
