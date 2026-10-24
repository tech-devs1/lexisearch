import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Search, 
  Headphones, 
  FileText, 
  Sparkles, 
  Bookmark, 
  ShieldCheck, 
  Users,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCase } from '../../context/CaseContext';

export const Sidebar: React.FC = () => {
  const { canManageUsers } = useAuth();
  const { activeCase, bookmarks } = useCase();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cases', label: 'Case Management', icon: Briefcase, count: activeCase?.evidence?.length },
    { to: '/search', label: 'Unified Search', icon: Search },
    { to: '/audio', label: 'Audio & Transcripts', icon: Headphones },
    { to: '/document', label: 'Document & OCR', icon: FileText },
    { to: '/ai-assistant', label: 'AI Evidence Q&A', icon: Sparkles, badge: 'RAG' },
    { to: '/bookmarks', label: 'Bookmarks & Notes', icon: Bookmark, count: bookmarks.length },
    { to: '/audit', label: 'Audit & Integrity', icon: ShieldCheck, badge: 'SHA-256' },
  ];

  if (canManageUsers()) {
    navItems.push({ to: '/users', label: 'User Roles (RBAC)', icon: Users });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="py-4 px-3 space-y-6">
        {/* Active Case Cardlet in Sidebar */}
        {activeCase && (
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
              Current Active Case
            </div>
            <div className="text-xs font-bold text-slate-100 mt-1 truncate">
              {activeCase.caseNumber}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {activeCase.title}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-slate-400" />
                {activeCase.evidence?.length || 0} Evidence Files
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium">
                {activeCase.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-medium">
          <span>Security Status</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Enforced
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          NRCD 323 / Act 1044 Compliant
        </div>
      </div>
    </aside>
  );
};
