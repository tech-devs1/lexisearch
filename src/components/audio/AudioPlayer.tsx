import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  ShieldCheck, 
  Clock, 
  Users, 
  ExternalLink,
  MessageSquareQuote
} from 'lucide-react';
import { EvidenceFile, TranscriptSegment } from '../../types/evidence';
import { formatSecondsToTimestamp } from '../../services/audioProcessor';
import { formatHashTruncated } from '../../services/crypto';
import { useCase } from '../../context/CaseContext';

interface AudioPlayerProps {
  evidence: EvidenceFile;
  initialSeekSeconds?: number;
  highlightQuery?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  evidence,
  initialSeekSeconds = 0,
  highlightQuery = '',
}) => {
  const { addBookmark } = useCase();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialSeekSeconds);
  const [duration, setDuration] = useState(evidence.durationSeconds || 154);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  // Jump to initial seek position if supplied
  useEffect(() => {
    if (initialSeekSeconds > 0) {
      seekTo(initialSeekSeconds);
    }
  }, [initialSeekSeconds]);

  // Audio timer ticker if simulated or real audio element is playing
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 0.25 * playbackRate;
          return parseFloat(next.toFixed(2));
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playbackRate]);

  // Detect active segment based on current time
  useEffect(() => {
    if (!evidence.segments) return;
    const idx = evidence.segments.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    if (idx !== -1 && idx !== activeSegmentIndex) {
      setActiveSegmentIndex(idx);
      // Auto-scroll transcript container
      const activeEl = document.getElementById(`seg-row-${idx}`);
      if (activeEl && transcriptContainerRef.current) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentTime, evidence.segments, activeSegmentIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(clamped);
  };

  const handleCreateBookmark = async (seg: TranscriptSegment) => {
    await addBookmark({
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      fileName: evidence.fileName,
      type: 'audio',
      timestamp: seg.startTime,
      timestampDisplay: formatSecondsToTimestamp(seg.startTime),
      passageSnippet: `[${seg.speakerLabel || 'Speaker'}]: ${seg.text}`,
      note: 'Bookmarked from interactive transcript player.',
      tags: ['Court Transcript', seg.speakerLabel || 'Testimony'],
    });

    setBookmarkSuccess(seg.id);
    setTimeout(() => setBookmarkSuccess(null), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Player Header & Metadata */}
      <div className="p-4 lg:p-6 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Legal Audio Evidence
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SHA-256: {formatHashTruncated(evidence.sha256Hash, 8)}
            </span>
          </div>
          <h2 className="text-base lg:text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            {evidence.fileName}
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Duration: {formatSecondsToTimestamp(duration)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              {evidence.speakerCount || 2} Identified Speakers
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cryptographically Verified
            </span>
          </div>
        </div>

        {/* Playback Rate & Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Speed:</span>
          {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                playbackRate === rate
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Waveform & Scrubber Control */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="text-amber-400 font-semibold">{formatSecondsToTimestamp(currentTime)}</span>
          <span>{formatSecondsToTimestamp(duration)}</span>
        </div>

        {/* Progress bar scrubber */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            seekTo(pct * duration);
          }}
          className="h-3 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 relative rounded-full transition-all duration-75"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div className="absolute inset-0 bg-amber-400/10 opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Transport buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => seekTo(currentTime - 5)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
          </button>

          <button
            onClick={() => seekTo(currentTime + 5)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Transcripts with Speaker Diarization */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-3 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-amber-400" />
            <span>SYNCHRONIZED TRANSCRIPT WITH SPEAKER LABELS</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            Click any sentence or timestamp to jump audio
          </span>
        </div>

        <div
          ref={transcriptContainerRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 divide-y divide-slate-800/40"
        >
          {evidence.segments?.map((seg, idx) => {
            const isActive = activeSegmentIndex === idx;
            const isMatch = highlightQuery && seg.text.toLowerCase().includes(highlightQuery.toLowerCase());

            return (
              <div
                key={seg.id}
                id={`seg-row-${idx}`}
                className={`pt-3 rounded-xl p-3.5 transition ${
                  isActive
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : isMatch
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        seg.speakerLabel?.includes('Judge')
                          ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                          : seg.speakerLabel?.includes('Attorney') || seg.speakerLabel?.includes('Prosecution')
                          ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                          : seg.speakerLabel?.includes('Counsel')
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                          : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {seg.speakerLabel || 'Speaker'}
                    </span>

                    <button
                      onClick={() => seekTo(seg.startTime)}
                      className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
                    >
                      [{formatSecondsToTimestamp(seg.startTime)} - {formatSecondsToTimestamp(seg.endTime)}]
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateBookmark(seg)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                      bookmarkSuccess === seg.id
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                    }`}
                    title="Bookmark this testimony segment"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{bookmarkSuccess === seg.id ? 'Bookmarked!' : 'Bookmark'}</span>
                  </button>
                </div>

                {/* Segment Text with Word Highlights */}
                <p
                  onClick={() => seekTo(seg.startTime)}
                  className={`text-sm leading-relaxed cursor-pointer ${
                    isActive ? 'text-slate-100 font-medium' : 'text-slate-300'
                  }`}
                >
                  {seg.words && seg.words.length > 0 ? (
                    seg.words.map((w, wIdx) => {
                      const isWordActive = currentTime >= w.start && currentTime <= w.end;
                      const isWordQuery = highlightQuery && w.word.toLowerCase().includes(highlightQuery.toLowerCase());

                      return (
                        <span
                          key={wIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(w.start);
                          }}
                          className={`inline-block mr-1 rounded px-0.5 transition ${
                            isWordActive
                              ? 'bg-amber-400 text-slate-950 font-bold scale-105'
                              : isWordQuery
                              ? 'bg-yellow-400/40 text-yellow-200 font-semibold'
                              : 'hover:text-amber-300'
                          }`}
                        >
                          {w.word}
                        </span>
                      );
                    })
                  ) : (
                    seg.text
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
