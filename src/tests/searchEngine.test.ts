import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceSearchEngine } from '../services/searchEngine';
import { performSemanticSearch } from '../services/semanticSearch';
import { EvidenceFile } from '../types/evidence';

const TEST_EVIDENCE_FILES: EvidenceFile[] = [
  {
    id: 'test_aud_001',
    caseId: 'test_case_001',
    fileName: 'Court_Proceeding_Testimony.mp3',
    originalFileName: 'Court_Proceeding_Testimony.mp3',
    fileType: 'audio',
    mimeType: 'audio/mpeg',
    storagePath: 'cases/test/Court_Proceeding_Testimony.mp3',
    fileSizeBytes: 1024000,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploadedBy: {
      uid: 'user_test',
      displayName: 'State Attorney',
      email: 'attorney@judicial.gov.gh',
    },
    uploadedAt: '2026-03-19T09:15:00Z',
    status: 'completed',
    durationSeconds: 120,
    segments: [
      {
        id: 'seg_001',
        evidenceId: 'test_aud_001',
        startTime: 42.0,
        endTime: 48.0,
        speakerLabel: 'Defense Counsel',
        text: 'Did you meet the tender committee chairman at the Kempinski Hotel?',
        words: [
          { word: 'Kempinski', start: 45.0, end: 46.0, confidence: 0.99 },
          { word: 'tender', start: 43.0, end: 43.5, confidence: 0.98 },
          { word: 'committee', start: 43.5, end: 44.0, confidence: 0.98 },
          { word: 'chairman', start: 44.0, end: 44.5, confidence: 0.98 },
        ],
      },
    ],
  },
  {
    id: 'test_doc_001',
    caseId: 'test_case_001',
    fileName: 'Exhibit_P7_Bank_Ledger.pdf',
    originalFileName: 'Exhibit_P7_Bank_Ledger.pdf',
    fileType: 'document',
    mimeType: 'application/pdf',
    storagePath: 'cases/test/Exhibit_P7_Bank_Ledger.pdf',
    fileSizeBytes: 512000,
    sha256Hash: 'a7b9c1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
    uploadedBy: {
      uid: 'user_test',
      displayName: 'Investigator',
      email: 'investigator@cid.police.gov.gh',
    },
    uploadedAt: '2026-03-19T10:00:00Z',
    status: 'completed',
    pageCount: 2,
    ocrApplied: false,
    pages: [
      {
        id: 'page_001',
        evidenceId: 'test_doc_001',
        pageNumber: 2,
        headings: ['FINANCIAL LEDGER'],
        isOcr: false,
        text: 'Wire transfer of 450,000 Ghana Cedis into company bank account for procurement consulting.',
      },
    ],
  },
];

describe('Evidence Search Engine & Semantic AI', () => {
  let searchEngine: EvidenceSearchEngine;

  beforeEach(() => {
    searchEngine = new EvidenceSearchEngine();
    searchEngine.indexEvidence(TEST_EVIDENCE_FILES);
  });

  it('should find exact keywords across audio transcripts with word-level timestamps', () => {
    const results = searchEngine.search('Kempinski', 'keyword');
    expect(results.totalMatches).toBeGreaterThan(0);

    const match = results.results.find((r) => r.type === 'audio');
    expect(match).toBeDefined();
    expect(match?.fileName).toContain('Court_Proceeding');
    expect(match?.speakerLabel).toBe('Defense Counsel');
    expect(match?.startTime).toBeGreaterThan(40);
  });

  it('should find specific transaction numbers in document exhibits with page numbers', () => {
    const results = searchEngine.search('450,000', 'keyword');
    expect(results.totalMatches).toBeGreaterThan(0);

    const docMatch = results.results.find((r) => r.type === 'document');
    expect(docMatch).toBeDefined();
    expect(docMatch?.fileName).toContain('Exhibit_P7');
    expect((docMatch as any)?.pageNumber).toBe(2);
  });

  it('should support exact phrase search', () => {
    const results = searchEngine.search('tender committee chairman', 'exact_phrase');
    expect(results.totalMatches).toBeGreaterThan(0);
    expect(results.results[0].matchedText.toLowerCase()).toContain('tender committee chairman');
  });

  it('should perform semantic search by meaning (money concepts ↔ cedis/transfers)', () => {
    const semanticResults = performSemanticSearch(
      TEST_EVIDENCE_FILES,
      'Where did the witness discuss receiving money or financial transfers?'
    );

    expect(semanticResults.length).toBeGreaterThan(0);
    const hasFinancialMatch = semanticResults.some(
      (r) => r.surroundingContext.includes('450,000') || r.surroundingContext.includes('transfer')
    );
    expect(hasFinancialMatch).toBe(true);
  });
});
