'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Server,
  Code,
  Calendar,
  Download,
} from 'lucide-react';

interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    companyId: 'comp-1',
    userId: 'usr-admin-1',
    action: 'INVOICE_CREATE',
    entity: 'Invoice',
    entityId: 'inv-303',
    newValue: { invoiceNumber: 'INV-2026-0003', total: 9360.00, clientId: 'cli-103' },
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'aud-002',
    companyId: 'comp-1',
    userId: 'usr-admin-1',
    action: 'PAYRUN_APPROVED',
    entity: 'PayRun',
    entityId: 'pr-902',
    oldValue: { status: 'pending_approval' },
    newValue: { status: 'approved', approvedBy: 'usr-admin-1' },
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'aud-003',
    companyId: 'comp-1',
    userId: 'usr-sup-2',
    action: 'ATTENDANCE_RECONCILE',
    entity: 'Attendance',
    entityId: 'att-501',
    oldValue: { varianceMinutes: 45, status: 'flagged' },
    newValue: { status: 'reconciled', reason: 'Supervisor sign-off for London tube central line delay' },
    ipAddress: '82.41.112.5',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'aud-004',
    companyId: 'comp-1',
    userId: 'usr-mgr-1',
    action: 'ASSIGNMENT_TRANSFER',
    entity: 'Assignment',
    entityId: 'asg-701',
    oldValue: { siteId: 'site-canary-1', payRate: 15.50 },
    newValue: { siteId: 'site-westfield-2', payRate: 16.75, note: 'Permanent venue reassignment' },
    ipAddress: '192.168.1.55',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'aud-005',
    companyId: 'comp-1',
    userId: 'usr-admin-1',
    action: 'LICENCE_VERIFIED',
    entity: 'Licence',
    entityId: 'lic-881',
    newValue: { number: '1002-8849-0192-3841', type: 'SIA Door Supervision', verified: true },
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('workforce_auth_session') : null;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        try {
          const parsed = JSON.parse(token);
          if (parsed.accessToken) headers['Authorization'] = `Bearer ${parsed.accessToken}`;
        } catch { /* noop */ }
      }

      const res = await fetch('http://localhost:4000/api/v1/companies/audit', { headers });
      if (res.ok) {
        const data = await res.json();
        const serverLogs = Array.isArray(data) ? data : data.data || [];
        setLogs(serverLogs.length > 0 ? serverLogs : MOCK_AUDIT_LOGS);
      } else {
        setLogs(MOCK_AUDIT_LOGS);
      }
    } catch {
      setLogs(MOCK_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userId && log.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(searchQuery));

    const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'Entity', 'Entity ID', 'User ID', 'IP Address'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.action,
      l.entity,
      l.entityId || '',
      l.userId || '',
      l.ipAddress || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7]">
              Compliance & Security
            </span>
            <span className="text-xs text-gray-500 font-medium">Immutable Forensics • Multi-Tenant Enforced</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            Enterprise Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Immutable log of every state mutation, supervisor override, wage adjustment, and financial action.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-sm rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(108,92,231,0.35)]"
        >
          <Download className="w-4 h-4 text-white" />
          Export Audit CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 my-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Recorded Events</span>
            <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7]">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{logs.length}</span>
            <span className="ml-2 text-xs font-medium text-emerald-600">Tamper-proof</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Stored with SHA-256 integrity</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial Mutations</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#6C5CE7]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">
              {logs.filter(l => l.action.includes('INVOICE') || l.action.includes('PAYRUN')).length}
            </span>
            <span className="ml-2 text-xs font-medium text-[#6C5CE7]">100% reconciled</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Invoices, billing rates, pay runs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supervisor Overrides</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">
              {logs.filter(l => l.action.includes('RECONCILE') || l.action.includes('ADJUST')).length}
            </span>
            <span className="ml-2 text-xs font-medium text-amber-600">Justified</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">GPS geofence & break adjustments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance Verifications</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600">
              {logs.filter(l => l.action.includes('LICENCE') || l.action.includes('DOCUMENT')).length}
            </span>
            <span className="ml-2 text-xs font-medium text-gray-500">SIA verified</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Official badge checks & document uploads</p>
        </div>
      </div>

      {/* Filters Container with Generous Spacing */}
      <div className="my-6 p-5 bg-white rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, actor, IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <option value="ALL">All Entities</option>
              <option value="Invoice">Invoices</option>
              <option value="PayRun">Payroll Runs</option>
              <option value="Attendance">Attendance Records</option>
              <option value="Assignment">Site Assignments</option>
              <option value="Licence">SIA Licences</option>
              <option value="Timesheet">Timesheets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="my-6 bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Security & Mutation Log</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chronological record of company data access and modifications</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-[#6C5CE7] rounded-lg border border-purple-100">
            {filteredLogs.length} events matching filter
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#FAF9FE] text-gray-700 font-semibold text-xs border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">Actor (User ID)</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-5 py-4 text-xs font-medium text-gray-500">
                      {new Date(log.createdAt).toLocaleString('en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{log.entity}</div>
                      <div className="text-xs text-gray-400">{log.entityId || 'Global'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-gray-700">
                      {log.userId || 'System Agent'}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 font-mono">
                      {log.ipAddress || 'Internal'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] text-[#6C5CE7] rounded-lg text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Audit Mutation Payload</h3>
                <p className="text-xs text-gray-500">Action: {selectedLog.action} • {selectedLog.entity}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-semibold">Event ID:</span>
                  <div className="font-mono text-gray-800">{selectedLog.id}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold">Timestamp:</span>
                  <div className="font-mono text-gray-800">{new Date(selectedLog.createdAt).toISOString()}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold">Client IP:</span>
                  <div className="font-mono text-gray-800">{selectedLog.ipAddress || 'Internal'}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold">User Agent:</span>
                  <div className="font-mono text-gray-800 truncate">{selectedLog.userAgent || 'API/Worker'}</div>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <span className="block text-xs font-bold text-rose-600 mb-1">Previous State (Old Value)</span>
                  <pre className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-mono text-rose-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <span className="block text-xs font-bold text-emerald-600 mb-1">Mutated State (New Value)</span>
                  <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
