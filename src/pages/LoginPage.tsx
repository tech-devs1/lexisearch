import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { MOCK_USERS } from '../data/mockEvidence';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid judicial credentials. Try using one of the quick test accounts below.');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
      await login(user.email, role);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Emblem & Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20">
            <Scale className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100 tracking-wider">
              GHANA LEGAL EVIDENCE INTELLIGENCE SYSTEM
            </h1>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mt-1">
              GLEIS • Judicial Service of Ghana
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Official Court Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@judicial.gov.gh"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">Access Password</label>
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
          >
            <span>Authenticate Secure Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Selectors for Evaluation */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            One-Click Role Demonstration Login
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('super_admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-purple-300 font-medium text-left transition"
            >
              <div className="font-bold text-[11px]">Super Admin</div>
              <div className="text-[9px] text-slate-400 truncate">Justice Sophia Adinyira</div>
            </button>
            <button
              onClick={() => handleQuickLogin('lawyer')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-medium text-left transition"
            >
              <div className="font-bold text-[11px]">Lead Counsel / Lawyer</div>
              <div className="text-[9px] text-slate-400 truncate">Abena Osei-Mensah</div>
            </button>
            <button
              onClick={() => handleQuickLogin('org_admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-blue-300 font-medium text-left transition"
            >
              <div className="font-bold text-[11px]">Court Registrar</div>
              <div className="text-[9px] text-slate-400 truncate">Benjamin Kwakye</div>
            </button>
            <button
              onClick={() => handleQuickLogin('reviewer')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-300 font-medium text-left transition"
            >
              <div className="font-bold text-[11px]">CID Investigator</div>
              <div className="text-[9px] text-slate-400 truncate">D/C/Insp Eric Addo</div>
            </button>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showRecovery && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100">Judicial Account Recovery</h3>
            <p className="text-slate-400">
              Enter your official government email to receive password reset credentials.
            </p>
            <input
              type="email"
              placeholder="officer@judicial.gov.gh"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none"
            />
            {recoverySent && (
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded text-center">
                Recovery instructions dispatched.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoverySent(false);
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
              >
                Close
              </button>
              <button
                onClick={() => setRecoverySent(true)}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded"
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
