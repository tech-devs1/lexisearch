import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  ExternalLink, 
  FileText, 
  Headphones, 
  Scale, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import { askLegalEvidenceAi, getActiveAiProvider } from '../../services/legalAiRAG';
import { GroundedAiResponse } from '../../types/search';
import { useCase } from '../../context/CaseContext';

export const LegalAiPanel: React.FC = () => {
  const { evidenceList } = useCase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [question, setQuestion] = useState(queryParam);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GroundedAiResponse | null>(null);

  useEffect(() => {
    if (queryParam.trim() && !response && !isLoading) {
      setQuestion(queryParam.trim());
      handleAsk(queryParam.trim());
    }
  }, [queryParam]);

  const activeProvider = useMemo(() => getActiveAiProvider(), []);

  // Generate dynamic, case-specific suggested prompts based on actual evidence loaded
  const samplePrompts = useMemo(() => {
    if (!evidenceList || evidenceList.length === 0) {
      return [
        'How do I upload and ingest audio recordings or documents into this case?',
        'What evidence file formats and hash integrity seals are supported by GLEIS?',
        'What is the evidentiary standard required for court exhibits in Ghana?',
        'Summarize the chain of custody protocols for digital exhibits.'
      ];
    }

    const audioFile = evidenceList.find(e => e.fileType === 'audio');
    const docFile = evidenceList.find(e => e.fileType === 'document');

    const prompts: string[] = [
      `Summarize all key evidence and testimonies recorded in this case.`,
    ];

    if (audioFile) {
      prompts.push(`What specific statements were made by speakers in "${audioFile.fileName}"?`);
    }

    if (docFile) {
      prompts.push(`What are the primary findings and dates documented in "${docFile.fileName}"?`);
    }

    prompts.push(`Are there any factual discrepancies between the recorded audio and documentary exhibits?`);

    return prompts.slice(0, 4);
  }, [evidenceList]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const result = await askLegalEvidenceAi(q, evidenceList);
      setResponse(result);
    } catch (err) {
      console.error('AI Evidence Q&A error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: any) => {
    if (citation.type === 'audio') {
      navigate(`/audio?id=${citation.evidenceId}&seek=${citation.seconds || 0}`);
    } else {
      navigate(`/document?id=${citation.evidenceId}&page=${citation.pageNumber || 1}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col space-y-6">
      {/* Header & Active AI Engine Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              Grounded Legal Evidence Assistant (RAG)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Inquire about sworn testimonies, bank statements, and exhibits. All assertions are anchored
            strictly to verifiable evidentiary sources. Fabrications and legal opinions on guilt or innocence are strictly prohibited.
          </p>
        </div>

        {/* Engine Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
            <Cpu className="w-3.5 h-3.5 text-gray-700" />
            <span className="text-gray-900 font-mono text-[11px] font-medium">
              {activeProvider.provider === 'gemini' 
                ? 'Gemini 3.5 Flash-Lite · Multimodal RAG' 
                : activeProvider.provider === 'openai' 
                ? 'GPT-4o-mini' 
                : 'Local RAG Engine'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" title="Connected" />
          </div>
        </div>
      </div>

      {/* Suggested Case Inquiries */}
      <div>
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between font-mono uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
            <span>SUGGESTED CASE INQUIRIES</span>
          </div>
          <span className="text-[11px] text-gray-400 font-normal normal-case">
            Click to auto-populate and run
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(p);
                handleAsk(p);
              }}
              className="text-left p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 hover:text-gray-900 transition line-clamp-2"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex gap-2.5"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask any question grounded in the ${evidenceList.length} evidence file(s) of this case...`}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-5 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-medium rounded-lg text-xs transition flex items-center gap-2 shadow-xs shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing...</span>
            </span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Inquire</span>
            </>
          )}
        </button>
      </form>

      {/* Answer Box */}
      {response && (
        <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 shadow-xs space-y-4 animate-in fade-in duration-300">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-2 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-gray-700" />
              <span>EVIDENTIARY SYNTHESIS REPORT</span>
            </div>
            <div className="text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {response.answer}
            </div>
          </div>

          {/* Citations List */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5 font-mono">
                <Scale className="w-3.5 h-3.5 text-gray-600" />
                <span>VERIFIABLE EVIDENCE CITATIONS ({response.citations.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.citations.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleCitationClick(c)}
                    className="p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-400 cursor-pointer transition flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                          {c.type === 'audio' ? (
                            <Headphones className="w-3 h-3 text-gray-600 shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 text-gray-600 shrink-0" />
                          )}
                          <span className="truncate">{c.fileName}</span>
                        </span>
                        <span className="font-mono text-gray-900 font-semibold shrink-0">
                          {c.type === 'audio' ? `[${c.timestampRange}]` : `[Page ${c.pageNumber}]`}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-serif line-clamp-2">
                        "{c.quoteSnippet}"
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-900 font-medium group-hover:underline">
                      <span>Jump to exact source playback/page</span>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Statutory Disclaimer */}
          <div className="p-3 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{response.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
