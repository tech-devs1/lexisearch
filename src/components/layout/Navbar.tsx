import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCase } from '../../context/CaseContext';
import { UserRole, ROLE_LABELS } from '../../types/auth';
import { 
  Scale, 
  Shield, 
  FolderLock, 
  ChevronDown, 
  Search, 
  LogOut, 
  CheckCircle2,
  Mic,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const { cases, activeCase, selectCase } = useCase();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();

  const roleLabels: Record<UserRole, { label: string; dot: string }> = {
    super_admin: { label: ROLE_LABELS.super_admin, dot: 'bg-gray-900' },
    prosecutor: { label: ROLE_LABELS.prosecutor, dot: 'bg-gray-800' },
    lawyer: { label: ROLE_LABELS.lawyer, dot: 'bg-gray-700' },
    investigator: { label: ROLE_LABELS.investigator, dot: 'bg-gray-600' },
    viewer: { label: ROLE_LABELS.viewer, dot: 'bg-gray-400' },
    org_admin: { label: ROLE_LABELS.org_admin, dot: 'bg-gray-500' },
    reviewer: { label: ROLE_LABELS.reviewer, dot: 'bg-gray-400' },
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Crest */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-gray-900 text-sm">GLEIS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
              Judicial Service of Ghana
            </span>
          </div>
        </div>
      </div>

      {/* Center: Case Selector & Quick Search */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-6">
        {/* Case Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCaseDropdown(!showCaseDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-xs text-gray-700 transition"
          >
            <FolderLock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-mono truncate max-w-[150px]">
              {activeCase ? activeCase.caseNumber : 'Select Case'}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showCaseDropdown && (
            <div className="absolute left-0 mt-1.5 w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 z-50">
              <div className="text-[10px] font-mono font-medium text-gray-400 px-2 py-1 uppercase tracking-wider">
                Select Active Dossier
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {cases.length === 0 ? (
                  <div className="p-3 text-xs text-gray-400 text-center">
                    No cases on file. Create one in Cases page.
                  </div>
                ) : (
                  cases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        selectCase(c.id);
                        setShowCaseDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition text-xs flex items-start justify-between ${
                        activeCase?.id === c.id ? 'bg-gray-100 text-gray-900 border border-gray-200' : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-medium text-gray-900">{c.caseNumber}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[210px]">{c.title}</div>
                      </div>
                      {activeCase?.id === c.id && <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 mt-1" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Search Input */}
        <form onSubmit={handleQuickSearch} className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Search transcripts, exhibits, amounts, tags..."
            className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:bg-white transition font-sans"
          />
          <button
            type="button"
            onClick={() => {
              const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.lang = 'en-GH';
                rec.onresult = (evt: any) => {
                  const val = evt.results[0][0].transcript;
                  setQuickQuery(val);
                  navigate(`/search?q=${encodeURIComponent(val)}`);
                };
                rec.start();
              } else {
                navigate('/search');
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-900 transition"
            title="Voice Search"
          >
            <Mic className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Right Controls: Role & User */}
      <div className="flex items-center gap-2">
        {/* Role Pill Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-xs text-gray-600 transition"
            title="Switch RBAC role"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${roleLabels[role]?.dot || 'bg-gray-400'}`} />
            <span className="hidden sm:inline font-medium">{roleLabels[role]?.label || role}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 z-50">
              <div className="text-[10px] font-mono font-medium text-gray-400 px-2 py-1 uppercase tracking-wider">
                Simulate Role (RBAC)
              </div>
              {([
                'super_admin',
                'prosecutor',
                'lawyer',
                'investigator',
                'viewer',
                'org_admin',
              ] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                    role === r ? 'bg-gray-100 text-gray-900 font-medium' : 'hover:bg-gray-50 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${roleLabels[r]?.dot || 'bg-gray-400'}`} />
                    <span>{roleLabels[r]?.label || r}</span>
                  </div>
                  {role === r && <CheckCircle2 className="w-3 h-3 text-gray-900" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User initials & logout */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-mono font-medium">
            {currentUser?.displayName.charAt(0) || 'U'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
