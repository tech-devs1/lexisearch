import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Scale, 
  Lock, 
  Mail, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  User, 
  Building2, 
  Landmark, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { MOCK_USERS } from '../data/mockEvidence';

type AuthTab = 'signin' | 'register';
type OnboardingType = 'individual' | 'organization' | 'court';

export const LoginPage: React.FC = () => {
  const { currentUser, logout, login, loginWithGoogle, register, sendPasswordReset, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab State
  const tabParam = searchParams.get('mode') || searchParams.get('tab');
  const initialTab: AuthTab = tabParam === 'register' || tabParam === 'signup' ? 'register' : 'signin';
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  // Registration State
  const [regType, setRegType] = useState<OnboardingType>('individual');
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [courtDivision, setCourtDivision] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setAuthError(res.error || 'Authentication failed. Please verify credentials or try demo access.');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    const res = await loginWithGoogle();
    if (res.success) {
      navigate('/dashboard');
    } else {
      setAuthError(res.error || 'Google authentication failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (regPassword && regPassword !== confirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }

    if (regPassword && regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    let defaultRole: UserRole = 'viewer';
    if (regType === 'individual') {
      defaultRole = barNumber.trim().length >= 3 ? 'lawyer' : 'viewer';
    } else if (regType === 'organization') {
      defaultRole = 'lawyer';
    } else if (regType === 'court') {
      // Security Protocol: Court Registrar authority requires verification by Super Admin
      defaultRole = 'viewer';
    }

    const res = await register({
      email: regEmail,
      password: regPassword,
      displayName: fullName,
      accountType: regType,
      organizationName: regType === 'court' ? (orgName || 'Judicial Service of Ghana') : orgName,
      barNumber: barNumber.trim() || undefined,
      division: courtDivision.trim() || undefined,
      role: defaultRole,
    });

    if (res.success) {
      if (regType === 'court') {
        setAuthSuccess(
          'Court Registry registration created. Account provisioned in review mode. Full registrar administration is pending verification by Super Admin.'
        );
      } else {
        setAuthSuccess('Account registered successfully. Redirecting to your legal workspace...');
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 1400);
    } else {
      setAuthError(res.error || 'Failed to create officer account.');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    const user = MOCK_USERS.find((u) => u.role === role);
    if (user) {
      const res = await login(user.email, role === 'super_admin' ? 'udiosuper' : undefined, role);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setAuthError(res.error || 'Login failed for this role.');
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

  // Enforce Single-Session Custody: If already authenticated, block cross-account access
  if (currentUser && currentUser.isActive !== false) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-xs mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-base font-semibold text-gray-900 tracking-wide">
              ACTIVE SESSION IN PROGRESS
            </h1>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">
              GLEIS · Identity & Custody Gate
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
              Currently Authenticated Officer
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 text-white font-semibold flex items-center justify-center text-sm font-mono shrink-0">
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 text-sm truncate">
                  {currentUser.displayName}
                </div>
                <div className="text-xs text-gray-500 truncate">{currentUser.email}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200">
              <span className="px-2 py-0.5 rounded bg-gray-900 text-white text-[10px] font-mono uppercase tracking-wider">
                {currentUser.role.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono uppercase tracking-wider">
                Active Session
              </span>
              {currentUser.barNumber && (
                <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-800 text-[10px] font-mono">
                  {currentUser.barNumber}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              To prevent unauthorized cross-account access and maintain evidentiary custody integrity, GLEIS restricts logging into another account while a session is active. To access a different account, sign out first.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to My Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
              }}
              className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-gray-200 hover:border-red-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign Out of Current Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Emblem & Top Bar */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-xs group-hover:bg-black transition">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="text-base font-semibold text-gray-900 tracking-wide mt-3">
              GHANA LEGAL EVIDENCE INTELLIGENCE SYSTEM
            </h1>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">
              GLEIS · Judicial Service of Ghana
            </p>
          </Link>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg text-xs font-medium border border-gray-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setAuthError('');
              setAuthSuccess('');
            }}
            className={`py-2 rounded-md transition text-center ${
              activeTab === 'signin'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In to Session
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setAuthError('');
              setAuthSuccess('');
            }}
            className={`py-2 rounded-md transition text-center ${
              activeTab === 'register'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Officer Account
          </button>
        </div>

        {/* Global Feedback */}
        {authError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* SIGN IN TAB */}
        {/* ============================================================ */}
        {activeTab === 'signin' && (
          <div className="space-y-4 text-xs">
            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 text-gray-800 font-medium text-xs transition flex items-center justify-center gap-3 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                <span className="bg-white px-3 text-gray-400">or sign in with official email</span>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Official Court or Firm Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="counsel@chambers.gh or officer@judicial.gov.gh"
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
                    className="text-[11px] text-gray-500 hover:text-gray-900 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Enter your registered password or authenticate via Google SSO above.
                </p>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-medium rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating Session...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate Secure Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* CREATE ACCOUNT / ONBOARDING TAB */}
        {/* ============================================================ */}
        {activeTab === 'register' && (
          <div className="space-y-4 text-xs">
            {/* Quick Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 text-gray-800 font-medium text-xs transition flex items-center justify-center gap-3 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign Up with Google SSO</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                <span className="bg-white px-3 text-gray-400">or register with official credentials</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Account Type Selector */}
            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Select Account Archetype</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRegType('individual')}
                  className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1 transition ${
                    regType === 'individual'
                      ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium ring-1 ring-gray-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Individual</span>
                  <span className="text-[9px] text-gray-400 leading-tight">Private research</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegType('organization')}
                  className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1 transition ${
                    regType === 'organization'
                      ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium ring-1 ring-gray-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Law Firm</span>
                  <span className="text-[9px] text-gray-400 leading-tight">Chambers & teams</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegType('court')}
                  className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1 transition ${
                    regType === 'court'
                      ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium ring-1 ring-gray-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Court Registry</span>
                  <span className="text-[9px] text-gray-400 leading-tight">Judicial onboarding</span>
                </button>
              </div>
            </div>

            {/* Full Legal Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                {regType === 'court' ? 'Presiding Registrar / Principal Officer' : 'Full Legal Name'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={regType === 'court' ? 'Chief Registrar Kwakye' : 'Mrs. Akosua Mensah, Esq.'}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* Official Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder={regType === 'court' ? 'registrar.registry@judicial.gov.gh' : 'counsel@ghanalawfirm.com'}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* Organization / Firm / Court Name */}
            {regType !== 'individual' && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  {regType === 'court' ? 'Court Jurisdiction & Bench' : 'Chambers / Law Firm Name'}
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={regType === 'court' ? 'High Court of Ghana, Commercial Division 2' : 'Bentsi-Enchill & Letsa Chambers'}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
            )}

            {/* Professional Credentials / Bar Number */}
            {regType === 'individual' && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">Ghana Bar Association License / ID (Optional)</label>
                <input
                  type="text"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="GBA/AC/2021/0491"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <span className="text-[10px] text-gray-400">Enables Defense Counsel case features upon verification.</span>
              </div>
            )}

            {regType === 'court' && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">Registry Division / Docket Code</label>
                <input
                  type="text"
                  value={courtDivision}
                  onChange={(e) => setCourtDivision(e.target.value)}
                  placeholder="ACC/COMM/REG-01"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Commitment */}
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-gray-900">
                <Shield className="w-3.5 h-3.5 text-gray-800" />
                <span>Section 7 Evidence Act 1975 (NRCD 323) Compliance</span>
              </div>
              <p className="text-[10px] text-gray-500">
                New accounts are provisioned with role-based access control and sovereign workspace isolation. Digital exhibits are cryptographically hashed upon upload.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-2.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-medium rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Verify Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

        {/* Collapsible One-Click Demo Role Login (Evaluation Aid) */}
        <div className="pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowDemoLogins(!showDemoLogins)}
            className="w-full py-1.5 flex items-center justify-between text-gray-500 hover:text-gray-900 text-xs transition"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Evaluator Demo Credentials & Instant Logins
            </span>
            {showDemoLogins ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDemoLogins && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-2">
              <p className="text-[11px] text-gray-500">
                Select any authorized legal persona to test role-based access control and case permission segregation:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('super_admin')}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
                >
                  <div className="font-medium text-[11px] text-gray-900">Super Admin</div>
                  <div className="text-[9px] text-gray-500 truncate">supertech@admin.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('prosecutor')}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
                >
                  <div className="font-medium text-[11px] text-gray-900">Prosecutor</div>
                  <div className="text-[9px] text-gray-500 truncate">Hon. A. Tuah-Yeboah</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('lawyer')}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
                >
                  <div className="font-medium text-[11px] text-gray-900">Defense Counsel</div>
                  <div className="text-[9px] text-gray-500 truncate">Mrs. A. Osei-Mensah</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('investigator')}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
                >
                  <div className="font-medium text-[11px] text-gray-900">Investigator</div>
                  <div className="text-[9px] text-gray-500 truncate">D/C/Insp. Eric Addo</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('viewer')}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
                >
                  <div className="font-medium text-[11px] text-gray-900">Legal Researcher</div>
                  <div className="text-[9px] text-gray-500 truncate">Kofi Mensah</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('org_admin')}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-left transition"
                >
                  <div className="font-medium text-[11px] text-gray-900">Court Registrar</div>
                  <div className="text-[9px] text-gray-500 truncate">Benjamin Kwakye</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Public Landing */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-[11px] text-gray-400 hover:text-gray-900 transition underline underline-offset-4"
          >
            ← Return to GLEIS Public Overview & Legal Framework
          </Link>
        </div>

      </div>

      {/* Password Recovery Modal */}
      {showRecovery && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-gray-900">Judicial Account Recovery</h3>
            <p className="text-gray-500">
              Enter your official government or firm email to receive password reset credentials from the Judicial Service IT Bureau.
            </p>
            <input
              type="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="officer@judicial.gov.gh"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
            {recoverySent && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recovery instructions dispatched to your official email.</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
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
                  type="button"
                  onClick={handlePasswordRecovery}
                  disabled={isRecovering || !recoveryEmail.trim()}
                  className="px-3 py-1.5 bg-gray-900 text-white font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isRecovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Send Recovery Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
