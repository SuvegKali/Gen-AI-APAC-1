/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Square, ListTodo } from 'lucide-react';
import { ActionItem } from '../types';
import { updateActionItems } from '../lib/summaryService';

interface ActionChecklistProps {
  summaryId?: string;
  initialItems?: ActionItem[];
}

export const ActionChecklist: React.FC<ActionChecklistProps> = ({ summaryId, initialItems }) => {
  const [items, setItems] = useState<ActionItem[]>(initialItems || []);
  const [saving, setSaving] = useState(false);

  if (!items.length) return null;

  const toggleItem = async (id: string) => {
    const previous = items;
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);

    if (!summaryId) return;
    try {
      setSaving(true);
      await updateActionItems(summaryId, updated);
    } catch (err) {
      setItems(previous); // revert on failure
      console.error('Failed to update action items', err);
    } finally {
      setSaving(false);
    }
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
        <ListTodo className="w-3 h-3 text-blue-500" /> Action Items ({completedCount}/{items.length})
      </span>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => toggleItem(item.id)}
              disabled={saving}
              className="w-full flex items-start gap-2 text-left text-xs text-slate-700 hover:bg-slate-50 rounded px-1.5 py-1 transition-colors"
            >
              {item.completed ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
              )}
              <span className={item.completed ? 'line-through text-slate-400' : ''}>
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};