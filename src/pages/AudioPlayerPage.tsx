import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { useCase } from '../context/CaseContext';

export const AudioPlayerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const evidenceId = searchParams.get('id');
  const seekSeconds = parseFloat(searchParams.get('seek') || '0');
  const highlightQuery = searchParams.get('q') || '';

  const { evidenceList, getEvidenceById } = useCase();

  // Find audio file: either from URL query id, or first audio file in active case
  const audioEvidence = evidenceId
    ? getEvidenceById(evidenceId)
    : evidenceList.find((e) => e.fileType === 'audio') || evidenceList[0];

  if (!audioEvidence || audioEvidence.fileType !== 'audio') {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs">
          <Headphones className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {evidenceId ? 'Evidentiary Access Restricted' : 'No Audio Evidence Selected'}
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {evidenceId
            ? 'You do not hold judicial authorization to inspect this courtroom recording, or access to this matter was revoked by the Court Registrar.'
            : 'Please select an authorized audio recording from Case Management or upload an audio exhibit to begin interactive playback.'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      <AudioPlayer
        evidence={audioEvidence}
        initialSeekSeconds={seekSeconds}
        highlightQuery={highlightQuery}
      />
    </div>
  );
};
