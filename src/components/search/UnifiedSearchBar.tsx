import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  FileText, 
  Headphones, 
  Check, 
  Mic, 
  MicOff, 
  Volume2, 
  Loader2 
} from 'lucide-react';
import { SearchFilters, SearchMode } from '../../types/search';

interface UnifiedSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  mode,
  onModeChange,
  filters,
  onFilterChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = 'en-GH'; // English (Ghana) default, falls back to browser default

      recognizer.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening... speak testimony quote, witness name, or keyword');
      };

      recognizer.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onQueryChange(transcript.trim());
        }
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone access denied. Please grant microphone permission.');
        } else if (event.error === 'no-speech') {
          setVoiceNotice('No voice detected. Click the microphone to try again.');
        } else {
          setVoiceNotice(`Voice recognition error: ${event.error}`);
        }
        setTimeout(() => setVoiceNotice(null), 4000);
      };

      recognizer.onend = () => {
        setIsListening(false);
        setVoiceNotice(null);
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [onQueryChange]);

  const toggleVoiceSearch = () => {
    if (!speechSupported) {
      setVoiceNotice('Voice search is not supported by your current browser. Please try Google Chrome, Edge, or Safari.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setVoiceNotice(null);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
    onSearch();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl space-y-4">
      {/* Mode Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onModeChange('keyword')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'keyword'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exact Keyword
          </button>
          <button
            type="button"
            onClick={() => onModeChange('exact_phrase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'exact_phrase'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exact Phrase "..."
          </button>
          <button
            type="button"
            onClick={() => onModeChange('semantic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === 'semantic'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Semantic (By Meaning)
          </button>
        </div>

        {/* Evidence Type Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'all' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              !filters.evidenceType || filters.evidenceType === 'all'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            All Evidence
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'audio' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              filters.evidenceType === 'audio'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Audio Only
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'document' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              filters.evidenceType === 'document'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents Only
          </button>
        </div>
      </div>

      {/* Main Search Input with Voice Search Mic */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to speech... speak your evidentiary query now'
                : mode === 'semantic'
                ? 'Search by meaning, e.g. "Where did the witness discuss receiving money or wire transfers?"'
                : mode === 'exact_phrase'
                ? 'Search exact courtroom quotes, e.g. "Kempinski Hotel in Accra"'
                : 'Enter keywords, names, dates, amounts, e.g. "450,000", "Tema Port", "Exhibit P7"'
            }
            className={`w-full pl-12 pr-12 py-3 bg-slate-800/90 border rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition ${
              isListening 
                ? 'border-red-500/80 ring-2 ring-red-500/30' 
                : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />

          {/* Voice Search Button Inside Input */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-700/60'
            }`}
            title={isListening ? 'Stop voice listening' : 'Start voice search (Speech-to-Text)'}
          >
            {isListening ? (
              <Mic className="w-4 h-4 fill-white animate-bounce" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Execute Search</span>
        </button>
      </form>

      {/* Voice Recognition Status Banner */}
      {voiceNotice && (
        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
          isListening 
            ? 'bg-red-500/10 border-red-500/30 text-red-300' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {isListening ? (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
            <span>{voiceNotice}</span>
          </div>
          {isListening && (
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className="text-[11px] underline font-semibold text-red-400 hover:text-red-300"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Hint for Search Quality */}
      <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>
          {mode === 'semantic' ? (
            <span className="text-purple-300">
              * Semantic search retrieves conceptually related passages even if exact terms differ (e.g., money ↔ 450,000 Cedis transfer).
            </span>
          ) : (
            <span>* Searches word-level audio transcripts and page-preserved document exhibits simultaneously.</span>
          )}
        </span>
        <span className="text-slate-400 flex items-center gap-1">
          <Mic className="w-3 h-3 text-amber-400" />
          Voice search supported (English / Courtroom dialect)
        </span>
      </div>
    </div>
  );
};
