/**
 * GLEIS Firestore Service
 * Handles real-time Firestore read/write operations for cases, evidence, bookmarks, and audit logs.
 * Gracefully falls back to in-memory state when Firestore is unavailable or in local mode.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isLocalMode } from './firebase';
import { LegalCase, CaseMember } from '../types/case';
import { EvidenceFile } from '../types/evidence';
import { Bookmark } from '../types/bookmark';
import { AuditLogEntry } from '../types/audit';
import { UserProfile } from '../types/auth';

// ─── USER PROFILES ──────────────────────────────────────────────────────────

/**
 * Save user profile in Firestore under /users/{uid}.
 * Does not store plaintext passwords.
 */
export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveUserProfile error:', err);
    return false;
  }
}

/**
 * Fetch user profile from Firestore by UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db || isLocalMode) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Firestore getUserProfile error:', err);
    return null;
  }
}

/**
 * Load all user profiles from Firestore.
 */
export async function loadAllUserProfiles(): Promise<UserProfile[]> {
  if (!db || isLocalMode) return [];
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    console.warn('Firestore loadAllUserProfiles error:', err);
    return [];
  }
}

/**
 * Update partial user profile in Firestore.
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn('Firestore updateUserProfile error:', err);
    return false;
  }
}

// ─── CASES ──────────────────────────────────────────────────────────────────

/**
 * Save or update a case in Firestore. Returns the saved case.
 */
export async function saveCase(legalCase: LegalCase): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const docRef = doc(db, 'cases', legalCase.id);
    // Store case metadata without the full evidence array (evidence is a subcollection)
    const { evidence: _evidence, ...caseMetadata } = legalCase;
    await setDoc(docRef, { ...caseMetadata, updatedAt: serverTimestamp() }, { merge: true });

    // Sync members subcollection
    if (legalCase.members && legalCase.members.length > 0) {
      for (const m of legalCase.members) {
        const memberRef = doc(db, 'cases', legalCase.id, 'members', m.uid);
        await setDoc(memberRef, m, { merge: true });
      }
    }

    return true;
  } catch (err) {
    console.warn('Firestore saveCase error:', err);
    return false;
  }
}

/**
 * Assign a member to a case subcollection in Firestore.
 */
export async function saveCaseMember(caseId: string, member: CaseMember): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const memberRef = doc(db, 'cases', caseId, 'members', member.uid);
    await setDoc(memberRef, { ...member, assignedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveCaseMember error:', err);
    return false;
  }
}

/**
 * Revoke/delete a member from a case subcollection in Firestore.
 */
export async function deleteCaseMember(caseId: string, memberUid: string): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const memberRef = doc(db, 'cases', caseId, 'members', memberUid);
    await deleteDoc(memberRef);
    return true;
  } catch (err) {
    console.warn('Firestore deleteCaseMember error:', err);
    return false;
  }
}

/**
 * Load members for a specific case from Firestore subcollection.
 */
export async function loadCaseMembers(caseId: string): Promise<CaseMember[]> {
  if (!db || isLocalMode) return [];
  try {
    const membersRef = collection(db, 'cases', caseId, 'members');
    const snapshot = await getDocs(membersRef);
    return snapshot.docs.map((d) => d.data() as CaseMember);
  } catch (err) {
    console.warn('Firestore loadCaseMembers error:', err);
    return [];
  }
}

/**
 * Load all cases the current user has access to.
 */
export async function loadCases(organizationId?: string): Promise<LegalCase[]> {
  if (!db || isLocalMode) return [];
  try {
    const casesRef = collection(db, 'cases');
    const q = organizationId
      ? query(casesRef, where('organizationId', '==', organizationId), orderBy('createdAt', 'desc'), limit(50))
      : query(casesRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data(), evidence: [] } as LegalCase));
  } catch (err) {
    console.warn('Firestore loadCases error:', err);
    return [];
  }
}

// ─── EVIDENCE ────────────────────────────────────────────────────────────────

/**
 * Save evidence metadata to Firestore subcollection.
 * Original file bytes go to Cloud Storage — not here.
 */
export async function saveEvidenceRecord(evidence: EvidenceFile): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const docRef = doc(db, 'cases', evidence.caseId, 'evidence', evidence.id);
    // Store all evidence metadata except full segment arrays (those go to subcollections)
    const { segments, pages, ...metadata } = evidence;
    await setDoc(docRef, { ...metadata, savedAt: serverTimestamp() }, { merge: true });

    // Store audio segments as a subcollection (keeps parent doc under 1 MiB limit)
    if (segments && segments.length > 0) {
      for (const seg of segments) {
        const segRef = doc(db, 'cases', evidence.caseId, 'evidence', evidence.id, 'segments', seg.id);
        await setDoc(segRef, seg);
      }
    }

    // Store document pages as a subcollection
    if (pages && pages.length > 0) {
      for (const page of pages) {
        const pageRef = doc(db, 'cases', evidence.caseId, 'evidence', evidence.id, 'pages', page.id);
        await setDoc(pageRef, page);
      }
    }

    return true;
  } catch (err) {
    console.warn('Firestore saveEvidenceRecord error:', err);
    return false;
  }
}

/**
 * Load all evidence for a case.
 */
export async function loadCaseEvidence(caseId: string): Promise<EvidenceFile[]> {
  if (!db || isLocalMode) return [];
  try {
    const evidenceRef = collection(db, 'cases', caseId, 'evidence');
    const snapshot = await getDocs(evidenceRef);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as EvidenceFile));
  } catch (err) {
    console.warn('Firestore loadCaseEvidence error:', err);
    return [];
  }
}

// ─── BOOKMARKS ───────────────────────────────────────────────────────────────

/**
 * Save a bookmark to Firestore.
 */
export async function saveBookmark(bookmark: Bookmark): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const docRef = doc(db, 'cases', bookmark.caseId, 'bookmarks', bookmark.id);
    await setDoc(docRef, { ...bookmark, savedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.warn('Firestore saveBookmark error:', err);
    return false;
  }
}

/**
 * Delete a bookmark from Firestore.
 */
export async function deleteBookmarkFromFirestore(caseId: string, bookmarkId: string): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    await deleteDoc(doc(db, 'cases', caseId, 'bookmarks', bookmarkId));
    return true;
  } catch (err) {
    console.warn('Firestore deleteBookmark error:', err);
    return false;
  }
}

/**
 * Load all bookmarks for a case.
 */
export async function loadBookmarks(caseId: string): Promise<Bookmark[]> {
  if (!db || isLocalMode) return [];
  try {
    const ref = collection(db, 'cases', caseId, 'bookmarks');
    const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Bookmark));
  } catch (err) {
    console.warn('Firestore loadBookmarks error:', err);
    return [];
  }
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

/**
 * Write an audit log entry to Firestore (append-only, no updates).
 */
export async function writeAuditLogToFirestore(entry: AuditLogEntry): Promise<boolean> {
  if (!db || isLocalMode) return false;
  try {
    const ref = collection(db, 'cases', entry.caseId, 'auditLogs');
    await addDoc(ref, { ...entry, firestoreWrittenAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.warn('Firestore writeAuditLog error:', err);
    return false;
  }
}

/**
 * Subscribe to live audit log updates for a case.
 */
export function subscribeToAuditLogs(
  caseId: string,
  onUpdate: (logs: AuditLogEntry[]) => void
): Unsubscribe {
  if (!db || isLocalMode) return () => {};
  const ref = collection(db, 'cases', caseId, 'auditLogs');
  const q = query(ref, orderBy('timestamp', 'desc'), limit(200));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AuditLogEntry));
    onUpdate(logs);
  }, (err) => {
    console.warn('Audit log subscription error:', err);
  });
}
