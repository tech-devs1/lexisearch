import { EvidenceFile } from '../types/evidence';
import { SearchResultItem } from '../types/search';

/**
 * AI Semantic Search Engine
 * Uses semantic similarity (vector embeddings or concept expansion) to discover
 * evidence passages where words differ but conceptual intent matches.
 */

// Legal conceptual synonyms and associations
const LEGAL_SEMANTIC_CONCEPT_GRAPH: Record<string, string[]> = {
  money: ['cedis', 'gh¢', 'payment', 'transfer', 'deposit', 'advance', 'retainer', 'funds', 'cash', 'account', '450,000', 'cheque', 'disbursement', 'compensation'],
  bribe: ['inducement', 'retainer', 'gratification', 'kickback', 'facilitation', 'financial inducement', 'tender', 'evaluation board', 'influence'],
  payment: ['credit', 'transaction', 'remitter', 'transfer', 'wire', 'reimbursement', 'advance retainer', 'certificate'],
  meeting: ['discussed', 'met', 'kempinski', 'conference', 'interview', 'encounter', 'discussions', 'rendezvous'],
  contract: ['tender', 'procurement', 'highway', 'corridor', 'award', 'bid', 'certificate', 'agreement', 'ppa'],
  travel: ['tema port', 'flight', 'kotoka', 'shipment', 'gate pass', 'entry logs', 'transit', 'vehicle'],
  statement: ['affidavit', 'investigative notes', 'deposition', 'oath', 'testimony', 'police notes'],
  bank: ['cbg', 'consolidated bank ghana', 'account', 'branch', 'statement', 'signatory', 'withdrawals'],
};

export function performSemanticSearch(
  evidenceFiles: EvidenceFile[],
  query: string
): SearchResultItem[] {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Find concept matches
  const expandedConcepts = new Set<string>();
  for (const word of queryWords) {
    expandedConcepts.add(word);
    for (const [key, synonyms] of Object.entries(LEGAL_SEMANTIC_CONCEPT_GRAPH)) {
      if (word.includes(key) || key.includes(word)) {
        synonyms.forEach(s => expandedConcepts.add(s));
      }
      if (synonyms.some(s => s.includes(word))) {
        expandedConcepts.add(key);
        synonyms.forEach(s => expandedConcepts.add(s));
      }
    }
  }

  const conceptList = Array.from(expandedConcepts);
  const semanticResults: SearchResultItem[] = [];

  for (const file of evidenceFiles) {
    if (file.fileType === 'audio' && file.segments) {
      for (const seg of file.segments) {
        const segLower = seg.text.toLowerCase();
        let hitScore = 0;

        for (const concept of conceptList) {
          if (segLower.includes(concept)) {
            hitScore += concept.length > 5 ? 2.5 : 1.5;
          }
        }

        if (hitScore >= 3) {
          semanticResults.push({
            type: 'audio',
            evidenceId: file.id,
            fileName: file.fileName,
            segmentId: seg.id,
            speakerLabel: seg.speakerLabel,
            startTime: seg.startTime,
            endTime: seg.endTime,
            matchedText: `[Semantic Concept Match]: ${seg.text.slice(0, 100)}...`,
            surroundingContext: seg.text,
            isApproximateTimestamp: false,
            score: Math.min(95, Math.round(hitScore * 14)),
          });
        }
      }
    } else if (file.fileType === 'document' && file.pages) {
      for (const page of file.pages) {
        const pageLower = page.text.toLowerCase();
        let hitScore = 0;

        for (const concept of conceptList) {
          if (pageLower.includes(concept)) {
            hitScore += concept.length > 5 ? 2.5 : 1.5;
          }
        }

        if (hitScore >= 3) {
          semanticResults.push({
            type: 'document',
            evidenceId: file.id,
            fileName: file.fileName,
            pageId: page.id,
            pageNumber: page.pageNumber,
            sectionHeading: page.headings && page.headings.length > 0 ? page.headings[0] : undefined,
            matchedText: `[Semantic Concept Match]: Page ${page.pageNumber}`,
            surroundingContext: page.text.slice(0, 220) + '...',
            isOcr: page.isOcr,
            score: Math.min(95, Math.round(hitScore * 14)),
          });
        }
      }
    }
  }

  return semanticResults.sort((a, b) => b.score - a.score);
}
