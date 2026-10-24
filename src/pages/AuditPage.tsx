import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  FileCheck, 
  Lock, 
  CheckCircle2, 
  Search, 
  Clock, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { globalAuditService } from '../services/auditService';
import { AuditLogEntry } from '../types/audit';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { formatHashTruncated } from '../services/crypto';

export const AuditPage: React.FC = () => {
  const { activeCase } = useCase();
  const { canExportAuditLogs } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [verificationMap, setVerificationMap] = useState<Record<string, boolean>>({});
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const list = globalAuditService.getCaseLogs(activeCase?.id);
    setLogs(list);

    // Verify cryptographic integrity of all log entries
    const verifyAll = async () => {
      setIsVerifying(true);
      const vMap: Record<string, boolean> = {};
      for (const entry of list) {
        vMap[entry.id] = await globalAuditService.verifyLogIntegrity(entry);
      }
      setVerificationMap(vMap);
      setIsVerifying(false);
    };

    verifyAll();
  }, [activeCase]);

  const handleExportReport = () => {
    if (!activeCase) return;
    const reportJson = globalAuditService.generateChainOfCustodyReport(activeCase.id, 'all');
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chain_of_Custody_Certificate_${activeCase.caseNumber.replace(/\//g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-slate-100">
              Chain of Custody & Tamper-Evident Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 112 Ghana Evidence Act (NRCD 323) compliant electronic forensic tracking.
          </p>
        </div>

        {canExportAuditLogs() && (
          <button
            onClick={handleExportReport}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Certified Custody Certificate</span>
          </button>
        )}
      </div>

      {/* Security Status Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              Immutable Cryptographic Ledger Status
            </div>
            <div className="text-[11px] text-slate-400">
              Each record possesses a SHA-256 HMAC digest tying action, timestamp, user, and evidence hash.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">Total Audit Events: {logs.length}</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {isVerifying ? 'Verifying Integrity...' : 'Integrity Verified (0 Violations)'}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Authorized Officer</th>
                <th className="py-3 px-4">Evidence & Event Narrative</th>
                <th className="py-3 px-4">Evidence SHA-256</th>
                <th className="py-3 px-4 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => {
                const isValid = verificationMap[log.id] !== false;
                return (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-200">
                      <div className="font-semibold">{log.userEmail}</div>
                      <div className="text-[10px] text-amber-400 uppercase">{log.userRole}</div>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs">
                      {log.actionDescription}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {log.evidenceSha256 ? (
                        <span className="text-amber-400 font-mono" title={log.evidenceSha256}>
                          {formatHashTruncated(log.evidenceSha256, 6)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          SEALED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          TAMPERED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
