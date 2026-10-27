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
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 lg:p-5 shadow-sm space-y-3.5">
      {/* Mode Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => onModeChange('keyword')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              mode === 'keyword'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exact Keyword
          </button>
          <button
            type="button"
            onClick={() => onModeChange('exact_phrase')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              mode === 'exact_phrase'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exact Phrase "..."
          </button>
          <button
            type="button"
            onClick={() => onModeChange('semantic')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              mode === 'semantic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Semantic (Meaning)
          </button>
        </div>

        {/* Evidence Type Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'all' })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              !filters.evidenceType || filters.evidenceType === 'all'
                ? 'bg-slate-800 text-blue-400 border-blue-900/60'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            All Evidence
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'audio' })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition ${
              filters.evidenceType === 'audio'
                ? 'bg-slate-800 text-blue-400 border-blue-900/60'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Audio Only
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'document' })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition ${
              filters.evidenceType === 'document'
                ? 'bg-slate-800 text-blue-400 border-blue-900/60'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents Only
          </button>
        </div>
      </div>

      {/* Main Search Input with Voice Search Mic */}
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
            className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none transition font-sans ${
              isListening 
                ? 'border-red-500/80 ring-2 ring-red-500/20' 
                : 'border-slate-800 focus:border-blue-500'
            }`}
          />

          {/* Voice Search Button Inside Input */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
            }`}
            title={isListening ? 'Stop voice listening' : 'Start voice search (Speech-to-Text)'}
          >
            {isListening ? (
              <Mic className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </form>

      {/* Voice Recognition Status Banner */}
      {voiceNotice && (
        <div className={`p-2 rounded-md border text-xs flex items-center justify-between transition ${
          isListening 
            ? 'bg-red-950/40 border-red-900/60 text-red-300' 
            : 'bg-blue-950/40 border-blue-900/60 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {isListening ? (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{voiceNotice}</span>
          </div>
          {isListening && (
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className="text-[11px] underline font-medium text-red-400 hover:text-red-300"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Hint for Search Quality */}
      <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <span>
          {mode === 'semantic' ? (
            <span className="text-slate-400 font-mono text-[10px]">
              SEMANTIC MODE: Identifies conceptually related witness statements and financial ledgers.
            </span>
          ) : (
            <span className="text-slate-400 font-mono text-[10px]">
              EXACT MODE: Cross-examines word-level audio transcripts and page-preserved exhibits.
            </span>
          )}
        </span>
        <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
          <Mic className="w-3 h-3 text-blue-400" />
          Voice search: English (Ghana)
        </span>
      </div>
    </div>
  );
};
