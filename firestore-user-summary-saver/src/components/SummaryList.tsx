/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSummary, SummaryCategory } from '../types';
import { deleteUserSummary } from '../lib/summaryService';
import { ActionChecklist } from './ActionChecklist';
import {
  Search,
  Trash2,
  Copy,
  Check,
  Calendar,
  Clock,
  BookOpen,
  Tag,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SummaryListProps {
  userId: string;
  summaries: UserSummary[];
  loading: boolean;
  onNavigateToCreate: () => void;
}

const CATEGORY_COLORS: Record<SummaryCategory, { bg: string; text: string; border: string }> = {
  meeting: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  research: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  journal: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  article: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  project: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  general: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export const SummaryList: React.FC<SummaryListProps> = ({
  userId,
  summaries,
  loading,
  onNavigateToCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSummaries = summaries.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesTitle = item.title.toLowerCase().includes(query);
    const matchesContent = item.content.toLowerCase().includes(query);
    const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && (matchesTitle || matchesContent || matchesTags);
  });

  const handleCopyJson = (item: UserSummary) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedId(item.id || 'doc');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (summaryId?: string) => {
    if (!summaryId) return;
    if (!window.confirm('Delete this summary from your isolated Firestore subcollection?')) return;

    try {
      setDeletingId(summaryId);
      await deleteUserSummary(userId, summaryId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete summary');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateVal?: string | number | { seconds: number; nanoseconds: number }) => {
    if (!dateVal) return 'Just now';
    if (typeof dateVal === 'string') {
      try {
        return new Date(dateVal).toLocaleString();
      } catch {
        return dateVal;
      }
    }
    if (typeof dateVal === 'number') {
      return new Date(dateVal).toLocaleString();
    }
    if (typeof dateVal === 'object' && 'seconds' in dateVal) {
      return new Date(dateVal.seconds * 1000).toLocaleString();
    }
    return 'Recent';
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved summaries..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({summaries.length})
          </button>
          {(['meeting', 'research', 'journal', 'project', 'general'] as SummaryCategory[]).map(
            (cat) => {
              const count = summaries.filter((s) => s.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && summaries.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Streaming Firestore documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && summaries.length === 0 && (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No summaries saved in Firestore yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Use the form or quick presets to execute the script and save your first multi-tenant isolated summary document.
          </p>
          <button
            onClick={onNavigateToCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> Save First Summary
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="space-y-3">
        {filteredSummaries.map((item) => {
          const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general;
          const takeaways = item.keyTakeaways || item.takeaways || [];

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{item.title}</h3>
                  </div>

                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <span>Path:</span>
                    <code className="text-slate-600 font-bold">
                      /users/{userId}/summaries/{item.id}
                    </code>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyJson(item)}
                    title="Copy Document JSON"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Delete Document"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                {item.content}
              </div>

              {/* Key Takeaways */}
              {takeaways.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-500" /> Key Takeaways
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600 pl-1">
                    {takeaways.map((point, pIdx) => (
                      <li key={pIdx} className="leading-normal">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Action Items Checklist (Phase 3 Feature) */}
              <ActionChecklist summaryId={item.id} initialItems={item.actionItems} />

              {/* Footer Meta & Tags */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(item.createdAt)}
                  </span>
                  {item.metadata?.wordCount && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {item.metadata.wordCount} words (
                      {item.metadata.readingTimeMinutes} min read)
                    </span>
                  )}
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> Source
                    </a>
                  )}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};