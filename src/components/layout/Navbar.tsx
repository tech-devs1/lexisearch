import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCase } from '../../context/CaseContext';
import { UserRole } from '../../types/auth';
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
    super_admin: { label: 'Super Admin', dot: 'bg-purple-400' },
    org_admin: { label: 'Court Registrar', dot: 'bg-blue-400' },
    lawyer: { label: 'Counsel / Lawyer', dot: 'bg-indigo-400' },
    reviewer: { label: 'Investigator', dot: 'bg-emerald-400' },
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 bg-[#090D16] border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Crest */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-700/80 flex items-center justify-center text-blue-400 shadow-sm">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-slate-100 text-sm">GLEIS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
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
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition"
          >
            <FolderLock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-mono truncate max-w-[150px]">
              {activeCase ? activeCase.caseNumber : 'Select Case'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCaseDropdown && (
            <div className="absolute left-0 mt-1.5 w-80 bg-slate-900 rounded-lg border border-slate-800 shadow-xl p-1.5 z-50">
              <div className="text-[10px] font-mono font-medium text-slate-400 px-2 py-1 uppercase tracking-wider">
                Select Active Dossier
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {cases.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">
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
                      className={`w-full text-left p-2 rounded-md transition text-xs flex items-start justify-between ${
                        activeCase?.id === c.id ? 'bg-blue-950/40 text-blue-300 border border-blue-900/60' : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-medium text-slate-200">{c.caseNumber}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[210px]">{c.title}</div>
                      </div>
                      {activeCase?.id === c.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-1" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Search Input */}
        <form onSubmit={handleQuickSearch} className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Search courtroom transcripts, exhibits, amounts, tags..."
            className="w-full pl-8 pr-8 py-1.5 bg-slate-900/80 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-sans"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-400 transition"
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
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
            title="Switch RBAC role"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${roleLabels[role]?.dot || 'bg-blue-400'}`} />
            <span className="hidden sm:inline font-medium">{roleLabels[role]?.label || role}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 rounded-lg border border-slate-800 shadow-xl p-1.5 z-50">
              <div className="text-[10px] font-mono font-medium text-slate-400 px-2 py-1 uppercase tracking-wider">
                Simulate Role (RBAC)
              </div>
              {(['super_admin', 'org_admin', 'lawyer', 'reviewer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition ${
                    role === r ? 'bg-slate-800 text-slate-100 font-medium' : 'hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${roleLabels[r].dot}`} />
                    <span>{roleLabels[r].label}</span>
                  </div>
                  {role === r && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User initials & logout */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 text-xs font-mono font-medium">
            {currentUser?.displayName.charAt(0) || 'U'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
