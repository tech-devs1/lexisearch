import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceSearchEngine } from '../services/searchEngine';
import { performSemanticSearch } from '../services/semanticSearch';
import { MOCK_EVIDENCE_FILES } from '../data/mockEvidence';

describe('Evidence Search Engine & Semantic AI', () => {
  let searchEngine: EvidenceSearchEngine;

  beforeEach(() => {
    searchEngine = new EvidenceSearchEngine();
    searchEngine.indexEvidence(MOCK_EVIDENCE_FILES);
  });

  it('should find exact keywords across audio transcripts with word-level timestamps', () => {
    const results = searchEngine.search('Kempinski', 'keyword');
    expect(results.totalMatches).toBeGreaterThan(0);

    const match = results.results.find(r => r.type === 'audio');
    expect(match).toBeDefined();
    expect(match?.fileName).toContain('Court_Proceeding');
    expect(match?.speakerLabel).toBe('Defense Counsel');
    expect(match?.startTime).toBeGreaterThan(40);
  });

  it('should find specific transaction numbers in document exhibits with page numbers', () => {
    const results = searchEngine.search('450,000', 'keyword');
    expect(results.totalMatches).toBeGreaterThan(0);

    const docMatch = results.results.find(r => r.type === 'document');
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
      MOCK_EVIDENCE_FILES,
      'Where did the witness discuss receiving money or financial transfers?'
    );

    expect(semanticResults.length).toBeGreaterThan(0);
    // Should return results referencing the 450,000 Cedis transfer or CBG account
    const hasFinancialMatch = semanticResults.some(r =>
      r.surroundingContext.includes('450,000') ||
      r.surroundingContext.includes('Cedis') ||
      r.surroundingContext.includes('Consolidated Bank')
    );
    expect(hasFinancialMatch).toBe(true);
  });
});
