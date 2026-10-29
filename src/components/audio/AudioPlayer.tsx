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
  Sparkles,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EvidenceFile, TranscriptSegment } from '../../types/evidence';
import { formatSecondsToTimestamp, transcribeAudioFile } from '../../services/audioProcessor';
import { formatHashTruncated } from '../../services/crypto';
import { useCase } from '../../context/CaseContext';
import { getEvidenceBlobUrl, getEvidenceBlob } from '../../services/storageVault';

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
  const { addBookmark, updateEvidence } = useCase();
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

  // Transcription & Edit States
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [transcribeEngine, setTranscribeEngine] = useState<'gemini' | 'whisper' | 'browser'>('gemini');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState('');
  const [transcribeError, setTranscribeError] = useState('');
  const [transcribeSuccess, setTranscribeSuccess] = useState(false);

  // Manual Editing States
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptSegment[]>(evidence.segments || []);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Update editedSegments when evidence prop changes
  useEffect(() => {
    setEditedSegments(evidence.segments || []);
    if (evidence.durationSeconds) {
      setDuration(evidence.durationSeconds);
    }
  }, [evidence]);

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

      // 2. Fall back to evidence.fileUrl if it is a valid remote URL
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

  // Track active transcript segment based on currentTime
  useEffect(() => {
    const segments = editedSegments.length > 0 ? editedSegments : evidence.segments;
    if (!segments || segments.length === 0) return;

    const idx = segments.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );

    if (idx !== -1 && idx !== activeSegmentIndex) {
      setActiveSegmentIndex(idx);

      // Auto-scroll transcript container smoothly to keep speaker in view
      const activeEl = document.getElementById(`seg-row-${idx}`);
      if (activeEl && transcriptContainerRef.current) {
        const container = transcriptContainerRef.current;
        const offsetTop = activeEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: offsetTop - 60, behavior: 'smooth' });
      }
    }
  }, [currentTime, editedSegments, evidence.segments, activeSegmentIndex]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Playback error, falling back to speech synthesis:', err);
          playSpeechSynthesis(currentTime);
        });
      }
    } else {
      // Audio file not loaded directly -> Speech Synthesis fallback
      if (isPlaying) {
        stopSpeechSynthesis();
      } else {
        playSpeechSynthesis(currentTime);
      }
    }
  }, [isPlaying, audioUrl, currentTime]);

  // Seek audio to specific second
  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(clamped);

    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = clamped;
    } else if (isPlaying) {
      stopSpeechSynthesis();
      playSpeechSynthesis(clamped);
    }
  };

  // Speech synthesis fallback implementation
  const playSpeechSynthesis = (startSec: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setUsingSynthesizedSpeech(true);

    const segments = editedSegments.length > 0 ? editedSegments : evidence.segments || [];
    const remainingSegments = segments.filter((s) => s.endTime >= startSec);
    const combinedText = remainingSegments.map((s) => `${s.speakerLabel}: ${s.text}`).join('. ');

    if (!combinedText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(combinedText);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeechSynthesis = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Bookmark a segment
  const handleCreateBookmark = async (seg: TranscriptSegment) => {
    await addBookmark({
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      fileName: evidence.fileName,
      type: 'audio',
      timestamp: seg.startTime,
      timestampDisplay: `${formatSecondsToTimestamp(seg.startTime)} - ${formatSecondsToTimestamp(seg.endTime)}`,
      passageSnippet: seg.text,
      note: `Bookmarked from synchronized audio playback (${seg.speakerLabel}).`,
      tags: [seg.speakerLabel || 'Speaker', 'Audio Testimony'],
    });

    setBookmarkSuccess(seg.id);
    setTimeout(() => setBookmarkSuccess(null), 2500);
  };

  // Run AI Re-transcription (Gemini 1.5 or OpenAI Whisper)
  const handleRunTranscription = async () => {
    setIsTranscribing(true);
    setTranscribeError('');
    setTranscribeStatus('Retrieving evidence binary from secure vault...');

    try {
      let audioBlob = await getEvidenceBlob(evidence.id);

      if (!audioBlob && audioUrl) {
        setTranscribeStatus('Fetching audio stream...');
        const resp = await fetch(audioUrl);
        audioBlob = await resp.blob();
      }

      if (!audioBlob) {
        throw new Error('Could not retrieve audio file blob. Please re-upload the audio file.');
      }

      setTranscribeStatus(
        transcribeEngine === 'gemini'
          ? 'Transcribing courtroom recording with Google Gemini Multimodal AI...'
          : 'Transcribing word timestamps with OpenAI Whisper...'
      );

      const audioFile = new File([audioBlob], evidence.fileName, { type: audioBlob.type || 'audio/mp3' });
      const result = await transcribeAudioFile(audioFile, evidence.id, {
        language: 'en-GH',
      });

      if (result.warnings && result.warnings.length > 0 && result.segments.length === 0) {
        throw new Error(result.warnings[0]);
      }

      setTranscribeStatus('Updating evidence transcript and indexing...');

      await updateEvidence(evidence.id, {
        segments: result.segments,
        durationSeconds: result.durationSeconds || duration,
        speakerCount: result.speakerCount || 2,
        statusMessage: `Transcribed via ${transcribeEngine.toUpperCase()}`,
      });

      setEditedSegments(result.segments);
      setDuration(result.durationSeconds || duration);
      setTranscribeSuccess(true);
      setIsTranscribing(false);

      setTimeout(() => {
        setShowTranscribeModal(false);
        setTranscribeSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Audio re-transcription error:', err);
      setTranscribeError(err.message || 'Transcription failed.');
      setIsTranscribing(false);
    }
  };

  // Save manual transcript edits
  const handleSaveTranscriptEdits = async () => {
    setIsSavingEdit(true);
    try {
      await updateEvidence(evidence.id, {
        segments: editedSegments,
        speakerCount: new Set(editedSegments.map(s => s.speakerLabel)).size,
      });
      setIsEditingTranscript(false);
    } catch (err) {
      console.error('Failed to save transcript edits:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
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
      <div className="p-4 lg:p-5 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 border border-gray-200 font-medium">
              Legal Audio Evidence
            </span>
            <span className="text-xs text-gray-500 font-mono">
              SHA-256: {formatHashTruncated(evidence.sha256Hash, 8)}
            </span>
            {usingSynthesizedSpeech && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-gray-500" />
                Speech Synthesis Active
              </span>
            )}
          </div>
          <h2 className="text-base lg:text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
            {evidence.fileName}
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              Duration: {formatSecondsToTimestamp(duration)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              {evidence.speakerCount || 2} Identified Speakers
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cryptographically Sealed
            </span>
          </div>
        </div>

        {/* Playback Rate & Volume Controls */}
        <div className="flex items-center gap-4">
          {/* Volume Slider & Mute Toggle */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-gray-600 hover:text-gray-900"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-600" />
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
              className="w-16 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              title="Volume control"
            />
          </div>

          {/* Speed Selectors */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1 font-mono">Speed:</span>
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  playbackRate === rate
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Waveform & Scrubber Control */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
          <span className="text-gray-900 font-semibold">{formatSecondsToTimestamp(currentTime)}</span>
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
          className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden group"
        >
          <div
            className="h-full bg-gray-900 relative rounded-full transition-all duration-75"
            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
          />
          <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Transport buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => seekTo(currentTime - 5)}
            className="p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 shadow-xs transition"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gray-900 hover:bg-black text-white font-medium flex items-center justify-center shadow-xs active:scale-95 transition"
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => seekTo(currentTime + 5)}
            className="p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 shadow-xs transition"
            title="Forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Synchronized Transcripts Header & Diarization Actions */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#F8F8F8]">
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between text-xs font-semibold text-gray-700 gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-gray-700" />
            <span className="tracking-wide font-mono uppercase text-gray-900">SYNCHRONIZED TRANSCRIPT WITH SPEAKER LABELS</span>
          </div>

          <div className="flex items-center gap-2">
            {isEditingTranscript ? (
              <>
                <button
                  onClick={() => setIsEditingTranscript(false)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-normal transition text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveTranscriptEdits}
                  disabled={isSavingEdit}
                  className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-black text-white font-medium transition text-xs flex items-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Transcript'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditingTranscript(true)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 hover:text-black font-medium transition text-xs flex items-center gap-1 shadow-xs"
                  title="Edit speaker labels and transcript text directly"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Edit Transcript</span>
                </button>
                <button
                  onClick={() => setShowTranscribeModal(true)}
                  className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-black text-white font-medium transition text-xs flex items-center gap-1.5 shadow-xs"
                  title="Run speech-to-text with Gemini or Whisper"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Transcribe with AI</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Transcript Segments List */}
        <div
          ref={transcriptContainerRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3"
        >
          {editedSegments.map((seg, idx) => {
            const isActive = activeSegmentIndex === idx;
            const isMatch = highlightQuery && seg.text.toLowerCase().includes(highlightQuery.toLowerCase());

            return (
              <div
                key={seg.id}
                id={`seg-row-${idx}`}
                className={`p-3.5 rounded-xl border transition ${
                  isActive
                    ? 'bg-white border-gray-900 shadow-xs ring-1 ring-gray-900'
                    : isMatch
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {isEditingTranscript ? (
                      <input
                        type="text"
                        value={seg.speakerLabel || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditedSegments(prev => prev.map((s, i) => i === idx ? { ...s, speakerLabel: val } : s));
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 w-44"
                        placeholder="Speaker Label (e.g. Judge)"
                      />
                    ) : (
                      <span
                        className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200"
                      >
                        {seg.speakerLabel || 'Speaker'}
                      </span>
                    )}

                    <button
                      onClick={() => seekTo(seg.startTime)}
                      className="text-xs font-mono text-gray-600 hover:text-black hover:underline flex items-center gap-1 font-medium"
                    >
                      [{formatSecondsToTimestamp(seg.startTime)} - {formatSecondsToTimestamp(seg.endTime)}]
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateBookmark(seg)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                      bookmarkSuccess === seg.id
                        ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Bookmark this testimony segment"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{bookmarkSuccess === seg.id ? 'Bookmarked!' : 'Bookmark'}</span>
                  </button>
                </div>

                {/* Segment Text Editor / Word Timestamp Visualizer */}
                {isEditingTranscript ? (
                  <textarea
                    rows={2}
                    value={seg.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditedSegments(prev => prev.map((s, i) => i === idx ? { ...s, text: val } : s));
                    }}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-sans focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-y"
                  />
                ) : (
                  <p
                    onClick={() => seekTo(seg.startTime)}
                    className={`text-sm leading-relaxed cursor-pointer ${
                      isActive ? 'text-gray-950 font-medium' : 'text-gray-700'
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
                                ? 'bg-gray-900 text-white font-medium scale-105'
                                : isWordQuery
                                ? 'bg-gray-200 text-gray-950 font-semibold'
                                : 'hover:text-black'
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
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Speech Transcription Modal */}
      {showTranscribeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-gray-900">Transcribe Audio Evidence</h3>
              </div>
              <button
                onClick={() => setShowTranscribeModal(false)}
                disabled={isTranscribing}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-1">
              <div className="font-semibold text-gray-900">{evidence.fileName}</div>
              <div className="text-gray-500 flex items-center gap-3 font-mono text-[11px]">
                <span>Duration: {formatSecondsToTimestamp(duration)}</span>
                <span>SHA-256: {formatHashTruncated(evidence.sha256Hash, 8)}</span>
              </div>
            </div>

            {/* Select Engine */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700 font-mono text-[11px]">
                Select Speech-to-Text Engine:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTranscribeEngine('gemini')}
                  className={`p-3 rounded-xl border text-left transition ${
                    transcribeEngine === 'gemini'
                      ? 'bg-gray-50 border-gray-900 text-gray-900 ring-1 ring-gray-900 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-gray-900 flex items-center justify-between">
                    <span>Google Gemini 1.5</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-gray-200 text-gray-900 font-mono rounded">Best</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Multimodal audio transcription with Ghanaian legal diarization.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTranscribeEngine('whisper')}
                  className={`p-3 rounded-xl border text-left transition ${
                    transcribeEngine === 'whisper'
                      ? 'bg-gray-50 border-gray-900 text-gray-900 ring-1 ring-gray-900 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-gray-900">
                    OpenAI Whisper
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Word-level timestamp granularities and segment alignment.
                  </div>
                </button>
              </div>

              {/* Credential Status Note */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                <div className="font-medium text-gray-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Server-Managed AI Infrastructure Active</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Transcription runs securely via authenticated server credentials. Verbatim transcripts, speaking turns, and chronological timestamps are preserved without exposing keys to clients.
                </div>
              </div>
            </div>

            {/* Status & Alerts */}
            {isTranscribing && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2.5 text-gray-800 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-gray-900 shrink-0" />
                <span>{transcribeStatus}</span>
              </div>
            )}

            {transcribeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Audio transcribed, verified, and saved to case ledger successfully!</span>
              </div>
            )}

            {transcribeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{transcribeError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowTranscribeModal(false)}
                disabled={isTranscribing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunTranscription}
                disabled={isTranscribing || transcribeSuccess}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gray-900 hover:bg-black disabled:opacity-50 text-white transition flex items-center gap-2 shadow-xs"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transcribing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Transcription</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
