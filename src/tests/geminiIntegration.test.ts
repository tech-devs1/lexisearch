import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGeminiApiKey,
  getGeminiModel,
  isGeminiConfigured,
  saveGeminiConfig,
  testGeminiApiKey,
  transcribeMediaWithGemini,
  queryGeminiRAG,
  GroundedPassage,
} from '../services/geminiService';
import { askLegalEvidenceAi, getActiveAiProvider } from '../services/legalAiRAG';
import { EvidenceSearchEngine } from '../services/searchEngine';
import { EvidenceFile } from '../types/evidence';

const SAMPLE_CASE_EVIDENCE: EvidenceFile[] = [
  {
    id: 'ev_audio_trial_01',
    caseId: 'case_hc_001',
    fileName: 'cross_examination_hearing_day2.mp3',
    originalFileName: 'cross_examination_hearing_day2.mp3',
    fileType: 'audio',
    mimeType: 'audio/mpeg',
    storagePath: 'cases/case_hc_001/cross_examination_hearing_day2.mp3',
    fileSizeBytes: 2048000,
    sha256Hash: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    uploadedBy: {
      uid: 'user_prosecutor',
      displayName: 'State Prosecutor',
      email: 'prosecutor.alfred@ag.gov.gh',
    },
    uploadedAt: '2026-03-20T10:00:00Z',
    status: 'completed',
    durationSeconds: 180,
    speakerCount: 2,
    segments: [
      {
        id: 'seg_aud_01',
        evidenceId: 'ev_audio_trial_01',
        startTime: 12.5,
        endTime: 24.0,
        speakerLabel: 'Prosecution Counsel',
        text: 'Did the contractor deliver the procurement tender documents to your office in Ridge on June 14th?',
        words: [
          { word: 'procurement', start: 16.0, end: 17.0, confidence: 0.99 },
          { word: 'tender', start: 17.0, end: 17.5, confidence: 0.99 },
          { word: 'Ridge', start: 20.0, end: 20.8, confidence: 0.98 },
        ],
      },
      {
        id: 'seg_aud_02',
        evidenceId: 'ev_audio_trial_01',
        startTime: 25.0,
        endTime: 38.0,
        speakerLabel: 'Witness (Mr. Kwame Boateng)',
        text: 'No, we met at the Kempinski Hotel Gold Coast City conference suite where the initial payment was signed.',
        words: [
          { word: 'Kempinski', start: 28.0, end: 29.0, confidence: 0.99 },
          { word: 'payment', start: 34.0, end: 34.8, confidence: 0.98 },
        ],
      },
    ],
  },
  {
    id: 'ev_doc_exhibit_02',
    caseId: 'case_hc_001',
    fileName: 'Exhibit_B_Ministry_Audit_Report.pdf',
    originalFileName: 'Exhibit_B_Ministry_Audit_Report.pdf',
    fileType: 'document',
    mimeType: 'application/pdf',
    storagePath: 'cases/case_hc_001/Exhibit_B_Ministry_Audit_Report.pdf',
    fileSizeBytes: 840000,
    sha256Hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    uploadedBy: {
      uid: 'user_investigator',
      displayName: 'Lead Investigator',
      email: 'investigator.eric@cid.police.gov.gh',
    },
    uploadedAt: '2026-03-21T11:00:00Z',
    status: 'completed',
    pageCount: 3,
    ocrApplied: true,
    pages: [
      {
        id: 'page_001',
        evidenceId: 'ev_doc_exhibit_02',
        pageNumber: 1,
        headings: ['EXECUTIVE SUMMARY - FINANCIAL AUDIT'],
        isOcr: true,
        text: 'Audit of Eastern Corridor Road Construction Phase 3. Advance mobilization of 1,200,000 Ghana Cedis disbursed under certificate 048.',
      },
      {
        id: 'page_002',
        evidenceId: 'ev_doc_exhibit_02',
        pageNumber: 2,
        headings: ['SCHEDULE OF PAYMENTS & RETENTIONS'],
        isOcr: false,
        text: 'Payment of 450,000 Ghana Cedis cleared through Bank of Ghana clearing house into escrow account.',
      },
    ],
  },
];

describe('Google Gemini API Integration for GLEIS', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    // Polyfill localStorage for node test runner
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    };
  });

  describe('1. Single API Key Management & Configuration', () => {
    it('should read the active Gemini key from environment or localStorage', () => {
      const key = getGeminiApiKey();
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(15);
      expect(isGeminiConfigured()).toBe(true);
    });

    it('should return the configured Gemini model name', () => {
      const model = getGeminiModel();
      expect(model).toBeDefined();
      expect(typeof model).toBe('string');
      expect(model.length).toBeGreaterThan(3);
    });

    it('should save key and model updates to local storage', () => {
      saveGeminiConfig('AQ.TestNewSecretKey1234567890', 'gemini-3.5-flash');
      expect(localStorage.getItem('gleis_gemini_api_key')).toBe('AQ.TestNewSecretKey1234567890');
      expect(localStorage.getItem('gleis_gemini_model')).toBe('gemini-3.5-flash');

      // Reset back for remaining tests
      localStorage.removeItem('gleis_gemini_api_key');
      localStorage.removeItem('gleis_gemini_model');
    });

    it('should detect when an API key is missing or invalid format', async () => {
      const result = await testGeminiApiKey('');
      expect(result.success).toBe(false);
      expect(result.message).toContain('No Gemini API key configured');
    });
  });

  describe('2. Audio and Video Media Handling & Transcription Safeguards', () => {
    it('should reject files exceeding the 20MB inline multimodal payload limit without fabricating evidence', async () => {
      // Mock an oversized 25MB blob
      const oversizedBlob = new Blob([new Uint8Array(25 * 1024 * 1024)], { type: 'audio/mp3' });
      const result = await transcribeMediaWithGemini(oversizedBlob, 'ev_oversized_01', 120);

      expect(result.success).toBe(false);
      expect(result.segments.length).toBe(0);
      expect(result.error).toContain('exceeds the Google Gemini inline media API limit (20 MB)');
    });

    it('should parse valid Gemini multimodal JSON into timestamped segments and speaker labels', async () => {
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    speakerCount: 2,
                    durationSeconds: 30.5,
                    segments: [
                      {
                        startTime: 0.0,
                        endTime: 5.5,
                        speakerLabel: 'Presiding Judge',
                        text: 'Court is in session. Let the registrar call the suit.',
                        words: [
                          { word: 'Court', start: 0.0, end: 0.4 },
                          { word: 'is', start: 0.4, end: 0.6 },
                          { word: 'in', start: 0.6, end: 0.8 },
                          { word: 'session.', start: 0.8, end: 1.5 },
                        ],
                      },
                      {
                        startTime: 6.0,
                        endTime: 12.0,
                        speakerLabel: 'Court Registrar',
                        text: 'Suit number CR/0482/2026: The Republic versus Kwame Boateng.',
                        words: [
                          { word: 'Suit', start: 6.0, end: 6.5 },
                          { word: 'number', start: 6.5, end: 7.0 },
                        ],
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeminiResponse,
      } as any);

      const audioBlob = new Blob([new Uint8Array(5000)], { type: 'audio/mp3' });
      const result = await transcribeMediaWithGemini(audioBlob, 'ev_sample_01', 30.5);

      expect(result.success).toBe(true);
      expect(result.segments.length).toBe(2);
      expect(result.segments[0].speakerLabel).toBe('Presiding Judge');
      expect(result.segments[0].startTime).toBe(0.0);
      expect(result.segments[0].endTime).toBe(5.5);
      expect(result.segments[0].words?.length).toBe(4);
      expect(result.segments[1].speakerLabel).toBe('Court Registrar');
    });

    it('should handle API rate limit (429) gracefully without crashing or fabricating fake text', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => '{"error": {"code": 429, "message": "Resource has been exhausted (quota)."}}',
      } as any);

      const audioBlob = new Blob([new Uint8Array(5000)], { type: 'audio/mp3' });
      const result = await transcribeMediaWithGemini(audioBlob, 'ev_sample_quota', 10);

      expect(result.success).toBe(false);
      expect(result.segments.length).toBe(0);
      expect(result.error).toContain('quota exceeded');
    });
  });

  describe('3. Evidentiary Search: Exact Keyword, Exact Phrase, and Document Retrieval', () => {
    let engine: EvidenceSearchEngine;

    beforeEach(() => {
      engine = new EvidenceSearchEngine();
      engine.indexEvidence(SAMPLE_CASE_EVIDENCE);
    });

    it('should perform exact keyword search linking results to audio timestamp', () => {
      const searchRes = engine.search('Kempinski', 'keyword');
      expect(searchRes.totalMatches).toBeGreaterThan(0);

      const match = searchRes.results.find((m) => m.type === 'audio');
      expect(match).toBeDefined();
      expect(match?.fileName).toBe('cross_examination_hearing_day2.mp3');
      expect(match?.startTime).toBe(28.0); // Exact word-level timestamp
      expect(match?.speakerLabel).toContain('Kwame Boateng');
    });

    it('should perform exact phrase search matching contiguous words verbatim', () => {
      const exactQuery = 'contractor deliver the procurement tender';
      const searchRes = engine.search(exactQuery, 'exact_phrase');

      expect(searchRes.totalMatches).toBe(1);
      expect(searchRes.results[0].type).toBe('audio');
      expect(searchRes.results[0].matchedText).toContain('contractor deliver the procurement tender');
    });

    it('should retrieve matching documentary exhibits alongside audio testimony', () => {
      const searchRes = engine.search('450,000', 'keyword');
      expect(searchRes.totalMatches).toBe(1);

      const docMatch = searchRes.results[0];
      expect(docMatch.type).toBe('document');
      expect(docMatch.fileName).toBe('Exhibit_B_Ministry_Audit_Report.pdf');
      expect((docMatch as any).pageNumber).toBe(2);
      expect(docMatch.surroundingContext).toContain('Bank of Ghana clearing house');
    });

    it('should filter search results by evidence type (audio only or document only)', () => {
      const allResults = engine.search('procurement', 'keyword', { evidenceType: 'audio' });
      expect(allResults.results.every((r) => r.type === 'audio')).toBe(true);

      const docOnly = engine.search('Ghana Cedis', 'keyword', { evidenceType: 'document' });
      expect(docOnly.results.every((r) => r.type === 'document')).toBe(true);
    });
  });

  describe('4. Grounded Legal RAG Question Answering & Synthesis', () => {
    it('should accurately detect the active Gemini provider label', () => {
      const provider = getActiveAiProvider();
      expect(provider.provider).toBe('gemini');
      expect(provider.label).toContain('Google Gemini');
    });

    it('should return clear notice when a query has no matching evidence records', async () => {
      const response = await askLegalEvidenceAi(
        'What was the color of the car parked in Tamale market on Sunday?',
        SAMPLE_CASE_EVIDENCE
      );

      expect(response.evidenceFound).toBe(false);
      expect(response.answer).toContain('no records, transcripts, or document passages mention');
      expect(response.citations.length).toBe(0);
    });

    it('should synthesize answers with verified citations to timestamps and page numbers', async () => {
      const mockRAGText = `According to the witness testimony [Audio: cross_examination_hearing_day2.mp3 @ 00:25], the meeting occurred at the Kempinski Hotel Gold Coast City conference suite where the initial payment was signed. Furthermore, according to Ministry Audit records [Doc: Exhibit_B_Ministry_Audit_Report.pdf, Page 2], 450,000 Ghana Cedis cleared into an escrow account.`;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: mockRAGText }],
              },
            },
          ],
        }),
      } as any);

      const passages: GroundedPassage[] = [
        {
          citationId: 'cite_1',
          type: 'audio',
          evidenceId: 'ev_audio_trial_01',
          fileName: 'cross_examination_hearing_day2.mp3',
          identifier: '[Audio: cross_examination_hearing_day2.mp3 @ 00:25]',
          seconds: 25.0,
          text: 'we met at the Kempinski Hotel Gold Coast City conference suite',
          speaker: 'Witness',
        },
        {
          citationId: 'cite_2',
          type: 'document',
          evidenceId: 'ev_doc_exhibit_02',
          fileName: 'Exhibit_B_Ministry_Audit_Report.pdf',
          identifier: '[Doc: Exhibit_B_Ministry_Audit_Report.pdf, Page 2]',
          pageNumber: 2,
          text: 'Payment of 450,000 Ghana Cedis cleared through Bank of Ghana clearing house',
        },
      ];

      const ragRes = await queryGeminiRAG('Where did the meeting occur and what funds cleared?', passages);

      expect(ragRes.success).toBe(true);
      expect(ragRes.answer).toContain('Kempinski Hotel');
      expect(ragRes.citations.length).toBe(2);
      expect(ragRes.citations[0].type).toBe('audio');
      expect(ragRes.citations[0].seconds).toBe(25.0);
      expect(ragRes.citations[1].type).toBe('document');
      expect(ragRes.citations[1].pageNumber).toBe(2);
    });
  });
});
