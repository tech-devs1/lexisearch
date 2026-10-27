import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  ExternalLink, 
  FileText, 
  Headphones, 
  Scale, 
  HelpCircle,
  Key,
  CheckCircle2,
  X,
  Cpu
} from 'lucide-react';
import { askLegalEvidenceAi, getActiveAiProvider } from '../../services/legalAiRAG';
import { GroundedAiResponse } from '../../types/search';
import { useCase } from '../../context/CaseContext';

export const LegalAiPanel: React.FC = () => {
  const { evidenceList, activeCase } = useCase();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GroundedAiResponse | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('gleis_gemini_api_key') : '') || '';
  });
  const [openaiKeyInput, setOpenaiKeyInput] = useState(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('gleis_openai_api_key') : '') || '';
  });
  const [keySavedToast, setKeySavedToast] = useState(false);

  const activeProvider = useMemo(() => getActiveAiProvider(), [keySavedToast, showKeyModal]);

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

  const handleSaveKeys = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gleis_gemini_api_key', geminiKeyInput.trim());
      localStorage.setItem('gleis_openai_api_key', openaiKeyInput.trim());
    }
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const handleCitationClick = (citation: any) => {
    if (citation.type === 'audio') {
      navigate(`/audio?id=${citation.evidenceId}&seek=${citation.seconds || 0}`);
    } else {
      navigate(`/document?id=${citation.evidenceId}&page=${citation.pageNumber || 1}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
      {/* Header & Active AI Engine Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-semibold text-slate-100">
              Grounded Legal Evidence Assistant (RAG)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inquire about sworn testimonies, bank statements, and exhibits. All assertions are anchored
            strictly to verifiable evidentiary sources. Fabrications and legal opinions on guilt or innocence are strictly prohibited.
          </p>
        </div>

        {/* Engine Status & Key Config Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-850 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-medium">
              {activeProvider.provider === 'gemini' 
                ? 'Gemini 1.5 Flash' 
                : activeProvider.provider === 'openai' 
                ? 'GPT-4o-mini' 
                : 'Local RAG Engine'}
            </span>
          </div>
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
            title="Configure Gemini or OpenAI API credentials"
          >
            <Key className="w-3 h-3 text-slate-400" />
            <span>API Keys</span>
          </button>
        </div>
      </div>

      {/* Suggested Case Inquiries */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="tracking-wide">SUGGESTED CASE INQUIRIES</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
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
              className="text-left p-2.5 rounded-lg bg-slate-850 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-slate-100 transition line-clamp-2"
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
        className="flex gap-3"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask any question grounded in the ${evidenceList.length} evidence file(s) of this case...`}
          className="flex-1 px-4 py-3 bg-slate-850 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm shadow-md shadow-blue-600/25 transition flex items-center gap-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing...</span>
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Inquire</span>
            </>
          )}
        </button>
      </form>

      {/* Answer Box */}
      {response && (
        <div className="p-6 rounded-xl bg-slate-850/80 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EVIDENTIARY SYNTHESIS REPORT</span>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {response.answer}
            </div>
          </div>

          {/* Citations List */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>VERIFIABLE EVIDENCE CITATIONS ({response.citations.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.citations.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleCitationClick(c)}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                          {c.type === 'audio' ? (
                            <Headphones className="w-3 h-3 text-blue-400 shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{c.fileName}</span>
                        </span>
                        <span className="font-mono text-blue-400 font-semibold shrink-0">
                          {c.type === 'audio' ? `[${c.timestampRange}]` : `[Page ${c.pageNumber}]`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                        "{c.quoteSnippet}"
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-blue-400 font-medium group-hover:underline">
                      <span>Jump to exact source playback/page</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Statutory Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{response.disclaimer}</span>
          </div>
        </div>
      )}

      {/* Quick API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </span>
                <h3 className="text-base font-semibold text-slate-100">Configure AI Intelligence Keys</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Keys are stored securely in your browser's private local vault and used to power multimodal audio transcription and grounded legal RAG synthesis.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Gemini API Key (Multimodal Audio & RAG)
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enables Gemini 1.5 Flash verbatim transcription and Ghanaian language audio comprehension.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  OpenAI / Whisper API Key
                </label>
                <input
                  type="password"
                  value={openaiKeyInput}
                  onChange={(e) => setOpenaiKeyInput(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enables Whisper word-level timestamps and GPT-4o-mini legal cross-examination synthesis.
                </span>
              </div>
            </div>

            {keySavedToast && (
              <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>API credentials saved successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveKeys}
                className="px-5 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/20"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
