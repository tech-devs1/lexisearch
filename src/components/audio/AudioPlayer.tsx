import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  MessageSquareQuote,
  Sparkles
} from 'lucide-react';
import { EvidenceFile, TranscriptSegment } from '../../types/evidence';
import { formatSecondsToTimestamp } from '../../services/audioProcessor';
import { formatHashTruncated } from '../../services/crypto';
import { useCase } from '../../context/CaseContext';
import { getEvidenceBlobUrl } from '../../services/storageVault';

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
  const [audioUrl, setAudioUrl] = useState<string | null>(evidence.fileUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialSeekSeconds);
  const [duration, setDuration] = useState(evidence.durationSeconds || 154);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | null>(null);
  const [usingSynthesizedSpeech, setUsingSynthesizedSpeech] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Resolve audio source URL from IndexedDB vault or evidence URL
  useEffect(() => {
    let isCancelled = false;

    async function resolveAudioSource() {
      // 1. Check local IndexedDB vault first (guarantees fresh working blob URL across reloads)
      try {
        const storedUrl = await getEvidenceBlobUrl(evidence.id);
        if (!isCancelled && storedUrl) {
          setAudioUrl(storedUrl);
          setUsingSynthesizedSpeech(false);
          return;
        }
      } catch (e) {
        console.warn('Could not read from evidence vault:', e);
      }

      // 2. Fall back to evidence.fileUrl if it is a valid remote URL (not an expired blob URL from a past session)
      if (evidence.fileUrl && !evidence.fileUrl.startsWith('blob:')) {
        if (!isCancelled) {
          setAudioUrl(evidence.fileUrl);
          setUsingSynthesizedSpeech(false);
        }
        return;
      }

      // 3. If evidence.fileUrl was a blob URL created in this session, try using it
      if (evidence.fileUrl && evidence.fileUrl.startsWith('blob:')) {
        if (!isCancelled) {
          setAudioUrl(evidence.fileUrl);
          setUsingSynthesizedSpeech(false);
        }
        return;
      }

      if (!isCancelled) {
        setAudioUrl(null);
        setUsingSynthesizedSpeech(true);
      }
    }

    resolveAudioSource();

    return () => {
      isCancelled = true;
    };
  }, [evidence]);

  // Jump to initial seek position if supplied
  useEffect(() => {
    if (initialSeekSeconds > 0) {
      seekTo(initialSeekSeconds);
    }
  }, [initialSeekSeconds]);

  // Sync playback rate with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Track active segment based on current time
  useEffect(() => {
    if (!evidence.segments || evidence.segments.length === 0) return;
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

  // Speak segment when using speech synthesis fallback (only for simulated demo fixtures without a real audio binary)
  const speakCurrentSegment = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : volume;
    speechUtteranceRef.current = utterance;

    utterance.onend = () => {
      // Continue to next segment if playing
      if (isPlaying && evidence.segments) {
        const nextIdx = activeSegmentIndex + 1;
        if (nextIdx < evidence.segments.length) {
          seekTo(evidence.segments[nextIdx].startTime);
        } else {
          setIsPlaying(false);
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [playbackRate, isMuted, volume, isPlaying, evidence.segments, activeSegmentIndex]);

  // Simulated timer ticker when speech synthesis / simulated playback is active
  useEffect(() => {
    let interval: any;
    if (isPlaying && !audioUrl) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            return 0;
          }
          const next = prev + 0.25 * playbackRate;
          return parseFloat(next.toFixed(2));
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioUrl, duration, playbackRate]);

  // Trigger speech synthesis when active segment changes in simulated mode
  useEffect(() => {
    if (isPlaying && !audioUrl && evidence.segments && evidence.segments[activeSegmentIndex]) {
      speakCurrentSegment(evidence.segments[activeSegmentIndex].text);
    }
  }, [activeSegmentIndex, isPlaying, audioUrl, evidence.segments, speakCurrentSegment]);

  const togglePlay = async () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Initial audio playback attempt failed, trying IndexedDB blob recovery:', err);
          // Attempt recovery from vault
          try {
            const freshUrl = await getEvidenceBlobUrl(evidence.id);
            if (freshUrl && audioRef.current) {
              setAudioUrl(freshUrl);
              audioRef.current.src = freshUrl;
              await audioRef.current.play();
              setIsPlaying(true);
              return;
            }
          } catch (retryErr) {
            console.error('Audio playback recovery error:', retryErr);
          }
        }
      }
    } else {
      // Synthesized speech or simulated audio fallback
      if (isPlaying) {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (evidence.segments && evidence.segments[activeSegmentIndex]) {
          speakCurrentSegment(evidence.segments[activeSegmentIndex].text);
        }
      }
    }
  };

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(clamped);

    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = clamped;
    }

    if (!audioUrl && isPlaying && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const seg = evidence.segments?.find(s => clamped >= s.startTime && clamped <= s.endTime);
      if (seg) {
        speakCurrentSegment(seg.text);
      }
    }
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
      {/* Hidden Native Audio Element for Real Sound Playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={async (e) => {
            console.warn('Native audio element reported error, attempting IndexedDB recovery...', e);
            try {
              const freshUrl = await getEvidenceBlobUrl(evidence.id);
              if (freshUrl && freshUrl !== audioUrl) {
                setAudioUrl(freshUrl);
                if (audioRef.current) {
                  audioRef.current.src = freshUrl;
                  audioRef.current.load();
                }
              }
            } catch (err) {
              console.error('Audio recovery failed:', err);
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Player Header & Metadata */}
      <div className="p-4 lg:p-6 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-slate-800 text-slate-300 border border-slate-700">
              Legal Audio Evidence
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SHA-256: {formatHashTruncated(evidence.sha256Hash, 8)}
            </span>
            {usingSynthesizedSpeech && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Speech Synthesis Active
              </span>
            )}
          </div>
          <h2 className="text-base lg:text-lg font-semibold text-slate-100 mt-1 flex items-center gap-2">
            {evidence.fileName}
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Duration: {formatSecondsToTimestamp(duration)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {evidence.speakerCount || 2} Identified Speakers
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cryptographically Sealed
            </span>
          </div>
        </div>

        {/* Playback Rate & Volume Controls */}
        <div className="flex items-center gap-4">
          {/* Volume Slider & Mute Toggle */}
          <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-300 hover:text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const newVol = parseFloat(e.target.value);
                setVolume(newVol);
                if (newVol > 0 && isMuted) setIsMuted(false);
              }}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title="Volume control"
            />
          </div>

          {/* Speed Selectors */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-1">Speed:</span>
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  playbackRate === rate
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Waveform & Scrubber Control */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="text-blue-400 font-medium">{formatSecondsToTimestamp(currentTime)}</span>
          <span>{formatSecondsToTimestamp(duration)}</span>
        </div>

        {/* Progress bar scrubber */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            seekTo(pct * duration);
          }}
          className="h-2 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group"
        >
          <div
            className="h-full bg-blue-500 relative rounded-full transition-all duration-75"
            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
          />
          <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Transport buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => seekTo(currentTime - 5)}
            className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center shadow-md shadow-blue-600/25 active:scale-95 transition"
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => seekTo(currentTime + 5)}
            className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Transcripts with Speaker Diarization */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-blue-400" />
            <span className="tracking-wide">SYNCHRONIZED TRANSCRIPT WITH SPEAKER LABELS</span>
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
                    ? 'bg-blue-600/10 border border-blue-500/30'
                    : isMatch
                    ? 'bg-slate-800 border border-slate-700'
                    : 'hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        seg.speakerLabel?.includes('Judge')
                          ? 'bg-purple-950/70 text-purple-300 border border-purple-800/50'
                          : seg.speakerLabel?.includes('Attorney') || seg.speakerLabel?.includes('Prosecution')
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                          : seg.speakerLabel?.includes('Counsel')
                          ? 'bg-blue-950/70 text-blue-300 border border-blue-800/50'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {seg.speakerLabel || 'Speaker'}
                    </span>

                    <button
                      onClick={() => seekTo(seg.startTime)}
                      className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
                    >
                      [{formatSecondsToTimestamp(seg.startTime)} - {formatSecondsToTimestamp(seg.endTime)}]
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateBookmark(seg)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                      bookmarkSuccess === seg.id
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
                              ? 'bg-blue-500 text-white font-medium scale-105'
                              : isWordQuery
                              ? 'bg-blue-900/50 text-blue-200 font-semibold'
                              : 'hover:text-blue-300'
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
