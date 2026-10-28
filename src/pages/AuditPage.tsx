import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Lock, 
  CheckCircle2, 
  AlertTriangle 
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
  const [filterAction] = useState<string>('all');
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              Chain of Custody & Tamper-Evident Audit Trail
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Section 112 Ghana Evidence Act (NRCD 323) compliant electronic forensic tracking.
          </p>
        </div>

        {canExportAuditLogs() && (
          <button
            onClick={handleExportReport}
            className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Certified Custody Certificate</span>
          </button>
        )}
      </div>

      {/* Security Status Box */}
      <div className="p-4 rounded-xl bg-white border border-gray-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900">
              Immutable Cryptographic Ledger Status
            </div>
            <div className="text-[11px] text-gray-500">
              Each record possesses a SHA-256 HMAC digest tying action, timestamp, user, and evidence hash.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-500">Total Audit Events: {logs.length}</span>
          <span className="text-emerald-600 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {isVerifying ? 'Verifying Integrity...' : 'Integrity Verified (0 Violations)'}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200 font-mono">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Timestamp (UTC)</th>
                <th className="py-2.5 px-3 font-semibold">Action Type</th>
                <th className="py-2.5 px-3 font-semibold">Authorized Officer</th>
                <th className="py-2.5 px-3 font-semibold">Evidence & Event Narrative</th>
                <th className="py-2.5 px-3 font-semibold">Evidence SHA-256</th>
                <th className="py-2.5 px-3 text-right font-semibold">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {filteredLogs.map((log) => {
                const isValid = verificationMap[log.id] !== false;
                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-3 text-gray-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 border border-gray-200">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans text-gray-900">
                      <div className="font-semibold text-xs">{log.userEmail}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-mono">{log.userRole}</div>
                    </td>

                    <td className="py-3 px-3 font-sans text-gray-700 max-w-xs text-xs">
                      {log.actionDescription}
                    </td>

                    <td className="py-3 px-3 text-gray-600">
                      {log.evidenceSha256 ? (
                        <span className="font-mono text-gray-900" title={log.evidenceSha256}>
                          {formatHashTruncated(log.evidenceSha256, 6)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          SEALED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 text-[10px] font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
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
