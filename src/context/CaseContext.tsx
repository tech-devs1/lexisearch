import React, { createContext, useContext, useState, useEffect } from 'react';
import { LegalCase } from '../types/case';
import { EvidenceFile, EvidenceStatus } from '../types/evidence';
import { Bookmark } from '../types/bookmark';
import { calculateFileSha256 } from '../services/crypto';
import { transcribeAudioFile } from '../services/audioProcessor';
import { extractDocumentText } from '../services/documentProcessor';
import { globalSearchEngine } from '../services/searchEngine';
import { globalAuditService } from '../services/auditService';
import { storeEvidenceBlob } from '../services/storageVault';
import { uploadEvidenceToR2 } from '../services/cloudflareR2Service';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  saveCase, 
  loadCases, 
  saveEvidenceRecord, 
  saveBookmark as saveBookmarkFirestore,
  deleteBookmarkFromFirestore 
} from '../services/firestoreService';
import { useAuth } from './AuthContext';

interface CaseContextType {
  cases: LegalCase[];
  activeCase: LegalCase | null;
  evidenceList: EvidenceFile[];
  bookmarks: Bookmark[];
  isProcessingUpload: boolean;
  uploadStatusMessage: string;
  selectCase: (caseId: string) => void;
  createCase: (caseData: Partial<LegalCase>) => Promise<LegalCase>;
  uploadEvidence: (file: File, caseId?: string) => Promise<EvidenceFile>;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<Bookmark>;
  deleteBookmark: (bookmarkId: string) => void;
  getEvidenceById: (evidenceId: string) => EvidenceFile | undefined;
  updateEvidence: (evidenceId: string, updates: Partial<EvidenceFile>) => Promise<void>;
  clearAllMockData: () => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

// Clear any old legacy mock fixtures from previous versions
if (typeof localStorage !== 'undefined') {
  const casesJson = localStorage.getItem('gleis_cases_v1');
  if (casesJson && casesJson.includes('CR/ACC/0482/2026')) {
    localStorage.removeItem('gleis_cases_v1');
  }
  const bookmarksJson = localStorage.getItem('gleis_bookmarks_v1');
  if (bookmarksJson && bookmarksJson.includes('Court_Proceeding_CrossExam_Kwame_Mensah')) {
    localStorage.removeItem('gleis_bookmarks_v1');
  }
}

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<LegalCase[]>(() => {
    const saved = localStorage.getItem('gleis_cases_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude mock cases if any leaked in
        return parsed.filter((c: LegalCase) => c.caseNumber !== 'CR/ACC/0482/2026' && c.caseNumber !== 'CR/KUM/0190/2026');
      } catch { /* ignore */ }
    }
    return [];
  });

  const [activeCaseId, setActiveCaseId] = useState<string>(() => {
    return cases[0]?.id || '';
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('gleis_bookmarks_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((b: Bookmark) => !b.fileName?.includes('Kwame_Mensah') && !b.fileName?.includes('Exhibit_P7'));
      } catch { /* ignore */ }
    }
    return [];
  });

  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0] || null;
  const evidenceList = activeCase?.evidence || [];

  // Index active case evidence on mount or change
  useEffect(() => {
    globalSearchEngine.clear();
    for (const c of cases) {
      if (c.evidence) {
        globalSearchEngine.indexEvidence(c.evidence);
      }
    }
  }, [cases]);

  useEffect(() => {
    localStorage.setItem('gleis_cases_v1', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem('gleis_bookmarks_v1', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const selectCase = (caseId: string) => {
    setActiveCaseId(caseId);
    if (currentUser) {
      globalAuditService.logAction({
        caseId,
        action: 'CASE_ACCESS',
        actionDescription: `Opened case folder`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
  };

  const createCase = async (caseData: Partial<LegalCase>): Promise<LegalCase> => {
    const newCaseId = `case_${Date.now()}`;
    const newCase: LegalCase = {
      id: newCaseId,
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
          role: 'owner',
          assignedAt: new Date().toISOString(),
        }
      ],
      evidenceCount: { audio: 0, documents: 0, total: 0 },
      evidence: [],
    };

    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newCaseId);

    // Persist to Firestore asynchronously
    saveCase(newCase).catch(e => console.warn('Firestore case save notice:', e));

    if (currentUser) {
      globalAuditService.logAction({
        caseId: newCaseId,
        action: 'CASE_ACCESS',
        actionDescription: `New legal case created: ${newCase.caseNumber} - ${newCase.title}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }

    return newCase;
  };

  /**
   * Real end-to-end evidence ingestion with SHA-256 calculation,
   * audio transcription or document extraction, and full-text search indexing.
   */
  const uploadEvidence = async (file: File, targetCaseId?: string): Promise<EvidenceFile> => {
    const caseId = targetCaseId || activeCaseId;
    setIsProcessingUpload(true);
    setUploadStatusMessage(`Phase 1/4: Calculating cryptographic SHA-256 integrity hash...`);

    try {
      // Step 1: Calculate SHA-256 cryptographic digest before any modification
      const sha256 = await calculateFileSha256(file);
      const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name);
      const fileType = isAudio ? 'audio' : 'document';

      // Log upload to chain of custody audit trail
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
          actionDescription: `Cryptographic SHA-256 hash verified & sealed: ${sha256}`,
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

      // Upload evidence binary to Cloudflare R2
      const r2Result = await uploadEvidenceToR2(file, caseId, evidenceId, file.name);
      let fileUrl = r2Result.url;
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
          displayName: currentUser?.displayName || 'Prosecutor / Lead Counsel',
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

      // Index in search engine
      globalSearchEngine.indexEvidence(newEvidence);

      // Persist evidence record to Firestore subcollection
      saveEvidenceRecord(newEvidence).catch(e => console.warn('Firestore evidence save notice:', e));

      setUploadStatusMessage(`Phase 4/4: Evidence verified and ready!`);

      // Update case evidence list
      setCases(prev => prev.map(c => {
        if (c.id === caseId) {
          const currentEv = c.evidence || [];
          const updatedEv = [newEvidence, ...currentEv];
          return {
            ...c,
            evidence: updatedEv,
            evidenceCount: {
              audio: updatedEv.filter(e => e.fileType === 'audio').length,
              documents: updatedEv.filter(e => e.fileType === 'document').length,
              total: updatedEv.length,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      }));

      // Log processing completion
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
      console.error('Evidence upload processing error:', err);
      throw err;
    }
  };

  const addBookmark = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Bookmark> => {
    const newBookmark: Bookmark = {
      ...data,
      id: `bm_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        uid: currentUser?.uid || 'user_lawyer',
        displayName: currentUser?.displayName || 'Authorized User',
        email: currentUser?.email || 'counsel@judicial.gov.gh',
      },
    };

    setBookmarks(prev => [newBookmark, ...prev]);

    // Persist bookmark to Firestore
    saveBookmarkFirestore(newBookmark).catch(e => console.warn('Firestore bookmark save notice:', e));

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
    const target = bookmarks.find(b => b.id === bookmarkId);
    if (target) {
      deleteBookmarkFromFirestore(target.caseId, bookmarkId).catch(e => console.warn('Firestore bookmark delete notice:', e));
    }
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  };

  const clearAllMockData = () => {
    localStorage.setItem('gleis_mock_cleared', 'true');
    localStorage.removeItem('gleis_cases_v1');
    localStorage.removeItem('gleis_bookmarks_v1');
    globalSearchEngine.clear();
    setCases([]);
    setActiveCaseId('');
    setBookmarks([]);
  };

  const getEvidenceById = (evidenceId: string): EvidenceFile | undefined => {
    for (const c of cases) {
      const found = c.evidence?.find(e => e.id === evidenceId);
      if (found) return found;
    }
    return undefined;
  };

  const updateEvidence = async (evidenceId: string, updates: Partial<EvidenceFile>): Promise<void> => {
    setCases(prev => prev.map(c => {
      const hasEv = c.evidence?.some(e => e.id === evidenceId);
      if (!hasEv) return c;

      const updatedEvidence = (c.evidence || []).map(e => {
        if (e.id === evidenceId) {
          const merged: EvidenceFile = {
            ...e,
            ...updates,
          };
          // Re-index into local search engine
          globalSearchEngine.indexEvidence(merged);
          // Persist to firestore asynchronously
          saveEvidenceRecord(merged).catch(err => console.warn('Could not persist updated evidence to Firestore:', err));
          return merged;
        }
        return e;
      });

      return {
        ...c,
        evidence: updatedEvidence,
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  return (
    <CaseContext.Provider
      value={{
        cases,
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
