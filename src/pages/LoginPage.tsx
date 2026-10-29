import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, Shield, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { MOCK_USERS } from '../data/mockEvidence';

export const LoginPage: React.FC = () => {
  const { login, sendPasswordReset, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Authentication failed. Use a valid official court email or try a one-click demo login below.');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    const user = MOCK_USERS.find((u) => u.role === role);
    if (user) {
      const res = await login(user.email, undefined, role);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Login failed for this role.');
      }
    }
  };

  const handlePasswordRecovery = async () => {
    if (!recoveryEmail.trim()) return;
    setIsRecovering(true);
    try {
      await sendPasswordReset(recoveryEmail.trim());
      setRecoverySent(true);
    } catch {
      setRecoverySent(true);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-lg space-y-6">
        {/* Emblem & Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-sm">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-wide">
              GHANA LEGAL EVIDENCE INTELLIGENCE SYSTEM
            </h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
              GLEIS · Judicial Service of Ghana
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Official Court Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@judicial.gov.gh"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-700 font-medium">Access Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowRecovery(true);
                  setRecoveryEmail(email);
                }}
                className="text-[11px] text-gray-500 hover:text-gray-900 transition"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Leave password blank to use demo mode (mock session).
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full py-3 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-medium rounded-lg text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            {isAuthLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Authenticate Secure Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Role Selectors for Evaluation */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 text-center">
            One-Click Role Demonstration Login
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('super_admin')}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
            >
              <div className="font-medium text-[11px] text-gray-900">Super Admin</div>
              <div className="text-[9px] text-gray-500 truncate">Justice S. Adinyira</div>
            </button>
            <button
              onClick={() => handleQuickLogin('prosecutor')}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
            >
              <div className="font-medium text-[11px] text-gray-900">Prosecutor</div>
              <div className="text-[9px] text-gray-500 truncate">Hon. A. Tuah-Yeboah</div>
            </button>
            <button
              onClick={() => handleQuickLogin('lawyer')}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
            >
              <div className="font-medium text-[11px] text-gray-900">Defense Counsel</div>
              <div className="text-[9px] text-gray-500 truncate">Mrs. A. Osei-Mensah</div>
            </button>
            <button
              onClick={() => handleQuickLogin('investigator')}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
            >
              <div className="font-medium text-[11px] text-gray-900">Investigator</div>
              <div className="text-[9px] text-gray-500 truncate">D/C/Insp. Eric Addo</div>
            </button>
            <button
              onClick={() => handleQuickLogin('viewer')}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
            >
              <div className="font-medium text-[11px] text-gray-900">Viewer / Researcher</div>
              <div className="text-[9px] text-gray-500 truncate">Kofi Mensah</div>
            </button>
            <button
              onClick={() => handleQuickLogin('org_admin')}
              className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
            >
              <div className="font-medium text-[11px] text-gray-900">Court Registrar</div>
              <div className="text-[9px] text-gray-500 truncate">Benjamin Kwakye</div>
            </button>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showRecovery && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-gray-900">Judicial Account Recovery</h3>
            <p className="text-gray-500">
              Enter your official government email to receive password reset credentials from the Judicial Service IT Bureau.
            </p>
            <input
              type="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="officer@judicial.gov.gh"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
            {recoverySent && (
              <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recovery link dispatched to your official email.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoverySent(false);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              {!recoverySent && (
                <button
                  onClick={handlePasswordRecovery}
                  disabled={isRecovering || !recoveryEmail.trim()}
                  className="px-3 py-1.5 bg-gray-900 text-white font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isRecovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Send Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
