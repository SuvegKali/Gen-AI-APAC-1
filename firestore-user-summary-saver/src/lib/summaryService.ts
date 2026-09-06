/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  addDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, ensureAuthenticatedUser } from './firebase';
import { UserSummary, ActionItem, SaveSummaryInput, SaveSummaryResult } from '../types';

export interface CreateSummaryPayload {
  title: string;
  category: string;
  content: string;
  takeaways: string[];
  tags: string[];
  sourceUrl?: string;
  extractedTasks?: string[];
  customDocId?: string;
}

/**
 * Synchronous, userId-scoped subscription (for callers that already have a uid,
 * e.g. right after auth resolves, and need the unsubscribe function immediately
 * rather than via a Promise).
 */
export function subscribeUserSummaries(
  userId: string,
  onUpdate: (summaries: UserSummary[]) => void,
  onError?: (error: Error) => void
): () => void {
  const userSummariesRef = collection(db, 'users', userId, 'summaries');
  const q = query(userSummariesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const summaries: UserSummary[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserSummary, 'id'>),
      }));
      onUpdate(summaries);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a summary for an explicit userId and returns a result object
 * (never throws) so form UIs can render success/error state directly.
 */
export async function saveUserSummary(
  userId: string,
  payload: SaveSummaryInput,
  customDocId?: string
): Promise<SaveSummaryResult> {
  try {
    const docData = {
      title: payload.title,
      category: payload.category || 'general',
      content: payload.content,
      keyTakeaways: payload.keyTakeaways || [],
      tags: payload.tags || [],
      sourceUrl: payload.sourceUrl || '',
      actionItems: [] as ActionItem[],
      createdAt: Date.now(),
    };

    let docId: string;
    if (customDocId) {
      const docRef = doc(db, 'users', userId, 'summaries', customDocId);
      await setDoc(docRef, docData);
      docId = customDocId;
    } else {
      const userSummariesRef = collection(db, 'users', userId, 'summaries');
      const docRef = await addDoc(userSummariesRef, docData);
      docId = docRef.id;
    }

    return {
      success: true,
      docId,
      path: `users/${userId}/summaries/${docId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save summary',
    };
  }
}

/**
 * Generates an illustrative TypeScript (Web SDK) snippet showing how a
 * summary would be saved for the given user — used by ScriptCodeViewer.
 */
export function generateTypeScriptScript(userId: string, title: string, content: string): string {
  return `import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function saveSummary() {
  const userId = '${userId}';
  const summariesRef = collection(db, 'users', userId, 'summaries');

  const docRef = await addDoc(summariesRef, {
    title: '${title}',
    category: 'general',
    content: '${content}',
    keyTakeaways: [],
    tags: [],
    createdAt: Date.now(),
  });

  console.log('Saved with ID:', docRef.id);
}

saveSummary();`;
}

/**
 * Generates an illustrative Python (google-cloud-firestore) snippet showing
 * how a summary would be saved for the given user — used by ScriptCodeViewer.
 */
export function generatePythonScript(userId: string, title: string, content: string): string {
  return `from google.cloud import firestore

db = firestore.Client()

def save_summary():
    user_id = "${userId}"
    summaries_ref = db.collection("users").document(user_id).collection("summaries")

    doc_ref = summaries_ref.add({
        "title": "${title}",
        "category": "general",
        "content": "${content}",
        "keyTakeaways": [],
        "tags": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
    })

    print(f"Saved with ID: {doc_ref[1].id}")

save_summary()`;
}

/**
 * Saves a summary payload into the user's tenant-isolated subcollection.
 */
export async function saveSummary(payload: CreateSummaryPayload): Promise<string> {
  const user = await ensureAuthenticatedUser();

  const actionItems: ActionItem[] = (payload.extractedTasks || []).map((taskText, idx) => ({
    id: `task-${Date.now()}-${idx}`,
    text: taskText,
    completed: false,
  }));

  const userSummariesRef = collection(db, 'users', user.uid, 'summaries');

  const docRef = await addDoc(userSummariesRef, {
    title: payload.title,
    category: payload.category || 'general',
    content: payload.content,
    keyTakeaways: payload.takeaways,
    tags: payload.tags,
    sourceUrl: payload.sourceUrl || '',
    actionItems,
    createdAt: Date.now(),
  });

  return docRef.id;
}

/**
 * Subscribes to real-time updates for the current user's summaries collection.
 */
export async function subscribeToSummaries(
  onUpdate: (summaries: UserSummary[]) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const user = await ensureAuthenticatedUser();
  const userSummariesRef = collection(db, 'users', user.uid, 'summaries');
  const q = query(userSummariesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const summaries: UserSummary[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserSummary, 'id'>),
      }));
      onUpdate(summaries);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

/**
 * One-time fetch of user summaries.
 */
export async function getSummaries(): Promise<UserSummary[]> {
  const user = await ensureAuthenticatedUser();
  const userSummariesRef = collection(db, 'users', user.uid, 'summaries');
  const q = query(userSummariesRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<UserSummary, 'id'>),
  }));
}

/**
 * Deletes a summary document given a specific user ID and summary ID.
 */
export async function deleteUserSummary(userId: string, summaryId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'summaries', summaryId);
  await deleteDoc(docRef);
}

/**
 * Deletes a summary document using the authenticated user context.
 */
export async function deleteSummary(summaryId: string): Promise<void> {
  const user = await ensureAuthenticatedUser();
  await deleteUserSummary(user.uid, summaryId);
}

/**
 * Updates the action items array for a given summary document.
 */
export async function updateActionItems(
  summaryId: string,
  actionItems: ActionItem[]
): Promise<void> {
  const user = await ensureAuthenticatedUser();
  const docRef = doc(db, 'users', user.uid, 'summaries', summaryId);
  await updateDoc(docRef, { actionItems });
}