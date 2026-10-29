import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LegalCase, CaseMember } from '../types/case';
import { EvidenceFile, EvidenceStatus } from '../types/evidence';
import { Bookmark } from '../types/bookmark';
import { UserProfile } from '../types/auth';
import { calculateFileSha256 } from '../services/crypto';
import { transcribeAudioFile } from '../services/audioProcessor';
import { extractDocumentText } from '../services/documentProcessor';
import { globalSearchEngine } from '../services/searchEngine';
import { globalAuditService } from '../services/auditService';
import { uploadEvidenceToR2 } from '../services/cloudflareR2Service';
import { 
  saveCase, 
  saveCaseMember,
  deleteCaseMember,
  saveEvidenceRecord, 
  saveBookmark as saveBookmarkFirestore,
  deleteBookmarkFromFirestore 
} from '../services/firestoreService';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { 
  canUserAccessCase, 
  canCreateCase, 
  canUploadEvidence, 
  canAssignCaseMembers 
} from '../services/rbacService';

interface CaseContextType {
  cases: LegalCase[];
  allCases: LegalCase[];
  activeCase: LegalCase | null;
  evidenceList: EvidenceFile[];
  bookmarks: Bookmark[];
  isProcessingUpload: boolean;
  uploadStatusMessage: string;
  selectCase: (caseId: string) => boolean;
  createCase: (caseData: Partial<LegalCase>) => Promise<LegalCase>;
  uploadEvidence: (file: File, caseId?: string) => Promise<EvidenceFile>;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<Bookmark>;
  deleteBookmark: (bookmarkId: string) => void;
  getEvidenceById: (evidenceId: string) => EvidenceFile | undefined;
  updateEvidence: (evidenceId: string, updates: Partial<EvidenceFile>) => Promise<void>;
  assignUserToCase: (caseId: string, memberUser: UserProfile, caseRole: CaseMember['role']) => Promise<boolean>;
  removeUserFromCase: (caseId: string, memberUserId: string) => Promise<boolean>;
  clearAllMockData: () => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();

  // Full repository of cases
  const [allCases, setAllCases] = useState<LegalCase[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('gleis_cases_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* ignore */ }
      }
    }
    return [];
  });

  const [activeCaseId, setActiveCaseId] = useState<string>('');

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('gleis_bookmarks_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* ignore */ }
      }
    }
    return [];
  });

  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');

  // Granular Workspace & Case-Level Scoping: Filter cases strictly according to workspace and permissions
  const authorizedCases = useMemo(() => {
    if (!currentUser || !currentUser.isActive) return [];
    return allCases.filter((c) => {
      // If case is assigned to a workspace, only show if it matches current active workspace
      if (activeWorkspace && c.workspaceId && c.workspaceId !== activeWorkspace.id) {
        return false;
      }
      return canUserAccessCase(currentUser, c);
    });
  }, [allCases, currentUser, activeWorkspace]);

  // Determine active case from authorized cases only
  const activeCase = useMemo(() => {
    if (!currentUser || authorizedCases.length === 0) return null;
    const found = authorizedCases.find((c) => c.id === activeCaseId);
    return found || authorizedCases[0] || null;
  }, [authorizedCases, activeCaseId, currentUser]);

  const evidenceList = activeCase?.evidence || [];

  // Index only evidence from cases authorized to this user
  useEffect(() => {
    globalSearchEngine.clear();
    for (const c of authorizedCases) {
      if (c.evidence) {
        globalSearchEngine.indexEvidence(c.evidence);
      }
    }
  }, [authorizedCases]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gleis_cases_v2', JSON.stringify(allCases));
    }
  }, [allCases]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gleis_bookmarks_v2', JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  // Secure Case Selection with Access Verification
  const selectCase = (caseId: string): boolean => {
    const targetCase = allCases.find((c) => c.id === caseId);
    if (!targetCase) return false;

    if (!canUserAccessCase(currentUser, targetCase)) {
      globalAuditService.logAction({
        caseId,
        action: 'ACCESS_DENIED',
        actionDescription: `Unauthorized access attempt to case: ${targetCase.caseNumber} by ${currentUser?.displayName} [${currentUser?.role}]`,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        userRole: currentUser?.role || 'none',
      });
      return false;
    }

    setActiveCaseId(caseId);
    if (currentUser) {
      globalAuditService.logAction({
        caseId,
        action: 'CASE_ACCESS',
        actionDescription: `Opened legal docket: ${targetCase.caseNumber}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
    return true;
  };

  // Secure Case Creation
  const createCase = async (caseData: Partial<LegalCase>): Promise<LegalCase> => {
    if (!canCreateCase(currentUser)) {
      await globalAuditService.logAction({
        caseId: 'system',
        action: 'ACCESS_DENIED',
        actionDescription: `Unauthorized attempt to create case by ${currentUser?.displayName} [${currentUser?.role}]`,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        userRole: currentUser?.role || 'none',
      });
      throw new Error('Unauthorized: Your role does not permit creating legal matters.');
    }

    const newCaseId = `case_${Date.now()}`;
    const newCase: LegalCase = {
      id: newCaseId,
      workspaceId: activeWorkspace?.id,
      caseNumber: caseData.caseNumber || `CR/ACC/${Math.floor(1000 + Math.random() * 9000)}/2026`,
      suitNumber: caseData.suitNumber || '',
      title: caseData.title || 'Untitled Legal Matter',
      description: caseData.description || '',
      court: caseData.court || 'High Court of Justice, Accra',
      presidingJudge: caseData.presidingJudge || '',
      organizationId: currentUser?.organizationId || 'org_judicial_service',
      status: caseData.status || 'investigation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        uid: currentUser?.uid || 'system',
        displayName: currentUser?.displayName || 'Authorized Officer',
        email: currentUser?.email || '',
      },
      members: [
        {
          uid: currentUser?.uid || 'system',
          displayName: currentUser?.displayName || 'Authorized Officer',
          email: currentUser?.email || '',
          role: currentUser?.role === 'prosecutor' ? 'prosecutor' : 'owner',
          assignedAt: new Date().toISOString(),
        },
      ],
      evidenceCount: { audio: 0, documents: 0, total: 0 },
      evidence: [],
    };

    setAllCases((prev) => [newCase, ...prev]);
    setActiveCaseId(newCaseId);

    saveCase(newCase).catch((e) => console.warn('Firestore case save notice:', e));

    if (currentUser) {
      await globalAuditService.logAction({
        caseId: newCaseId,
        action: 'CASE_ACCESS',
        actionDescription: `New legal case instituted: ${newCase.caseNumber} - ${newCase.title}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }

    return newCase;
  };

  // Assign user to case
  const assignUserToCase = async (
    caseId: string,
    memberUser: UserProfile,
    caseRole: CaseMember['role']
  ): Promise<boolean> => {
    const targetCase = allCases.find((c) => c.id === caseId);
    if (!targetCase || !canAssignCaseMembers(currentUser, targetCase)) {
      await globalAuditService.logAction({
        caseId,
        action: 'ACCESS_DENIED',
        actionDescription: `Unauthorized attempt to assign members to case ${caseId} by ${currentUser?.displayName}`,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        userRole: currentUser?.role || 'none',
      });
      return false;
    }

    const newMember: CaseMember = {
      uid: memberUser.uid,
      email: memberUser.email,
      displayName: memberUser.displayName,
      role: caseRole,
      assignedAt: new Date().toISOString(),
    };

    const updatedMembers = [
      ...targetCase.members.filter((m) => m.uid !== memberUser.uid && m.email.toLowerCase() !== memberUser.email.toLowerCase()),
      newMember,
    ];

    const updatedCase = { ...targetCase, members: updatedMembers, updatedAt: new Date().toISOString() };
    setAllCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );

    await saveCaseMember(caseId, newMember);
    await saveCase(updatedCase);

    await globalAuditService.logAction({
      caseId,
      action: 'CASE_ASSIGNMENT',
      actionDescription: `Assigned officer ${memberUser.displayName} (${memberUser.email}) to case ${targetCase.caseNumber} as [${caseRole.toUpperCase()}] by ${currentUser?.displayName}`,
      userId: currentUser!.uid,
      userEmail: currentUser!.email,
      userRole: currentUser!.role,
      metadata: { targetUserId: memberUser.uid, targetEmail: memberUser.email, caseRole },
    });

    return true;
  };

  // Remove user from case
  const removeUserFromCase = async (caseId: string, memberUserId: string): Promise<boolean> => {
    const targetCase = allCases.find((c) => c.id === caseId);
    if (!targetCase || !canAssignCaseMembers(currentUser, targetCase)) {
      return false;
    }

    const memberToRemove = targetCase.members.find((m) => m.uid === memberUserId);
    const updatedMembers = targetCase.members.filter((m) => m.uid !== memberUserId);

    const updatedCase = { ...targetCase, members: updatedMembers, updatedAt: new Date().toISOString() };
    setAllCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );

    await deleteCaseMember(caseId, memberUserId);
    await saveCase(updatedCase);

    await globalAuditService.logAction({
      caseId,
      action: 'CASE_ASSIGNMENT',
      actionDescription: `Revoked access of officer ${memberToRemove?.displayName || memberUserId} from case ${targetCase.caseNumber} by ${currentUser?.displayName}`,
      userId: currentUser!.uid,
      userEmail: currentUser!.email,
      userRole: currentUser!.role,
      metadata: { removedUserId: memberUserId },
    });

    return true;
  };

  // Secure Evidence Ingestion
  const uploadEvidence = async (file: File, targetCaseId?: string): Promise<EvidenceFile> => {
    const caseId = targetCaseId || activeCaseId;
    const targetCase = allCases.find((c) => c.id === caseId);

    if (!targetCase || !canUploadEvidence(currentUser, targetCase)) {
      await globalAuditService.logAction({
        caseId: caseId || 'unknown',
        action: 'ACCESS_DENIED',
        actionDescription: `Unauthorized evidence upload attempt for case ${caseId} by ${currentUser?.displayName} [${currentUser?.role}]`,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        userRole: currentUser?.role || 'none',
      });
      throw new Error('Unauthorized: You do not have permission to upload evidence to this matter.');
    }

    setIsProcessingUpload(true);
    setUploadStatusMessage(`Phase 1/4: Calculating cryptographic SHA-256 integrity hash...`);

    try {
      const sha256 = await calculateFileSha256(file);
      const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isAudio = 
        file.type.startsWith('audio/') || 
        file.type.startsWith('video/') || 
        /\.(mp3|wav|m4a|aac|ogg|flac|mp4|webm|mov|mkv|avi)$/i.test(file.name);
      const fileType = isAudio ? 'audio' : 'document';

      if (currentUser) {
        await globalAuditService.logAction({
          caseId,
          action: 'EVIDENCE_UPLOAD',
          actionDescription: `Uploaded ${fileType.toUpperCase()} evidence file: ${file.name}`,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          evidenceId,
          evidenceFileName: file.name,
          evidenceSha256: sha256,
          metadata: { sizeBytes: file.size, mimeType: file.type },
        });

        await globalAuditService.logAction({
          caseId,
          action: 'EVIDENCE_HASH_VERIFIED',
          actionDescription: `Cryptographic SHA-256 hash sealed: ${sha256}`,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          evidenceId,
          evidenceFileName: file.name,
          evidenceSha256: sha256,
        });
      }

      let parsedSegments: any = undefined;
      let parsedPages: any = undefined;
      let durationSeconds: number | undefined;
      let speakerCount: number | undefined;
      let pageCount: number | undefined;
      let ocrApplied = false;
      let warnings: string[] | undefined;
      let status: EvidenceStatus = 'processing';

      if (isAudio) {
        setUploadStatusMessage(`Phase 2/4: Transcribing audio with word & segment timestamps...`);
        const transcriptionResult = await transcribeAudioFile(file, evidenceId);
        parsedSegments = transcriptionResult.segments;
        durationSeconds = transcriptionResult.durationSeconds;
        speakerCount = transcriptionResult.speakerCount;
        warnings = transcriptionResult.warnings;
      } else {
        setUploadStatusMessage(`Phase 2/4: Extracting text, preserving pages and running OCR...`);
        const docResult = await extractDocumentText(file, evidenceId, file.name);
        parsedPages = docResult.pages;
        pageCount = docResult.pageCount;
        ocrApplied = docResult.ocrApplied;
        warnings = docResult.warnings;
      }

      setUploadStatusMessage(`Phase 3/4: Uploading to Cloudflare R2 & indexing search engine...`);

      const r2Result = await uploadEvidenceToR2(file, caseId, evidenceId, file.name);
      const fileUrl = r2Result.url;
      const storagePath = r2Result.storagePath;

      status = warnings && warnings.length > 0 ? 'completed_with_warnings' : 'completed';

      const newEvidence: EvidenceFile = {
        id: evidenceId,
        caseId,
        fileName: file.name,
        originalFileName: file.name,
        fileType,
        mimeType: file.type || (isAudio ? 'audio/mpeg' : 'application/pdf'),
        storagePath,
        fileUrl,
        fileSizeBytes: file.size,
        sha256Hash: sha256,
        uploadedBy: {
          uid: currentUser?.uid || 'user_lawyer',
          displayName: currentUser?.displayName || 'Authorized Officer',
          email: currentUser?.email || 'officer@judicial.gov.gh',
        },
        uploadedAt: new Date().toISOString(),
        status,
        statusMessage: isAudio 
          ? `Transcribed ${parsedSegments?.length || 0} segments with timestamps.`
          : `Extracted ${parsedPages?.length || 1} pages.${ocrApplied ? ' (OCR utilized)' : ''}`,
        processingWarnings: warnings,
        durationSeconds,
        speakerCount,
        pageCount,
        ocrApplied,
        segments: parsedSegments,
        pages: parsedPages,
      };

      globalSearchEngine.indexEvidence(newEvidence);
      saveEvidenceRecord(newEvidence).catch((e) => console.warn('Firestore evidence save notice:', e));

      setUploadStatusMessage(`Phase 4/4: Evidence verified and ready!`);

      setAllCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const currentEv = c.evidence || [];
            const updatedEv = [newEvidence, ...currentEv];
            return {
              ...c,
              evidence: updatedEv,
              evidenceCount: {
                audio: updatedEv.filter((e) => e.fileType === 'audio').length,
                documents: updatedEv.filter((e) => e.fileType === 'document').length,
                total: updatedEv.length,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      if (currentUser) {
        await globalAuditService.logAction({
          caseId,
          action: isAudio ? 'TRANSCRIPTION_COMPLETE' : 'DOCUMENT_OCR_COMPLETE',
          actionDescription: `${fileType.toUpperCase()} processing completed (${status})`,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          evidenceId,
          evidenceFileName: file.name,
          evidenceSha256: sha256,
        });
      }

      setIsProcessingUpload(false);
      setUploadStatusMessage('');
      return newEvidence;
    } catch (err: any) {
      setIsProcessingUpload(false);
      setUploadStatusMessage('');
      throw err;
    }
  };

  // Secure Evidence Lookup (Denies unauthorized case evidence)
  const getEvidenceById = (evidenceId: string): EvidenceFile | undefined => {
    for (const c of allCases) {
      const found = c.evidence?.find((e) => e.id === evidenceId);
      if (found) {
        // Enforce case-level access check
        if (!canUserAccessCase(currentUser, c)) {
          globalAuditService.logAction({
            caseId: c.id,
            action: 'ACCESS_DENIED',
            actionDescription: `Unauthorized attempt to inspect evidence ${evidenceId} in case ${c.caseNumber} by ${currentUser?.displayName} [${currentUser?.role}]`,
            userId: currentUser?.uid || 'anonymous',
            userEmail: currentUser?.email || 'unknown',
            userRole: currentUser?.role || 'none',
          });
          return undefined;
        }
        return found;
      }
    }
    return undefined;
  };

  const addBookmark = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Bookmark> => {
    const parentCase = allCases.find((c) => c.id === data.caseId);
    if (!parentCase || !canUserAccessCase(currentUser, parentCase)) {
      throw new Error('Unauthorized to bookmark evidence in this case.');
    }

    const newBookmark: Bookmark = {
      ...data,
      id: `bm_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        uid: currentUser?.uid || 'user_lawyer',
        displayName: currentUser?.displayName || 'Authorized User',
        email: currentUser?.email || 'officer@judicial.gov.gh',
      },
    };

    setBookmarks((prev) => [newBookmark, ...prev]);
    saveBookmarkFirestore(newBookmark).catch((e) => console.warn('Firestore bookmark save notice:', e));

    if (currentUser) {
      await globalAuditService.logAction({
        caseId: data.caseId,
        action: 'BOOKMARK_CREATE',
        actionDescription: `Created bookmark on ${data.fileName} (${data.type === 'audio' ? data.timestampDisplay : `Page ${data.pageNumber}`})`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        evidenceId: data.evidenceId,
        evidenceFileName: data.fileName,
      });
    }

    return newBookmark;
  };

  const deleteBookmark = (bookmarkId: string) => {
    const target = bookmarks.find((b) => b.id === bookmarkId);
    if (target) {
      deleteBookmarkFromFirestore(target.caseId, bookmarkId).catch((e) => console.warn('Firestore bookmark delete notice:', e));
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  const updateEvidence = async (evidenceId: string, updates: Partial<EvidenceFile>): Promise<void> => {
    setAllCases((prev) =>
      prev.map((c) => {
        const hasEv = c.evidence?.some((e) => e.id === evidenceId);
        if (!hasEv) return c;

        if (!canUserAccessCase(currentUser, c)) return c;

        const updatedEvidence = (c.evidence || []).map((e) => {
          if (e.id === evidenceId) {
            const merged: EvidenceFile = { ...e, ...updates };
            globalSearchEngine.indexEvidence(merged);
            saveEvidenceRecord(merged).catch((err) => console.warn('Could not persist updated evidence:', err));
            return merged;
          }
          return e;
        });

        return { ...c, evidence: updatedEvidence, updatedAt: new Date().toISOString() };
      })
    );
  };

  const clearAllMockData = () => {
    localStorage.removeItem('gleis_cases_v2');
    localStorage.removeItem('gleis_bookmarks_v2');
    globalSearchEngine.clear();
    setAllCases([]);
    setActiveCaseId('');
    setBookmarks([]);
  };

  return (
    <CaseContext.Provider
      value={{
        cases: authorizedCases,
        allCases,
        activeCase,
        evidenceList,
        bookmarks,
        isProcessingUpload,
        uploadStatusMessage,
        selectCase,
        createCase,
        uploadEvidence,
        addBookmark,
        deleteBookmark,
        getEvidenceById,
        updateEvidence,
        assignUserToCase,
        removeUserFromCase,
        clearAllMockData,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) throw new Error('useCase must be used within a CaseProvider');
  return context;
};
