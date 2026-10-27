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
  User, 
  LogOut, 
  FileCheck,
  CheckCircle2,
  Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const { cases, activeCase, selectCase } = useCase();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-900/60 text-purple-300 border-purple-600' },
    org_admin: { label: 'Org Admin', color: 'bg-blue-900/60 text-blue-300 border-blue-600' },
    lawyer: { label: 'Lead Counsel / Lawyer', color: 'bg-amber-900/60 text-amber-300 border-amber-600' },
    reviewer: { label: 'Reviewer / Investigator', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-600' },
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-slate-900/95 border-b border-slate-800 backdrop-blur sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Brand & Crest */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-slate-100 text-base lg:text-lg">GLEIS</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ghana Judicial Service
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">Legal Evidence Intelligence System</p>
        </div>
      </div>

      {/* Center: Active Case Selector & Quick Search */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl mx-6">
        {/* Case Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCaseDropdown(!showCaseDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition"
          >
            <FolderLock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium truncate max-w-[170px]">
              {activeCase ? activeCase.caseNumber : 'Select Case'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showCaseDropdown && (
            <div className="absolute left-0 mt-2 w-80 bg-slate-850 rounded-xl border border-slate-700 shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Select Active Legal Matter
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      selectCase(c.id);
                      setShowCaseDropdown(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition text-xs flex items-start justify-between ${
                      activeCase?.id === c.id ? 'bg-amber-500/15 border border-amber-500/40' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{c.caseNumber}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[210px]">{c.title}</div>
                    </div>
                    {activeCase?.id === c.id && <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <form onSubmit={handleQuickSearch} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Search audio transcripts, exhibits, witnesses, amounts..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 transition"
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
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition"
            title="Voice Search"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Right: Role Simulator & User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Badge with Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleLabels[role]?.color || ''} transition hover:brightness-110`}
            title="Click to switch role to test permissions"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{roleLabels[role]?.label || role}</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-850 rounded-xl border border-slate-700 shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                Simulate Role Permissions (RBAC)
              </div>
              {(['super_admin', 'org_admin', 'lawyer', 'reviewer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                    role === r ? 'bg-slate-700/80 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r === 'super_admin' ? 'bg-purple-400' : r === 'org_admin' ? 'bg-blue-400' : r === 'lawyer' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span>{roleLabels[r].label}</span>
                  </div>
                  {role === r && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
            {currentUser?.displayName.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-slate-200 truncate max-w-[160px]">
              {currentUser?.displayName}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
              {currentUser?.division || currentUser?.organizationName}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
