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
  Settings,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCase } from '../../context/CaseContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  tag?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { canManageUsers, canManageSettings } = useAuth();
  const { activeCase, bookmarks } = useCase();

  const sections: NavSection[] = [
    {
      title: 'CASE WORKFLOW',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/cases', label: 'Cases & Dossiers', icon: Briefcase, count: activeCase?.evidence?.length },
        { to: '/audio', label: 'Audio & Transcripts', icon: Headphones },
        { to: '/document', label: 'Documents & OCR', icon: FileText },
      ],
    },
    {
      title: 'INTELLIGENCE & SEARCH',
      items: [
        { to: '/search', label: 'Unified Search', icon: Search },
        { to: '/ai-assistant', label: 'Evidentiary AI', icon: Sparkles, tag: 'AI' },
        { to: '/bookmarks', label: 'Bookmarks & Notes', icon: Bookmark, count: bookmarks.length },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { to: '/audit', label: 'Audit Trail', icon: ShieldCheck },
        ...(canManageUsers()
          ? [{ to: '/users', label: 'User Roles', icon: Users }]
          : []),
        ...(canManageSettings()
          ? [{ to: '/settings', label: 'Settings', icon: Settings }]
          : []),
      ],
    },
  ];

  return (
    <aside className="w-60 bg-[#111] flex flex-col justify-between shrink-0 hidden md:flex select-none">
      <div className="py-4 px-3 space-y-5 overflow-y-auto">
        {/* Active Matter Micro-Card */}
        {activeCase ? (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-500">
              <span className="flex items-center gap-1 text-white/70 font-medium">
                <FolderOpen className="w-3 h-3" />
                Active Dossier
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-white/10 text-gray-400 rounded border border-white/10">
                {activeCase.status?.replace('_', ' ') || 'ACTIVE'}
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-white mt-1.5 truncate">
              {activeCase.caseNumber}
            </div>
            <div className="text-[11px] text-gray-500 truncate mt-0.5">
              {activeCase.title}
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>{activeCase.evidence?.length || 0} evidence files</span>
              <span className="text-emerald-500">Verified</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-500 text-center">
            No dossier active
          </div>
        )}

        {/* Grouped Navigation Links */}
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="px-2.5 pb-1.5 text-[10px] font-medium tracking-wider text-gray-500 uppercase font-mono">
                {section.title}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition group border-l-2 ${
                      isActive
                        ? 'border-white bg-white/10 text-white'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 shrink-0 transition" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.tag && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-500 border border-white/10">
                        {item.tag}
                      </span>
                    )}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                        {item.count}
                      </span>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Footer Compliance Badge */}
      <div className="p-3 border-t border-white/10 text-[11px] text-gray-500">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px]">EVIDENCE STATUS</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            NRCD 323 ENFORCED
          </span>
        </div>
        <div className="text-[10px] text-gray-600 font-mono mt-0.5">
          SHA-256 Custody Sealed
        </div>
      </div>
    </aside>
  );
};
