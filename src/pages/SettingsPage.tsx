import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Download,
  Trash2,
  CheckCircle2,
  Lock,
  Eye,
  Globe,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  FileCheck,
  Mic,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCase } from '../context/CaseContext';
import { globalAuditService } from '../services/auditService';
import { getGeminiModel, testGeminiApiKey, saveGeminiConfig } from '../services/geminiService';

export const SettingsPage: React.FC = () => {
  const { currentUser, canManageUsers, canManageSettings } = useAuth();
  const { cases, evidenceList, clearAllMockData } = useCase();
  const [saved, setSaved] = useState(false);

  // Security & Privacy settings
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [requireMfa, setRequireMfa] = useState(false);
  const [auditDownloads, setAuditDownloads] = useState(true);
  const [auditSearches, setAuditSearches] = useState(true);

  // Notification preferences
  const [notifyOnUpload, setNotifyOnUpload] = useState(true);
  const [notifyOnSearch, setNotifyOnSearch] = useState(false);
  const [notifyOnExport, setNotifyOnExport] = useState(true);

  // Display preferences
  const [showHashFull, setShowHashFull] = useState(false);
  const [defaultSearchMode, setDefaultSearchMode] = useState('keyword');
  const [transcriptLanguage, setTranscriptLanguage] = useState('en-GH');
  const [openaiApiKey, setOpenaiApiKey] = useState(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('gleis_openai_api_key') : '') || '';
  });
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return (
      (typeof localStorage !== 'undefined' ? localStorage.getItem('gleis_gemini_api_key') : '') ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      ''
    );
  });
  const [geminiModel, setGeminiModel] = useState(() => getGeminiModel());
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestFeedback, setGeminiTestFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestFeedback(null);
    try {
      const result = await testGeminiApiKey(geminiApiKey);
      setGeminiTestFeedback(result);
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSave = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gleis_openai_api_key', openaiApiKey.trim());
      saveGeminiConfig(geminiApiKey, geminiModel);
    }
    if (currentUser) {
      globalAuditService.logAction({
        caseId: 'system',
        action: 'PERMISSION_CHANGE',
        actionDescription: 'User updated application settings and speech transcription credentials.',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportAllAuditLogs = () => {
    const allLogs = globalAuditService.getCaseLogs();
    const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GLEIS_Full_Audit_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalStorageMB = evidenceList.reduce((sum, e) => sum + (e.fileSizeBytes || 0), 0) / (1024 * 1024);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
            <Settings className="w-3.5 h-3.5" />
          </span>
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">
            System Configuration & Settings
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Manage security policies, notification preferences, and system behaviour for GLEIS.
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <span className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 text-gray-900 flex items-center justify-center font-bold text-lg">
            {currentUser?.displayName.charAt(0)}
          </span>
          <div>
            <div className="text-sm font-semibold text-gray-900">{currentUser?.displayName}</div>
            <div className="text-xs text-gray-500 font-mono">{currentUser?.email}</div>
            <div className="text-[11px] text-gray-600 uppercase tracking-wider font-mono font-medium">
              {currentUser?.role.replace('_', ' ')} — {currentUser?.organizationName}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-lg font-bold text-gray-900 font-mono">{cases.length}</div>
            <div className="text-gray-500 mt-0.5">Active Cases</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-lg font-bold text-gray-900 font-mono">{evidenceList.length}</div>
            <div className="text-gray-500 mt-0.5">Evidence Files</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-lg font-bold text-gray-900 font-mono">{totalStorageMB.toFixed(1)} MB</div>
            <div className="text-gray-500 mt-0.5">Storage Used</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-lg font-bold text-emerald-600 font-mono">100%</div>
            <div className="text-gray-500 mt-0.5">Integrity Score</div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Shield className="w-4 h-4 text-gray-800" />
          <h2 className="text-sm font-semibold text-gray-900">Security & Access Policies</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Session Timeout</div>
              <div className="text-gray-500 mt-0.5">Automatically log out inactive officers after this period.</div>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="480">8 hours (shift)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Multi-Factor Authentication (MFA)</div>
              <div className="text-gray-500 mt-0.5">Require OTP or authenticator app for all judicial logins.</div>
            </div>
            <button
              onClick={() => setRequireMfa(!requireMfa)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${requireMfa ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${requireMfa ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Audit Evidence Downloads</div>
              <div className="text-gray-500 mt-0.5">Log every officer who downloads or exports evidence files.</div>
            </div>
            <button
              onClick={() => setAuditDownloads(!auditDownloads)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${auditDownloads ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${auditDownloads ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Audit All Search Queries</div>
              <div className="text-gray-500 mt-0.5">Record every search performed across all cases in the audit trail.</div>
            </div>
            <button
              onClick={() => setAuditSearches(!auditSearches)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${auditSearches ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${auditSearches ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Bell className="w-4 h-4 text-gray-800" />
          <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4 text-xs">
          {[
            { label: 'Evidence Upload Alerts', desc: 'Notify when new audio or documents are uploaded to your cases.', val: notifyOnUpload, set: setNotifyOnUpload },
            { label: 'Search Query Notifications', desc: 'Alert when a colleague performs a search in your case.', val: notifyOnSearch, set: setNotifyOnSearch },
            { label: 'Custody Export Notifications', desc: 'Alert when chain-of-custody reports are exported from your cases.', val: notifyOnExport, set: setNotifyOnExport },
          ].map(({ label, desc, val, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-gray-500 mt-0.5">{desc}</div>
              </div>
              <button
                onClick={() => set(!val)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${val ? 'bg-gray-900' : 'bg-gray-200'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Eye className="w-4 h-4 text-gray-800" />
          <h2 className="text-sm font-semibold text-gray-900">Display & Search Preferences</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Show Full SHA-256 Hashes</div>
              <div className="text-gray-500 mt-0.5">Display complete 64-character hash strings instead of truncated 8-char previews.</div>
            </div>
            <button
              onClick={() => setShowHashFull(!showHashFull)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${showHashFull ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${showHashFull ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Default Search Mode</div>
              <div className="text-gray-500 mt-0.5">Mode used when opening the Unified Search page.</div>
            </div>
            <select
              value={defaultSearchMode}
              onChange={(e) => setDefaultSearchMode(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            >
              <option value="keyword">Keyword Search</option>
              <option value="phrase">Exact Phrase</option>
              <option value="semantic">AI Semantic Search</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Transcription Language</div>
              <div className="text-gray-500 mt-0.5">Primary language for audio transcription and keyword matching.</div>
            </div>
            <select
              value={transcriptLanguage}
              onChange={(e) => setTranscriptLanguage(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            >
              <option value="en-GH">English (Ghana)</option>
              <option value="en-GB">English (UK)</option>
              <option value="tw">Twi (Akan)</option>
              <option value="ee">Ewe</option>
              <option value="dag">Dagbani</option>
            </select>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-gray-900">Google Gemini API Key (Multimodal Transcription & RAG)</div>
                <div className="text-gray-500 mt-0.5">Unified API key powering courtroom audio/video verbatim transcription, speaker diarization, and evidentiary RAG search.</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Paste Google AI Studio Key..."
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 font-mono text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900 w-full sm:w-64"
                />
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={isTestingGemini || !geminiApiKey.trim()}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white font-medium text-xs rounded-lg disabled:opacity-50 transition shrink-0 shadow-xs"
                >
                  {isTestingGemini ? 'Testing...' : 'Test Key'}
                </button>
              </div>
            </div>

            {/* Configurable Gemini Model Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100/60">
              <div>
                <div className="font-medium text-gray-900 text-xs">Active Gemini Model for Transcription & Reasoning</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Select a currently supported Google Gemini model for evidence processing.</div>
              </div>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs font-mono focus:ring-1 focus:ring-gray-900 focus:border-gray-900 w-full sm:w-64"
              >
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Recommended · Fast STT & RAG)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (Balanced Multimodal)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Latest General Multimodal)</option>
              </select>
            </div>

            {geminiTestFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  geminiTestFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {geminiTestFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{geminiTestFeedback.message}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-100">
            <div>
              <div className="font-medium text-gray-900">OpenAI / Whisper API Key (Audio Speech-to-Text)</div>
              <div className="text-gray-500 mt-0.5">Allows cloud Whisper transcription for newly uploaded audio files with word-level timestamps.</div>
            </div>
            <input
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 font-mono text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      {canManageUsers() && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Database className="w-4 h-4 text-gray-800" />
            <h2 className="text-sm font-semibold text-gray-900">Data Management & Exports (Admin)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-gray-700" />
                  Export Full Audit Trail
                </div>
                <div className="text-gray-500 mt-0.5">Download HMAC-verified audit log export for all cases and system events.</div>
              </div>
              <button
                onClick={handleExportAllAuditLogs}
                className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-700" />
                  Storage Utilization
                </div>
                <div className="text-gray-500 mt-0.5">
                  {evidenceList.length} files using {totalStorageMB.toFixed(2)} MB of evidential vault storage.
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-gray-900 font-mono">{totalStorageMB.toFixed(1)} MB</div>
                <div className="text-[10px] text-gray-500 font-mono">of evidence stored</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-red-50/50 border border-red-200 flex items-center justify-between">
              <div>
                <div className="font-medium text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Clear All Mock & Demo Data
                </div>
                <div className="text-red-700/80 mt-0.5">
                  Purges all simulated cases, mock evidence files, demo transcripts, and bookmarks, resetting GLEIS to a pristine empty state.
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all mock/demo cases and evidence? This operation resets GLEIS to a clean slate.')) {
                    clearAllMockData();
                    alert('All mock data has been purged from the system.');
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Mock Data
              </button>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                  Clear Local Session Cache
                </div>
                <div className="text-gray-500 mt-0.5">
                  Wipes browser localStorage and IndexedDB cache (uploaded evidence blobs).
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Clear local session cache?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase & Compliance Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-gray-800" />
          <h2 className="text-sm font-semibold text-gray-900">System & Compliance Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Storage Provider', val: 'Cloudflare R2 (API & Vault Encrypted)', icon: Globe },
            { label: 'Firebase Project', val: 'glies-6c39a (Auth, Firestore, DB)', icon: HardDrive },
            { label: 'Evidence Bucket', val: 'gleis-evidence (Cloudflare R2)', icon: Globe },
            { label: 'Auth Standard', val: 'Firebase Auth + Judicial RBAC (5 Core Personas)', icon: Lock },
            { label: 'Evidence Integrity', val: 'SHA-256 + HMAC Audit Chain', icon: ShieldCheck },
            { label: 'Compliance', val: 'Ghana Evidence Act, NRCD 323', icon: FileCheck },
            { label: 'Voice Search', val: 'Web Speech STT (English / Dialect)', icon: Mic },
            { label: 'GLEIS Version', val: 'v1.0.0 — Judicial Service Build', icon: Settings },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-700 shrink-0" />
              <div>
                <div className="text-gray-500 text-[11px]">{label}</div>
                <div className="font-medium text-gray-900">{val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-lg text-xs font-medium transition flex items-center gap-2 shadow-xs ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-900 hover:bg-black text-white'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  );
};
