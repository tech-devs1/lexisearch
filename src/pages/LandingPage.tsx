import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Headphones,
  Search,
  Sparkles,
  Lock,
  ArrowRight,
  Briefcase,
  Building2,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-gray-900 selection:text-white">
      {/* Top Judicial Banner */}
      <div className="bg-[#111] text-gray-300 px-4 py-2 text-[11px] font-mono border-b border-black">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-medium">REPUBLIC OF GHANA</span>
            <span className="text-gray-500">·</span>
            <span>JUDICIAL SERVICE OF GHANA</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Evidence Act, 1975 (NRCD 323) Compliant</span>
            <span className="hidden sm:inline">SHA-256 Immutable Audit Vault</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-gray-900 text-base">GLEIS</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-semibold">
                  National Legal Intelligence
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                Ghana Legal Evidence Intelligence System
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-gray-600">
            <a href="#capabilities" className="hover:text-gray-900 transition">
              Core Capabilities
            </a>
            <a href="#workspaces" className="hover:text-gray-900 transition">
              Sovereign Workspaces
            </a>
            <a href="#compliance" className="hover:text-gray-900 transition">
              Evidentiary Standards
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login?tab=signin')}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login?tab=signup')}
                  className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 lg:px-6 border-b border-gray-200 overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-800 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-700" />
            <span>Sovereign Legal Intelligence Infrastructure for Ghana</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-[1.15]">
            Verbatim Court Transcripts, Cryptographic Custody & Grounded Legal Intelligence
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            GLEIS unifies the Superior Courts of Ghana, the Directorate of Public Prosecutions, private defense chambers, and police investigators into a single sovereign platform with automated Ghanaian language speech recognition, exact timestamp navigation, and tamper-evident exhibit ledgers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/login?tab=signin')}
              className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold transition flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Access Official Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/login?tab=signup')}
              className="px-5 py-3 rounded-xl bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-sm font-semibold transition shadow-xs"
            >
              Register Firm or Court
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-12 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-mono text-gray-500">Evidence Standards</div>
              <div className="text-base font-bold text-gray-900 font-mono mt-1">NRCD 323</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Statutory Rules Compliant</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-mono text-gray-500">Multimodal AI</div>
              <div className="text-base font-bold text-gray-900 font-mono mt-1">Gemini 3.5</div>
              <div className="text-[11px] text-gray-400 mt-0.5">English & Dialectal STT</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-mono text-gray-500">Integrity Assurance</div>
              <div className="text-base font-bold text-emerald-600 font-mono mt-1">SHA-256 Sealed</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Immutable Custody Chain</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-mono text-gray-500">Tenant Architecture</div>
              <div className="text-base font-bold text-gray-900 font-mono mt-1">3 Workspaces</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Personal, Firm, Court</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="capabilities" className="py-16 px-4 lg:px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
            ENGINEERED FOR THE GHANAIAN BAR & BENCH
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Forensic Legal Intelligence & Verifiable Records
          </h2>
          <p className="text-xs lg:text-sm text-gray-500 max-w-2xl mx-auto">
            Everything legal practitioners, registrars, and investigators need to analyze recorded testimonies and exhibit ledgers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-gray-400 transition space-y-3 flex flex-col justify-between">
            <div>
              <span className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-semibold mb-3">
                <Headphones className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-gray-900">
                Synchronized Speech Transcription
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Verbatim speech-to-text with judicial speaker diarization and word-level timestamps. Supports Ghanaian English, Twi, Ga, Ewe, and Hausa.
              </p>
            </div>
            <div className="text-[11px] font-mono text-gray-400 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>Gemini 3.5 Multimodal</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-gray-400 transition space-y-3 flex flex-col justify-between">
            <div>
              <span className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-semibold mb-3">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-gray-900">
                Cryptographic Chain of Custody
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Every audio, video, or PDF file is sealed with an immutable SHA-256 hash at upload. Tamper-evident logging records every access and export.
              </p>
            </div>
            <div className="text-[11px] font-mono text-gray-400 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>NRCD 323 Verifiable</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-gray-400 transition space-y-3 flex flex-col justify-between">
            <div>
              <span className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-semibold mb-3">
                <Search className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-gray-900">
                Unified Exact Phrase Search
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Search simultaneously across courtroom audio testimonies, witness depositions, and OCR documentary exhibits with direct playback seek.
              </p>
            </div>
            <div className="text-[11px] font-mono text-gray-400 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>Sub-Second Lookup</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-gray-400 transition space-y-3 flex flex-col justify-between">
            <div>
              <span className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-semibold mb-3">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-gray-900">
                Grounded Evidentiary AI (RAG)
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ask complex cross-examination questions with strict citations to exact audio timestamps or document pages. Never fabricates evidence.
              </p>
            </div>
            <div className="text-[11px] font-mono text-gray-400 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>Grounded Citations</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" />
            </div>
          </div>
        </div>
      </section>

      {/* Three Sovereign Workspaces */}
      <section id="workspaces" className="py-16 px-4 lg:px-6 bg-gray-50 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
              MODULAR MULTI-TENANT ARCHITECTURE
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Three Sovereign Workspaces with Single Sign-On
            </h2>
            <p className="text-xs lg:text-sm text-gray-500 max-w-2xl mx-auto">
              Maintain separate boundaries between private legal research, law firm collaborative dockets, and official judicial court proceedings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Workspace */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-bold">
                  <Briefcase className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                  Private & Sovereign
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900">Personal Workspace</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Automated private workspace for every legal practitioner. Conduct private legal research, ingest personal audio notes, transcribe witness calls, and prepare trial strategies in total secrecy.
              </p>
              <ul className="text-xs space-y-2 text-gray-600 pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Exclusive private access to yourself</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Unrestricted personal transcription</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Private notes and bookmark vaults</span>
                </li>
              </ul>
            </div>

            {/* Organization Workspace */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-bold">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                  Law Firms & Bureaus
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900">Organization Workspace</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                For legal chambers, defense firms, and investigative agencies. Manage litigation teams, share case briefs, assign associates, and centralize firm evidence vaults with strict role delegation.
              </p>
              <ul className="text-xs space-y-2 text-gray-600 pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Team collaboration & invite controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Chamber-wide search and exhibit ledgers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Case assignment and associate delegation</span>
                </li>
              </ul>
            </div>

            {/* Court Workspace */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-900 text-white font-medium">
                  Judicial Registry
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900">Court Workspace</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Provisioned exclusively by GLEIS Super Admin for Superior and Lower Courts of Ghana. Managed by the authorized Court Registrar to control case participation without giving blanket evidence access.
              </p>
              <ul className="text-xs space-y-2 text-gray-600 pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Registrar-managed case participant access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Isolated prosecution and defense filings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                  <span>Sealed judicial evidence recordings</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Statutory Compliance Banner */}
      <section id="compliance" className="py-16 px-4 lg:px-6 max-w-5xl mx-auto space-y-8">
        <div className="p-8 rounded-2xl bg-white border border-gray-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Compliance with Ghana Evidence Act, 1975 (NRCD 323)
              </h3>
              <p className="text-xs text-gray-500">
                Admissibility standards for computer-generated records and electronic recordings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5">
              <div className="font-semibold text-gray-900 font-mono text-[11px]">
                AUTHENTICITY CERTIFICATION
              </div>
              <p>
                Section 135 & 160 compliance: SHA-256 cryptographic digests generated on ingestion verify that recorded exhibits have not been altered or doctored.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5">
              <div className="font-semibold text-gray-900 font-mono text-[11px]">
                BEST EVIDENCE RULE
              </div>
              <p>
                Section 165 compliance: Unaltered original recordings and primary OCR text are preserved with permanent immutable links to timestamp citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional CTA */}
      <section className="py-16 px-4 lg:px-6 bg-[#111] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Institutional Onboarding for Ghana's Superior Courts & Chambers
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Begin with a verified personal account, register your law firm chambers, or apply for an authorized institutional court registry workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/login?tab=signup')}
              className="px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition shadow-md"
            >
              Get Started Now
            </button>
            <button
              onClick={() => navigate('/login?tab=signin')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
            >
              Sign In to Session
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 lg:px-6 border-t border-gray-200 bg-white text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-gray-900" />
            <span className="font-semibold text-gray-900">GLEIS</span>
            <span>·</span>
            <span>Judicial Service of Ghana · Supreme Court Administration, Accra</span>
          </div>
          <div className="font-mono text-[11px]">
            © {new Date().getFullYear()} Judicial Service of Ghana. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
