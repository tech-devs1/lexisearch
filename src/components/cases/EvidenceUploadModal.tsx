import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Headphones, 
  Video,
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Cloud
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  onClose,
  caseId,
}) => {
  const { uploadEvidence, isProcessingUpload, uploadStatusMessage } = useCase();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setErrorMessage('');
    setUploadSuccess(false);
    try {
      await uploadEvidence(selectedFile, caseId);
      setUploadSuccess(true);
      setTimeout(() => {
        setSelectedFile(null);
        setUploadSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Evidence processing encountered an error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl max-w-xl w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
              <Upload className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span>Upload Legal Evidence</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-mono font-medium flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-gray-500" />
                  Cloudflare R2 Encrypted
                </span>
              </h3>
              <p className="text-xs text-gray-500">Audio, video recordings & legal document exhibits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessingUpload}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 hover:border-gray-500 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100/50 transition cursor-pointer"
        >
          <input
            type="file"
            id="evidence-file-input"
            onChange={handleFileChange}
            accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.webm,.mov,.mkv,.pdf,.docx,.txt,.png,.jpg,.jpeg"
            className="hidden"
            disabled={isProcessingUpload}
          />
          <label htmlFor="evidence-file-input" className="cursor-pointer space-y-3 block">
            <div className="w-10 h-10 mx-auto rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">
                Click to browse or drag & drop evidence file
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Audio (MP3, WAV, M4A) • Video (MP4, WEBM) • Documents (PDF, DOCX) • Exhibits
              </p>
            </div>
          </label>
        </div>

        {/* Selected File Details */}
        {selectedFile && (
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                {selectedFile.type.startsWith('video') ? (
                  <Video className="w-4 h-4 text-gray-700 shrink-0" />
                ) : selectedFile.type.startsWith('audio') ? (
                  <Headphones className="w-4 h-4 text-gray-700 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-700 shrink-0" />
                )}
                <span className="font-semibold text-gray-900 truncate">{selectedFile.name}</span>
              </div>
              <span className="text-gray-500 shrink-0 font-mono text-xs">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="text-[11px] text-emerald-700 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SHA-256 chain-of-custody seal will be computed before ingestion</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Dest: Cloudflare R2</span>
            </div>
          </div>
        )}

        {/* Processing Stepper Status */}
        {isProcessingUpload && (
          <div className="p-3 rounded-lg bg-gray-100 border border-gray-200 flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-gray-800 animate-spin shrink-0" />
            <div className="text-xs text-gray-800 font-medium">{uploadStatusMessage}</div>
          </div>
        )}

        {/* Success Notice */}
        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Evidence uploaded to Cloudflare R2, transcribed/extracted, sealed, and indexed successfully!</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingUpload}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isProcessingUpload || uploadSuccess}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gray-900 hover:bg-black disabled:opacity-50 text-white transition flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Incorporate & Process Evidence</span>
          </button>
        </div>
      </div>
    </div>
  );
};
