import { EvidenceType } from './evidence';

export type SearchMode = 'keyword' | 'exact_phrase' | 'semantic';

export interface SearchFilters {
  evidenceType?: 'all' | EvidenceType;
  speaker?: string;
  minPage?: number;
  maxPage?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AudioSearchMatch {
  type: 'audio';
  evidenceId: string;
  fileName: string;
  segmentId: string;
  speakerLabel?: string;
  startTime: number;
  endTime: number;
  matchedText: string;
  surroundingContext: string;
  exactWord?: string;
  wordTimestamp?: number;
  isApproximateTimestamp: boolean;
  score: number;
}

export interface DocumentSearchMatch {
  type: 'document';
  evidenceId: string;
  fileName: string;
  pageId: string;
  pageNumber: number;
  sectionHeading?: string;
  matchedText: string;
  surroundingContext: string;
  isOcr: boolean;
  score: number;
}

export type SearchResultItem = AudioSearchMatch | DocumentSearchMatch;

export interface GroupedSearchResults {
  evidenceId: string;
  fileName: string;
  fileType: EvidenceType;
  sha256Hash: string;
  matches: SearchResultItem[];
  totalMatches: number;
}

export interface GroundedCitation {
  citationId: string;
  type: 'audio' | 'document';
  evidenceId: string;
  fileName: string;
  timestampRange?: string; // "[03:45 - 04:12]"
  seconds?: number;
  pageNumber?: number;     // "Page 7"
  section?: string;
  quoteSnippet: string;
}

export interface GroundedAiResponse {
  answer: string;
  citations: GroundedCitation[];
  evidenceFound: boolean;
  disclaimer: string;
  generatedAt: string;
}
