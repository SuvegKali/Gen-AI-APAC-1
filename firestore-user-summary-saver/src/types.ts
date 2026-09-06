/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SummaryCategory =
  | 'meeting'
  | 'research'
  | 'journal'
  | 'article'
  | 'project'
  | 'general';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface UserSummary {
  id?: string;
  title: string;
  category: SummaryCategory;
  content: string;
  takeaways?: string[];
  keyTakeaways?: string[];
  tags?: string[];
  sourceUrl?: string;
  createdAt?: number | string | { seconds: number; nanoseconds: number };
  actionItems?: ActionItem[];
  metadata?: {
    wordCount?: number;
    readingTimeMinutes?: number;
  };
}

export interface SaveSummaryInput {
  title: string;
  category?: SummaryCategory;
  content: string;
  tags?: string[];
  keyTakeaways?: string[];
  sourceUrl?: string;
}

export interface SaveSummaryResult {
  success: boolean;
  docId?: string;
  path?: string;
  error?: string;
}

/** Backward compatibility alias */
export type SummaryItem = UserSummary;