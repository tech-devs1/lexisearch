import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  ExternalLink, 
  Play, 
  FileText, 
  Headphones, 
  Scale, 
  Clock,
  HelpCircle
} from 'lucide-react';
import { askLegalEvidenceAi } from '../../services/legalAiRAG';
import { GroundedAiResponse } from '../../types/search';
import { useCase } from '../../context/CaseContext';

export const LegalAiPanel: React.FC = () => {
  const { evidenceList, activeCase } = useCase();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GroundedAiResponse | null>(null);

  const samplePrompts = [
    'What did the witness say regarding the 450,000 Ghana Cedis deposit into his account?',
    'Did Kwame Mensah meet anyone at the Kempinski Hotel on 14th March 2026 according to the evidence?',
    'What does Exhibit P7 state about the remitter of the questioned payments?',
    'Who authorized the cash withdrawal from Consolidated Bank Ghana?',
  ];

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Grounded Legal Evidence Assistant (RAG)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inquire about sworn testimonies, bank statements, and exhibits. All assertions are anchored
            strictly to verifiable evidentiary sources. Fabrications and legal opinions on guilt or innocence are strictly prohibited.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs">
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>Strict Citation Standard</span>
        </div>
      </div>

      {/* Suggested Questions */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>SUGGESTED CASE INQUIRIES</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(p);
                handleAsk(p);
              }}
              className="text-left p-2.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
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
          placeholder="Ask any question grounded in the evidence records of this case..."
          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/20 transition flex items-center gap-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyze</span>
            </>
          )}
        </button>
      </form>

      {/* Answer Box */}
      {response && (
        <div className="p-6 rounded-xl bg-slate-850 border border-slate-700 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EVIDENTIARY SYNTHESIS</span>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-wrap select-text">
              {response.answer}
            </div>
          </div>

          {/* Citations List */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-4 border-t border-slate-700/60">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>VERIFIABLE EVIDENCE CITATIONS ({response.citations.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.citations.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleCitationClick(c)}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-200 flex items-center gap-1">
                          {c.type === 'audio' ? (
                            <Headphones className="w-3 h-3 text-amber-400" />
                          ) : (
                            <FileText className="w-3 h-3 text-blue-400" />
                          )}
                          {c.fileName}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">
                          {c.type === 'audio' ? `[${c.timestampRange}]` : `[Page ${c.pageNumber}]`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-serif line-clamp-2">
                        "{c.quoteSnippet}"
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-amber-400 font-medium group-hover:underline">
                      <span>Jump to exact source</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Statutory Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{response.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
