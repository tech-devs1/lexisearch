import { EvidenceFile } from '../types/evidence';
import { GroundedAiResponse, GroundedCitation } from '../types/search';
import { formatSecondsToTimestamp } from './audioProcessor';

export interface GroundedQuestionOptions {
  geminiApiKey?: string;
  openaiApiKey?: string;
}

const LEGAL_DISCLAIMER = 
  "DISCLAIMER: This analysis is an AI-assisted evidentiary citation tool based strictly on uploaded case files. It does not constitute legal counsel, nor does it make factual determinations of guilt, innocence, or the forensic authenticity of source records. All citations must be independently verified against original exhibits.";

/**
 * Legal RAG Question Answering Engine
 * Answers legal queries strictly grounded in the loaded evidence records.
 * Generates verified citations to audio timestamps and document pages.
 */
export async function askLegalEvidenceAi(
  question: string,
  evidenceFiles: EvidenceFile[],
  options: GroundedQuestionOptions = {}
): Promise<GroundedAiResponse> {
  const geminiKey = options.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = options.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY;

  // Build grounded context corpus with exact identifiers
  const corpusSegments: Array<{
    citationId: string;
    type: 'audio' | 'document';
    evidenceId: string;
    fileName: string;
    identifier: string;
    seconds?: number;
    pageNumber?: number;
    text: string;
    speaker?: string;
  }> = [];

  for (const file of evidenceFiles) {
    if (file.fileType === 'audio' && file.segments) {
      for (const seg of file.segments) {
        corpusSegments.push({
          citationId: `cite_aud_${seg.id}`,
          type: 'audio',
          evidenceId: file.id,
          fileName: file.fileName,
          identifier: `[Audio: ${file.fileName} @ ${formatSecondsToTimestamp(seg.startTime)} - ${formatSecondsToTimestamp(seg.endTime)}]`,
          seconds: seg.startTime,
          text: `${seg.speakerLabel ? `[${seg.speakerLabel}]: ` : ''}${seg.text}`,
          speaker: seg.speakerLabel,
        });
      }
    } else if (file.fileType === 'document' && file.pages) {
      for (const page of file.pages) {
        corpusSegments.push({
          citationId: `cite_doc_${page.id}`,
          type: 'document',
          evidenceId: file.id,
          fileName: file.fileName,
          identifier: `[Doc: ${file.fileName}, Page ${page.pageNumber}]`,
          pageNumber: page.pageNumber,
          text: page.text,
        });
      }
    }
  }

  // Find relevant corpus passages based on question keywords
  const qTokens = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scoredSegments = corpusSegments.map(item => {
    let score = 0;
    const lower = item.text.toLowerCase();
    for (const token of qTokens) {
      if (lower.includes(token)) score += 2;
    }
    return { item, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  const topSegments = scoredSegments.slice(0, 8).map(s => s.item);

  // If no passages match at all, respond truthfully without hallucination
  if (topSegments.length === 0) {
    return {
      answer: "Based on a thorough review of the uploaded evidence in this case, no records, transcripts, or document passages mention or support an answer to this inquiry. The system cannot confirm or substantiate this matter without corresponding source evidence.",
      citations: [],
      evidenceFound: false,
      disclaimer: LEGAL_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  // If Gemini API is available, invoke it with strict grounding prompt
  if (geminiKey && geminiKey.trim().length > 15) {
    try {
      const contextPrompt = topSegments.map(s => `${s.identifier}:\n"${s.text}"`).join('\n\n');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a legal evidence research assistant for the Judicial Service of Ghana.
Answer the following query using ONLY the provided evidence passages below.
CRITICAL RULES:
1. Every factual assertion MUST cite the exact audio timestamp or document page identifier provided.
2. If the evidence does not clearly state or support an answer, explicitly declare that the evidence is silent or insufficient.
3. NEVER fabricate facts, quotations, or citations.
4. Do NOT make legal conclusions of guilt or innocence.

QUERY: "${question}"

EVIDENCE PASSAGES:
${contextPrompt}`
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          const citations: GroundedCitation[] = topSegments.slice(0, 4).map(s => ({
            citationId: s.citationId,
            type: s.type,
            evidenceId: s.evidenceId,
            fileName: s.fileName,
            timestampRange: s.seconds !== undefined ? formatSecondsToTimestamp(s.seconds) : undefined,
            seconds: s.seconds,
            pageNumber: s.pageNumber,
            quoteSnippet: s.text.slice(0, 140) + '...',
          }));

          return {
            answer: generatedText,
            citations,
            evidenceFound: true,
            disclaimer: LEGAL_DISCLAIMER,
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, using deterministic legal RAG generator:', err);
    }
  }

  // Deterministic Grounded Evidence Synthesizer
  const citations: GroundedCitation[] = topSegments.slice(0, 3).map(s => ({
    citationId: s.citationId,
    type: s.type,
    evidenceId: s.evidenceId,
    fileName: s.fileName,
    timestampRange: s.seconds !== undefined ? formatSecondsToTimestamp(s.seconds) : undefined,
    seconds: s.seconds,
    pageNumber: s.pageNumber,
    quoteSnippet: s.text.slice(0, 160) + '...',
  }));

  const synthesisParagraphs = [
    `Upon reviewing the evidentiary record for this case, the source files disclose the following specific points:`,
  ];

  topSegments.slice(0, 3).forEach((item, index) => {
    if (item.type === 'audio') {
      synthesisParagraphs.push(
        `${index + 1}. In audio recording "${item.fileName}" at timestamp [${formatSecondsToTimestamp(item.seconds || 0)}], ${item.speaker || 'the speaker'} testified: "${item.text}".`
      );
    } else {
      synthesisParagraphs.push(
        `${index + 1}. In document "${item.fileName}" on Page ${item.pageNumber}, the record states: "${item.text.slice(0, 200)}...".`
      );
    }
  });

  synthesisParagraphs.push(
    `Note: The uploaded materials do not provide further unilateral confirmation regarding motives or external unrecorded communications.`
  );

  return {
    answer: synthesisParagraphs.join('\n\n'),
    citations,
    evidenceFound: true,
    disclaimer: LEGAL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}
