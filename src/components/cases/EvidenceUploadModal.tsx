import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Headphones, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">Upload Legal Evidence</h3>
              <p className="text-xs text-slate-400">Audio recordings & legal document exhibits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessingUpload}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-8 text-center bg-slate-850/50 hover:bg-slate-850 transition cursor-pointer"
        >
          <input
            type="file"
            id="evidence-file-input"
            onChange={handleFileChange}
            accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.pdf,.docx,.txt,.png,.jpg,.jpeg"
            className="hidden"
            disabled={isProcessingUpload}
          />
          <label htmlFor="evidence-file-input" className="cursor-pointer space-y-3 block">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to browse or drag & drop evidence file
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Audio (MP3, WAV, M4A) • Documents (PDF, DOCX, TXT) • Scanned Exhibits
              </p>
            </div>
          </label>
        </div>

        {/* Selected File Details */}
        {selectedFile && (
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                {selectedFile.type.startsWith('audio') ? (
                  <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <span className="font-semibold text-slate-200 truncate">{selectedFile.name}</span>
              </div>
              <span className="text-slate-400 shrink-0 font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SHA-256 chain-of-custody seal will be computed before ingestion</span>
            </div>
          </div>
        )}

        {/* Processing Stepper Status */}
        {isProcessingUpload && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div className="text-xs text-amber-300 font-medium">{uploadStatusMessage}</div>
          </div>
        )}

        {/* Success Notice */}
        {uploadSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Evidence uploaded, transcribed/extracted, sealed, and indexed successfully!</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingUpload}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isProcessingUpload || uploadSuccess}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Incorporate & Process Evidence</span>
          </button>
        </div>
      </div>
    </div>
  );
};
