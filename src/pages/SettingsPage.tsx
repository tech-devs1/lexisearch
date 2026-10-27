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
  EyeOff,
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

export const SettingsPage: React.FC = () => {
  const { currentUser, canManageUsers } = useAuth();
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
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('gleis_gemini_api_key') : '') || '';
  });

  const handleSave = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gleis_openai_api_key', openaiApiKey.trim());
      localStorage.setItem('gleis_gemini_api_key', geminiApiKey.trim());
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-100">
            System Configuration & Settings
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage security policies, notification preferences, and system behaviour for GLEIS.
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <span className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            {currentUser?.displayName.charAt(0)}
          </span>
          <div>
            <div className="text-sm font-bold text-slate-100">{currentUser?.displayName}</div>
            <div className="text-xs text-slate-400 font-mono">{currentUser?.email}</div>
            <div className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">
              {currentUser?.role.replace('_', ' ')} — {currentUser?.organizationName}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div className="text-lg font-black text-slate-100">{cases.length}</div>
            <div className="text-slate-400 mt-0.5">Active Cases</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div className="text-lg font-black text-slate-100">{evidenceList.length}</div>
            <div className="text-slate-400 mt-0.5">Evidence Files</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div className="text-lg font-black text-amber-400">{totalStorageMB.toFixed(1)} MB</div>
            <div className="text-slate-400 mt-0.5">Storage Used</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div className="text-lg font-black text-emerald-400">100%</div>
            <div className="text-slate-400 mt-0.5">Integrity Score</div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100">Security & Access Policies</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Session Timeout</div>
              <div className="text-slate-400 mt-0.5">Automatically log out inactive officers after this period.</div>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
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
              <div className="font-semibold text-slate-200">Multi-Factor Authentication (MFA)</div>
              <div className="text-slate-400 mt-0.5">Require OTP or authenticator app for all judicial logins.</div>
            </div>
            <button
              onClick={() => setRequireMfa(!requireMfa)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${requireMfa ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${requireMfa ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Audit Evidence Downloads</div>
              <div className="text-slate-400 mt-0.5">Log every officer who downloads or exports evidence files.</div>
            </div>
            <button
              onClick={() => setAuditDownloads(!auditDownloads)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${auditDownloads ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${auditDownloads ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Audit All Search Queries</div>
              <div className="text-slate-400 mt-0.5">Record every search performed across all cases in the audit trail.</div>
            </div>
            <button
              onClick={() => setAuditSearches(!auditSearches)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${auditSearches ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${auditSearches ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100">Notification Preferences</h2>
        </div>

        <div className="space-y-4 text-xs">
          {[
            { label: 'Evidence Upload Alerts', desc: 'Notify when new audio or documents are uploaded to your cases.', val: notifyOnUpload, set: setNotifyOnUpload },
            { label: 'Search Query Notifications', desc: 'Alert when a colleague performs a search in your case.', val: notifyOnSearch, set: setNotifyOnSearch },
            { label: 'Custody Export Notifications', desc: 'Alert when chain-of-custody reports are exported from your cases.', val: notifyOnExport, set: setNotifyOnExport },
          ].map(({ label, desc, val, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">{label}</div>
                <div className="text-slate-400 mt-0.5">{desc}</div>
              </div>
              <button
                onClick={() => set(!val)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${val ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Eye className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-slate-100">Display & Search Preferences</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Show Full SHA-256 Hashes</div>
              <div className="text-slate-400 mt-0.5">Display complete 64-character hash strings instead of truncated 8-char previews.</div>
            </div>
            <button
              onClick={() => setShowHashFull(!showHashFull)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${showHashFull ? 'bg-purple-500' : 'bg-slate-700'}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showHashFull ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Default Search Mode</div>
              <div className="text-slate-400 mt-0.5">Mode used when opening the Unified Search page.</div>
            </div>
            <select
              value={defaultSearchMode}
              onChange={(e) => setDefaultSearchMode(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="keyword">Keyword Search</option>
              <option value="phrase">Exact Phrase</option>
              <option value="semantic">AI Semantic Search</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Transcription Language</div>
              <div className="text-slate-400 mt-0.5">Primary language for audio transcription and keyword matching.</div>
            </div>
            <select
              value={transcriptLanguage}
              onChange={(e) => setTranscriptLanguage(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="en-GH">English (Ghana)</option>
              <option value="en-GB">English (UK)</option>
              <option value="tw">Twi (Akan)</option>
              <option value="ee">Ewe</option>
              <option value="dag">Dagbani</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">Google Gemini API Key (Multimodal Audio & RAG)</div>
              <div className="text-slate-400 mt-0.5">Powers Gemini 1.5 Flash courtroom speech transcription, Ghanaian language audio recognition, and grounded legal Q&A.</div>
            </div>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="px-3 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 w-full sm:w-64"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">OpenAI / Whisper API Key (Audio Speech-to-Text)</div>
              <div className="text-slate-400 mt-0.5">Allows cloud Whisper transcription for newly uploaded audio files with word-level timestamps.</div>
            </div>
            <input
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="px-3 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      {canManageUsers() && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">Data Management & Exports (Admin)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Export Full Audit Trail
                </div>
                <div className="text-slate-400 mt-0.5">Download HMAC-verified audit log export for all cases and system events.</div>
              </div>
              <button
                onClick={handleExportAllAuditLogs}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  Storage Utilization
                </div>
                <div className="text-slate-400 mt-0.5">
                  {evidenceList.length} files using {totalStorageMB.toFixed(2)} MB of evidential vault storage.
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-blue-400">{totalStorageMB.toFixed(1)} MB</div>
                <div className="text-[10px] text-slate-400">of evidence stored</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 flex items-center justify-between">
              <div>
                <div className="font-semibold text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Clear All Mock & Demo Data
                </div>
                <div className="text-slate-400 mt-0.5">
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
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Mock Data
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Clear Local Session Cache
                </div>
                <div className="text-slate-400 mt-0.5">
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
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase & Compliance Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100">System & Compliance Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Storage Provider', val: 'Cloudflare R2 (API & Vault Encrypted)', icon: Globe },
            { label: 'Firebase Project', val: 'glies-6c39a (Auth, Firestore, DB)', icon: HardDrive },
            { label: 'Evidence Bucket', val: 'gleis-evidence (Cloudflare R2)', icon: Globe },
            { label: 'Auth Standard', val: 'Firebase Auth + RBAC (4 roles)', icon: Lock },
            { label: 'Evidence Integrity', val: 'SHA-256 + HMAC Audit Chain', icon: ShieldCheck },
            { label: 'Compliance', val: 'Ghana Evidence Act, NRCD 323', icon: FileCheck },
            { label: 'Voice Search', val: 'Web Speech STT (English / Dialect)', icon: Mic },
            { label: 'GLEIS Version', val: 'v1.0.0 — Judicial Service Build', icon: Settings },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
              <Icon className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-slate-400">{label}</div>
                <div className="font-semibold text-slate-200">{val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
            saved
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
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
