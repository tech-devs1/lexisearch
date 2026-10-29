import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../types/auth';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 shadow-xs">
          <ShieldAlert className="w-7 h-7 text-gray-800" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
            Access Restricted · Section 112 NRCD 323
          </span>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight mt-2">
            Unauthorized Judicial Route
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            Your authenticated role as <span className="font-semibold text-gray-900">{currentUser ? ROLE_LABELS[currentUser.role] : 'Guest'}</span> does not grant clearance to access this administrative or protected dossier feature.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-gray-800 font-semibold font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-gray-600" />
            <span>Evidentiary RBAC Policy</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-normal">
            Only designated Super Administrators and Court Registrars can modify user permissions or access restricted judicial settings. All unauthorized access requests are cryptographically recorded in the system audit trail.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
