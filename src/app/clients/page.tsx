'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  ReceiptText,
  Files,
  Plus,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  X,
  PoundSterling,
  ShieldCheck,
  Download,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  ChevronRight,
  Trash2,
  Zap,
} from 'lucide-react';

import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  clientsApi,
  Client,
  Contract,
  Invoice,
  ProfitabilitySummary,
  CreateClientDto,
  CreateInvoiceDto,
  CreateContractDto,
} from '@/lib/api/clients';
import { fetchSites } from '@/lib/api/sites';
import { Site } from '@/types/site';

// Formatting helpers
function formatCurrency(val?: number | string | null): string {
  const num = Number(val) || 0;
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRate(val?: number | string | null): string {
  const num = Number(val) || 0;
  return `£${num.toFixed(2)}`;
}

function safeNumber(val?: number | string | null): number {
  return Number(val) || 0;
}

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients' | 'contracts' | 'profitability'>('invoices');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [profitability, setProfitability] = useState<ProfitabilitySummary | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Client Form
  const [clientForm, setClientForm] = useState<CreateClientDto>({
    name: '',
    code: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    billingAddress: '',
    paymentTermsDays: 30,
    vatNumber: '',
    notes: '',
  });

  // New Contract Form
  const [contractForm, setContractForm] = useState<CreateContractDto>({
    clientId: '',
    siteId: '',
    title: '',
    contractNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    billingCycle: 'monthly',
    hourlyBillingRate: 24.50,
    notes: '',
  });

  // New Invoice Form
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceDto>({
    clientId: '',
    contractId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    taxRate: 20,
    currency: 'GBP',
    notes: '',
    items: [
      {
        description: 'Manned Guarding / SIA Door Supervision Services',
        quantityHours: 160,
        unitPrice: 24.50,
      },
    ],
  });

  const [saving, setSaving] = useState(false);
  const [syncingTimesheet, setSyncingTimesheet] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const [cls, cts, invs, prof, sitesList] = await Promise.all([
        clientsApi.getClients(),
        clientsApi.getContracts(),
        clientsApi.getInvoices(),
        clientsApi.getProfitabilitySummary(),
        fetchSites().catch(() => [] as Site[]),
      ]);
      setClients(cls);
      setContracts(cts);
      setInvoices(invs);
      setProfitability(prof);
      setSites(sitesList);

      if (cls.length > 0 && !invoiceForm.clientId) {
        setInvoiceForm(prev => ({ ...prev, clientId: cls[0].id }));
        setContractForm(prev => ({ ...prev, clientId: cls[0].id }));
      }
      if (sitesList.length > 0 && !contractForm.siteId) {
        setContractForm(prev => ({ ...prev, siteId: sitesList[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load clients data:', err);
      setActionError(err?.message || 'Failed to load clients data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.contactEmail) return;
    try {
      setSaving(true);
      setActionError(null);
      await clientsApi.createClient(clientForm);
      setIsClientModalOpen(false);
      setClientForm({
        name: '',
        code: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        billingAddress: '',
        paymentTermsDays: 30,
        vatNumber: '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      console.error('Error creating client:', err);
      setActionError(err?.message || 'Failed to create client.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.clientId) return;
    try {
      setSaving(true);
      setActionError(null);
      await clientsApi.createContract(contractForm);
      setIsContractModalOpen(false);
      setContractForm({
        clientId: clients[0]?.id || '',
        siteId: sites[0]?.id || '',
        title: '',
        contractNumber: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        billingCycle: 'monthly',
        hourlyBillingRate: 24.50,
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      console.error('Error creating contract:', err);
      setActionError(err?.message || 'Failed to create contract.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncTimesheets = async () => {
    if (!invoiceForm.contractId) {
      setActionError('Please select a Guarding Contract to sync timesheet hours.');
      return;
    }
    try {
      setSyncingTimesheet(true);
      setActionError(null);
      setSyncFeedback(null);
      const data = await clientsApi.getContractUnbilledHours(
        invoiceForm.contractId,
        invoiceForm.issueDate,
        invoiceForm.dueDate
      );
      if (data && data.suggestedLineItems && data.suggestedLineItems.length > 0) {
        const item = data.suggestedLineItems[0];
        setInvoiceForm(prev => ({
          ...prev,
          items: [
            {
              description: item.description,
              quantityHours: item.quantityHours,
              unitPrice: item.unitPrice,
            },
          ],
        }));
        setSyncFeedback(`✓ Auto-Synced ${item.quantityHours} hrs @ £${item.unitPrice.toFixed(2)}/hr (${data.siteName})`);
      }
    } catch (err: any) {
      console.error('Error syncing timesheets:', err);
      setActionError(err?.message || 'Could not fetch unbilled timesheet hours.');
    } finally {
      setSyncingTimesheet(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientId || invoiceForm.items.length === 0) return;
    try {
      setSaving(true);
      setActionError(null);
      await clientsApi.createInvoice(invoiceForm);
      setIsInvoiceModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setActionError(err?.message || 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: 'paid' | 'sent') => {
    try {
      await clientsApi.updateInvoiceStatus(invoiceId, status);
      await loadData();
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(prev => prev ? { ...prev, status } : null);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setActionError(err?.message || 'Failed to update invoice status.');
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!window.confirm(`Are you sure you want to delete client "${clientName}"?`)) return;
    try {
      setLoading(true);
      setActionError(null);
      await clientsApi.deleteClient(clientId);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setActionError(err?.message || 'Failed to delete client.');
    } finally {
      setLoading(false);
    }
  };


  // Filtered lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const status = (inv.status || 'draft').toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.client?.name?.toLowerCase().includes(q) ||
        inv.client?.code?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [invoices, statusFilter, searchQuery]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const status = (c.status || 'active').toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        c.name?.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.companyNumber && c.companyNumber.toLowerCase().includes(q)) ||
        (c.contactEmail && c.contactEmail.toLowerCase().includes(q)) ||
        (c.billingEmail && c.billingEmail.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [clients, statusFilter, searchQuery]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(con => {
      const status = (con.status || 'active').toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        (con.code && con.code.toLowerCase().includes(q)) ||
        (con.contractNumber && con.contractNumber.toLowerCase().includes(q)) ||
        (con.name && con.name.toLowerCase().includes(q)) ||
        (con.title && con.title.toLowerCase().includes(q)) ||
        con.client?.name?.toLowerCase().includes(q) ||
        con.site?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [contracts, statusFilter, searchQuery]);

  // Aggregate Metrics calculations
  const totalBilled = useMemo(() => {
    return invoices
      .filter(i => i.status !== 'void')
      .reduce((s, i) => s + safeNumber(i.total ?? i.totalAmount), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + safeNumber(i.total ?? i.totalAmount), 0);
  }, [invoices]);

  const activeContracts = useMemo(() => contracts.filter(c => c.status === 'active'), [contracts]);
  const activeContractsCount = activeContracts.length;

  const averageContractBillingRate = useMemo(() => {
    if (activeContracts.length === 0) return 0;
    const sum = activeContracts.reduce((acc, c) => acc + safeNumber(c.hourlyBillingRate ?? c.billingRatePerHour), 0);
    return sum / activeContracts.length;
  }, [activeContracts]);

  // Profitability calculations with real fallbacks
  const displayGrossRevenue = useMemo(() => {
    return safeNumber(profitability?.grossRevenue ?? profitability?.totalRevenue ?? totalBilled);
  }, [profitability, totalBilled]);

  const displayLaborCost = useMemo(() => {
    return safeNumber(profitability?.totalLaborCost ?? 0);
  }, [profitability]);

  const displayGrossProfit = useMemo(() => {
    return safeNumber(profitability?.grossProfit ?? (displayGrossRevenue - displayLaborCost));
  }, [profitability, displayGrossRevenue, displayLaborCost]);

  const displayMarginPercentage = useMemo(() => {
    if (profitability?.marginPercentage !== undefined && profitability?.marginPercentage !== null) {
      return safeNumber(profitability.marginPercentage);
    }
    return displayGrossRevenue > 0
      ? Math.round(((displayGrossProfit / displayGrossRevenue) * 100) * 10) / 10
      : 0;
  }, [profitability, displayGrossProfit, displayGrossRevenue]);

  const handleExportInvoicesCsv = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice #', 'Client Name', 'Client Code', 'Issue Date', 'Due Date', 'Subtotal', 'Tax (20%)', 'Total', 'Status'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      `"${i.client?.name || 'Client'}"`,
      i.client?.code || '',
      i.issueDate,
      i.dueDate,
      safeNumber(i.subtotal).toFixed(2),
      safeNumber(i.taxAmount).toFixed(2),
      safeNumber(i.total ?? i.totalAmount).toFixed(2),
      i.status.toUpperCase(),
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-16">
        {/* Top Banner & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div>
            
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
              Clients, Contracts & Invoicing
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Client accounts, hourly manned guarding contracts, automated billing, and live gross margin profitability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] text-[#6C5CE7] font-medium text-xs rounded-md transition-all shadow-sm h-7"
            >
              <Building2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
              New Client
            </button>
            <button
              onClick={() => setIsContractModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] text-[#6C5CE7] font-medium text-xs rounded-md transition-all shadow-sm h-7"
            >
              <Files className="w-3.5 h-3.5 text-[#6C5CE7]" />
              New Contract
            </button>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-medium text-xs rounded-md transition-all shadow-sm h-7"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              Create Invoice
            </button>
          </div>

        </div>

        {/* Global Error Banner if any */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Metric Cards with Live Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 my-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Clients</span>
              <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7]">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{clients.length}</span>
              <span className="ml-2 text-xs font-medium text-emerald-600">
                {clients.filter(c => c.status === 'active').length} active
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Tier 1 corporate & logistics venues</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Contracts</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Files className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{activeContractsCount}</span>
              <span className="ml-2 text-xs font-medium text-indigo-600">
                {averageContractBillingRate > 0 ? `Avg ${formatRate(averageContractBillingRate)}/hr` : 'No active rates'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Bound to site SIA shift schedules</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Invoiced</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#6C5CE7]">
                <ReceiptText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalBilled)}</span>
              <span className="ml-2 text-xs font-medium text-emerald-600">inc. 20% VAT</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(totalPaid)} collected via BACS</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#6C5CE7]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Profit Margin</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">
                {displayMarginPercentage.toFixed(1)}%
              </span>
              <span className="ml-2 text-xs font-medium text-gray-500">
                {displayGrossRevenue > 0 ? 'Live reconciliation' : 'Awaiting data'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Net revenue after guard payroll wages</p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="my-6 border-b border-gray-200">
          <nav className="flex space-x-3 overflow-x-auto pb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`whitespace-nowrap py-3 px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_4px_rgba(108,92,231,0.25)]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              Invoices & Billing ({invoices.length})
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`whitespace-nowrap py-3 px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'clients'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_4px_rgba(108,92,231,0.25)]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Client Directory ({clients.length})
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`whitespace-nowrap py-3 px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'contracts'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_4px_rgba(108,92,231,0.25)]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Files className="w-4 h-4" />
              Guarding Contracts ({contracts.length})
            </button>

            <button
              onClick={() => setActiveTab('profitability')}
              className={`whitespace-nowrap py-3 px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'profitability'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_4px_rgba(108,92,231,0.25)]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Profitability Analytics
            </button>
          </nav>
        </div>

        {/* Functional Search and Filters Bar */}
        <div className="my-6 p-5 bg-white rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'invoices'
                    ? 'Search invoice #, client name...'
                    : activeTab === 'clients'
                    ? 'Search client name, code, email...'
                    : activeTab === 'contracts'
                    ? 'Search contract #, title, site...'
                    : 'Search analytics...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <option value="ALL">All Statuses</option>
                {activeTab === 'invoices' ? (
                  <>
                    <option value="paid">Paid</option>
                    <option value="sent">Sent / Pending</option>
                    <option value="draft">Draft</option>
                  </>
                ) : (
                  <>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </>
                )}
              </select>

              {activeTab === 'invoices' && invoices.length > 0 && (
                <button
                  onClick={handleExportInvoicesCsv}
                  className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] flex items-center gap-1.5"
                  title="Export invoices as CSV"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Tab Content */}
        <div className="my-6">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200/80 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="w-10 h-10 border-4 border-[#6C5CE7] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 font-medium text-sm">Loading financial ledgers...</p>
            </div>
          ) : activeTab === 'invoices' ? (
            /* --- Invoices Tab --- */
            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Invoices Ledger</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Automated billing with 20% UK VAT breakdown and payment status tracking</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                  {filteredInvoices.length} of {invoices.length} invoices shown
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-[#FAF9FE] text-gray-700 font-semibold text-xs border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5">Invoice #</th>
                      <th className="px-5 py-3.5">Client</th>
                      <th className="px-5 py-3.5">Issue Date</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Subtotal</th>
                      <th className="px-5 py-3.5">VAT (20%)</th>
                      <th className="px-5 py-3.5">Total (GBP)</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8">
                          <EmptyState
                            icon={<ReceiptText className="w-8 h-8 text-[#6C5CE7]" />}
                            title={searchQuery || statusFilter !== 'ALL' ? 'No Matching Invoices Found' : 'No Invoices Issued Yet'}
                            description={
                              searchQuery || statusFilter !== 'ALL'
                                ? 'Try adjusting your search terms or status filter.'
                                : 'Generate client invoices from recorded attendance and agreed hourly contract rates.'
                            }
                            action={
                              <button
                                onClick={() => setIsInvoiceModalOpen(true)}
                                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1.5"
                              >
                                <Plus className="w-4 h-4" />
                                Create First Invoice
                              </button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="px-5 py-4 font-bold text-[#6C5CE7]">{inv.invoiceNumber}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900">{inv.client?.name || 'Corporate Client'}</div>
                            <div className="text-xs text-gray-400">{inv.client?.code}</div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{inv.issueDate}</td>
                          <td className="px-5 py-4 text-gray-600">{inv.dueDate}</td>
                          <td className="px-5 py-4 font-medium text-gray-700">{formatCurrency(inv.subtotal)}</td>
                          <td className="px-5 py-4 text-gray-500">{formatCurrency(inv.taxAmount)}</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(inv.total ?? inv.totalAmount)}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.status === 'sent'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {inv.status === 'paid' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {(inv.status || 'DRAFT').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-2.5 py-1.5 bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] text-[#6C5CE7] rounded-lg text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all flex items-center gap-1"
                                title="View & Export PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Invoice PDF
                              </button>
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => handleUpdateStatus(inv.id, 'paid')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'clients' ? (
            /* --- Clients Tab --- */
            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-gray-900 text-base">Client Directory</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-purple-50 text-[#6C5CE7] rounded-full border border-purple-100">
                      {filteredClients.length} of {clients.length} Accounts
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Database
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Corporate accounts, billing contacts, active contracts, and payment agreements</p>
                </div>
                <button
                  onClick={() => setIsClientModalOpen(true)}
                  className="px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-lg transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Client
                </button>
              </div>

              {filteredClients.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={<Building2 className="w-8 h-8 text-[#6C5CE7]" />}
                    title={searchQuery || statusFilter !== 'ALL' ? 'No Matching Clients Found' : 'No Client Accounts Found'}
                    description={
                      searchQuery || statusFilter !== 'ALL'
                        ? 'Try adjusting your search terms or filters.'
                        : 'Register enterprise client accounts, SLA terms, billing contacts, and payment cycles.'
                    }
                    action={
                      <button
                        onClick={() => setIsClientModalOpen(true)}
                        className="px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Register First Client
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
                  {filteredClients.map(cli => {
                    const clientContracts = contracts.filter(c => c.clientId === cli.id);
                    const clientInvoices = invoices.filter(i => i.clientId === cli.id);
                    const clientTotalBilled = clientInvoices.reduce((s, i) => s + safeNumber(i.total ?? i.totalAmount), 0);

                    return (
                      <div
                        key={cli.id}
                        className="bg-[#FAF9FE] p-5 rounded-2xl border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#6C5CE7]/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7] bg-white px-2 py-0.5 rounded border border-[#D5D0FA]">
                                {cli.code || cli.companyNumber || 'CLIENT'}
                              </span>
                              <h4 className="font-bold text-gray-900 text-base mt-2">{cli.name}</h4>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  cli.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {(cli.status || 'ACTIVE').toUpperCase()}
                              </span>
                              <button
                                onClick={() => handleDeleteClient(cli.id, cli.name)}
                                className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete client"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Live Client Metrics */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-md">
                              <Files className="w-3 h-3 text-[#6C5CE7]" />
                              {clientContracts.length} {clientContracts.length === 1 ? 'Contract' : 'Contracts'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-white border border-gray-200 text-emerald-700 rounded-md">
                              <ReceiptText className="w-3 h-3 text-emerald-600" />
                              {formatCurrency(clientTotalBilled)} Billed
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-700">Contact:</span>
                              <span>{cli.contactName || cli.name} ({cli.contactEmail || cli.billingEmail})</span>
                            </div>
                            {(cli.contactPhone || cli.phone) && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-700">Phone:</span>
                                <span>{cli.contactPhone || cli.phone}</span>
                              </div>
                            )}
                            {(cli.billingAddress || cli.address) && (
                              <div className="flex items-start gap-1.5">
                                <span className="font-semibold text-gray-700">Address:</span>
                                <span className="text-gray-500">{cli.billingAddress || cli.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-700">Payment Terms:</span>
                              <span className="text-[#6C5CE7] font-semibold">{cli.paymentTermsDays || 30} Days Net</span>
                            </div>
                            {cli.vatNumber && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-700">VAT Reg:</span>
                                <span>{cli.vatNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-purple-200/50 flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            Registered: {cli.createdAt ? new Date(cli.createdAt).toLocaleDateString() : 'Active'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setContractForm(prev => ({ ...prev, clientId: cli.id }));
                                setIsContractModalOpen(true);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                            >
                              + Contract
                            </button>
                            <button
                              onClick={() => {
                                setInvoiceForm(prev => ({ ...prev, clientId: cli.id }));
                                setIsInvoiceModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-[#6C5CE7] bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] rounded-lg transition-all"
                            >
                              Bill Client →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          ) : activeTab === 'contracts' ? (
            /* --- Contracts Tab --- */
            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Guarding Contracts & Rate Cards</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Signed security service agreements, hourly rates, and holiday multipliers</p>
                </div>
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-lg transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Contract
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-[#FAF9FE] text-gray-700 font-semibold text-xs border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5">Contract Code</th>
                      <th className="px-5 py-3.5">Title / Scope</th>
                      <th className="px-5 py-3.5">Client & Site</th>
                      <th className="px-5 py-3.5">Billing Rate</th>
                      <th className="px-5 py-3.5">Holiday Multiplier</th>
                      <th className="px-5 py-3.5">Period & Cycle</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredContracts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8">
                          <EmptyState
                            icon={<Files className="w-8 h-8 text-[#6C5CE7]" />}
                            title={searchQuery || statusFilter !== 'ALL' ? 'No Matching Contracts' : 'No Guarding Contracts Active'}
                            description={
                              searchQuery || statusFilter !== 'ALL'
                                ? 'Try adjusting your search terms or filters.'
                                : 'Attach master service agreements, billing cycles, and overtime multipliers to client sites.'
                            }
                            action={
                              <button
                                onClick={() => setIsContractModalOpen(true)}
                                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1.5"
                              >
                                <Plus className="w-4 h-4" />
                                Add First Contract
                              </button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredContracts.map(con => (
                        <tr key={con.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="px-5 py-4 font-bold text-[#6C5CE7]">{con.contractNumber || con.code}</td>
                          <td className="px-5 py-4 font-semibold text-gray-900">{con.title || con.name}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900">{con.client?.name || 'Corporate Client'}</div>
                            <div className="text-xs text-gray-500">{con.site?.name || 'All Sites Assignment'}</div>
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-600">
                            {formatRate(con.hourlyBillingRate ?? con.billingRatePerHour)}/hr
                          </td>
                          <td className="px-5 py-4 font-semibold text-purple-600">
                            {con.holidayBillingRatePerHour
                              ? `${formatRate(con.holidayBillingRatePerHour)}/hr`
                              : `${formatRate((safeNumber(con.hourlyBillingRate ?? con.billingRatePerHour)) * 1.5)}/hr (1.5x)`}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500">
                            <div>{con.startDate} to {con.endDate || 'Rolling'}</div>
                            <div className="text-[11px] font-medium text-gray-400 capitalize">{con.billingCycle || 'monthly'} cycle</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {(con.status || 'ACTIVE').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* --- Profitability Analytics Tab --- */
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Gross Profitability & Margin Health</h3>
                    <p className="text-sm text-gray-500">
                      Direct comparison of client billable revenues vs actual guard payroll wage expenses
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                    Target Margin: 30%+
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
                  <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Gross Client Revenue</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(displayGrossRevenue)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Excluding 20% pass-through UK VAT</p>
                  </div>

                  <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Guard Labor Wage Cost</div>
                    <div className="text-2xl font-bold text-rose-700 mt-2">
                      {formatCurrency(displayLaborCost)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">From Phase 13 Pay Run timesheets</p>
                  </div>

                  <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Net Gross Profit</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-2">
                      {formatCurrency(displayGrossProfit)}
                    </div>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      {displayMarginPercentage.toFixed(1)}% Gross Margin
                    </p>
                  </div>
                </div>

                {/* Visual Margin Bar */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                    <span>
                      Labor Cost ({Math.max(0, 100 - displayMarginPercentage).toFixed(1)}%)
                    </span>
                    <span>
                      Gross Margin ({displayMarginPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-4 bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, 100 - displayMarginPercentage))}%` }}
                      className="bg-rose-500 h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, displayMarginPercentage))}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Real Client Profitability Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
                <h4 className="font-bold text-gray-900 text-base mb-1">Client Contract Rate Cards & Profitability Breakdown</h4>
                <p className="text-xs text-gray-500 mb-4">Reconciled billable rate card margins against standard SIA officer pay scale</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-[#FAF9FE] text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Client</th>
                        <th className="p-3">Active Scope</th>
                        <th className="p-3">Client Rate</th>
                        <th className="p-3">Estimated Guard Pay</th>
                        <th className="p-3">Spread / Margin</th>
                        <th className="p-3">Health Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contracts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">
                            No contract rate cards registered yet.
                          </td>
                        </tr>
                      ) : (
                        contracts.map(con => {
                          const billRate = safeNumber(con.hourlyBillingRate ?? con.billingRatePerHour ?? 24.50);
                          const estGuardPay = Math.round(billRate * 0.65 * 100) / 100;
                          const spread = Math.round((billRate - estGuardPay) * 100) / 100;
                          const spreadPct = billRate > 0 ? Math.round((spread / billRate) * 1000) / 10 : 0;
                          return (
                            <tr key={con.id} className="hover:bg-purple-50/30">
                              <td className="p-3 font-semibold text-gray-900">
                                {con.client?.name || 'Corporate Client'}
                              </td>
                              <td className="p-3">{con.title || con.name}</td>
                              <td className="p-3 font-bold text-gray-900">{formatRate(billRate)}/hr</td>
                              <td className="p-3 text-rose-700 font-medium">~{formatRate(estGuardPay)}/hr</td>
                              <td className="p-3 font-bold text-emerald-600">
                                +{formatRate(spread)}/hr ({spreadPct}%)
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  spreadPct >= 30
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {spreadPct >= 30 ? 'STRONG MARGIN' : 'STANDARD'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- New Client Modal --- */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Onboard Corporate Client</h3>
                  <p className="text-xs text-gray-500">Add client account details and billing parameters</p>
                </div>
                <button
                  onClick={() => setIsClientModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canary Wharf Financial Towers Ltd"
                    value={clientForm.name}
                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Client Code</label>
                    <input
                      type="text"
                      placeholder="CWFT"
                      value={clientForm.code}
                      onChange={e => setClientForm({ ...clientForm, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={clientForm.paymentTermsDays}
                      onChange={e => setClientForm({ ...clientForm, paymentTermsDays: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                      <option value={14}>14 Days Net</option>
                      <option value={30}>30 Days Net</option>
                      <option value={60}>60 Days Net</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="Julian Sterling"
                      value={clientForm.contactName}
                      onChange={e => setClientForm({ ...clientForm, contactName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="accounts@cwft-london.co.uk"
                      value={clientForm.contactEmail}
                      onChange={e => setClientForm({ ...clientForm, contactEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+44 20 7946 0912"
                      value={clientForm.contactPhone}
                      onChange={e => setClientForm({ ...clientForm, contactPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">HMRC VAT Reg Number</label>
                    <input
                      type="text"
                      placeholder="GB 992 4810 44"
                      value={clientForm.vatNumber}
                      onChange={e => setClientForm({ ...clientForm, vatNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    placeholder="1 Canada Square, Canary Wharf, London E14 5AA"
                    value={clientForm.billingAddress}
                    onChange={e => setClientForm({ ...clientForm, billingAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-xl text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center gap-1.5"
                  >
                    {saving ? 'Creating...' : 'Save Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- New Contract Modal --- */}
        {isContractModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Create Guarding Contract</h3>
                  <p className="text-xs text-gray-500">Link client with site assignment & hourly billing rate card</p>
                </div>
                <button
                  onClick={() => setIsContractModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Client *</label>
                  <select
                    required
                    value={contractForm.clientId}
                    onChange={e => setContractForm({ ...contractForm, clientId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Site Assignment</label>
                  <select
                    value={contractForm.siteId}
                    onChange={e => setContractForm({ ...contractForm, siteId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    {sites.length === 0 ? (
                      <option value="">Default Site / All Venues</option>
                    ) : (
                      sites.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code || 'SITE'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contract Title / Scope *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24/7 SIA Manned Guarding"
                      value={contractForm.title}
                      onChange={e => setContractForm({ ...contractForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contract Code / Ref</label>
                    <input
                      type="text"
                      placeholder="CNT-2026-001"
                      value={contractForm.contractNumber}
                      onChange={e => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Rate (£ / Hour) *</label>
                    <input
                      type="number"
                      step="0.25"
                      min="1"
                      required
                      value={contractForm.hourlyBillingRate}
                      onChange={e => setContractForm({ ...contractForm, hourlyBillingRate: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      value={contractForm.billingCycle}
                      onChange={e => setContractForm({ ...contractForm, billingCycle: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                      <option value="weekly">Weekly Cycle</option>
                      <option value="bi_weekly">Fortnightly Cycle</option>
                      <option value="monthly">Monthly Cycle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={contractForm.startDate}
                      onChange={e => setContractForm({ ...contractForm, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">End Date (Optional)</label>
                    <input
                      type="date"
                      value={contractForm.endDate}
                      onChange={e => setContractForm({ ...contractForm, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-xl text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center gap-1.5"
                  >
                    {saving ? 'Creating...' : 'Create Contract'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Create Invoice Modal --- */}
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Generate Tax Invoice</h3>
                  <p className="text-xs text-gray-500">Issues UK VAT invoice based on guarding service hours</p>
                </div>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Client *</label>
                  <select
                    required
                    value={invoiceForm.clientId}
                    onChange={e => {
                      const newClientId = e.target.value;
                      const matchingContracts = contracts.filter(c => c.clientId === newClientId);
                      const defaultContract = matchingContracts[0];
                      setInvoiceForm(prev => ({
                        ...prev,
                        clientId: newClientId,
                        contractId: defaultContract ? defaultContract.id : '',
                        items: defaultContract ? [
                          {
                            ...prev.items[0],
                            unitPrice: defaultContract.hourlyBillingRate || defaultContract.billingRatePerHour || 24.50,
                            description: `Manned Guarding Services - ${defaultContract.title || defaultContract.name}`,
                          }
                        ] : prev.items,
                      }));
                      setSyncFeedback(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">Guarding Contract</label>
                    {invoiceForm.contractId && (
                      <button
                        type="button"
                        disabled={syncingTimesheet}
                        onClick={handleSyncTimesheets}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] hover:text-[#5848c2] bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-md transition-all shadow-xs"
                      >
                        <Zap className={`w-3 h-3 ${syncingTimesheet ? 'animate-spin text-[#6C5CE7]' : 'text-[#6C5CE7]'}`} />
                        {syncingTimesheet ? 'Syncing...' : 'Sync from Timesheets'}
                      </button>
                    )}
                  </div>
                  <select
                    value={invoiceForm.contractId}
                    onChange={e => {
                      const selectedConId = e.target.value;
                      const con = contracts.find(c => c.id === selectedConId);
                      setInvoiceForm(prev => {
                        const items = [...prev.items];
                        if (con && items[0]) {
                          items[0].unitPrice = con.hourlyBillingRate || con.billingRatePerHour || 24.50;
                          items[0].description = `Manned Guarding Services - ${con.title || con.name}`;
                        }
                        return { ...prev, contractId: selectedConId, items };
                      });
                      setSyncFeedback(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <option value="">-- Select Guarding Contract (Optional) --</option>
                    {contracts
                      .filter(con => !invoiceForm.clientId || con.clientId === invoiceForm.clientId)
                      .map(con => (
                        <option key={con.id} value={con.id}>
                          {con.title || con.name} ({con.code}) - £{con.billingRatePerHour || con.hourlyBillingRate}/hr
                        </option>
                      ))}
                  </select>
                  {syncFeedback && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                      <span>{syncFeedback}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={invoiceForm.issueDate}
                      onChange={e => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={invoiceForm.dueDate}
                      onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-700">Billing Line Item</label>
                    <span className="text-xs text-[#6C5CE7] font-semibold">Standard UK 20% VAT</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Service Description</label>
                      <input
                        type="text"
                        required
                        value={invoiceForm.items[0]?.description || ''}
                        onChange={e => {
                          const items = [...invoiceForm.items];
                          items[0].description = e.target.value;
                          setInvoiceForm({ ...invoiceForm, items });
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6C5CE7]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Hours Logged</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={invoiceForm.items[0]?.quantityHours || 1}
                          onChange={e => {
                            const items = [...invoiceForm.items];
                            items[0].quantityHours = Number(e.target.value);
                            setInvoiceForm({ ...invoiceForm, items });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6C5CE7]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Rate (£ / Hour)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="1"
                          required
                          value={invoiceForm.items[0]?.unitPrice || 24.50}
                          onChange={e => {
                            const items = [...invoiceForm.items];
                            items[0].unitPrice = Number(e.target.value);
                            setInvoiceForm({ ...invoiceForm, items });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6C5CE7]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Invoice Totals */}
                <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency((invoiceForm.items[0]?.quantityHours || 0) * (invoiceForm.items[0]?.unitPrice || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>HMRC VAT (20%):</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(((invoiceForm.items[0]?.quantityHours || 0) * (invoiceForm.items[0]?.unitPrice || 0)) * 0.20)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#6C5CE7] pt-2 border-t border-purple-200">
                    <span>Total Amount Due:</span>
                    <span>
                      {formatCurrency(((invoiceForm.items[0]?.quantityHours || 0) * (invoiceForm.items[0]?.unitPrice || 0)) * 1.20)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-xl text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center gap-1.5"
                  >
                    {saving ? 'Generating...' : 'Issue Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Printable Invoice Detail Modal --- */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-invoice-modal,
                #printable-invoice-modal * {
                  visibility: visible !important;
                }
                #printable-invoice-modal {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 20px !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            <div id="printable-invoice-modal" className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 no-print">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#6C5CE7] text-white">
                    TAX INVOICE
                  </span>
                  <span className="font-bold text-gray-900">{selectedInvoice.invoiceNumber}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {(selectedInvoice.status || 'DRAFT').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xl font-bold text-[#6C5CE7]">WORKFORCE EMS SECURITY SERVICES LTD</div>
                    <p className="text-xs text-gray-500 mt-1">
                      107 Cheapside, City of London, EC2V 6DN<br />
                      Company No: 08849201 • HMRC VAT: GB 928 3401 22
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-semibold uppercase">Invoice #</div>
                    <div className="text-lg font-bold text-gray-900">{selectedInvoice.invoiceNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">Issue: {selectedInvoice.issueDate}</div>
                    <div className="text-xs font-semibold text-rose-600">Due: {selectedInvoice.dueDate}</div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice To:</div>
                  <div className="font-bold text-gray-900">{selectedInvoice.client?.name || 'Corporate Client'}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{selectedInvoice.client?.billingAddress || selectedInvoice.client?.address || 'London, United Kingdom'}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Attn: {selectedInvoice.client?.contactName || selectedInvoice.client?.name} ({selectedInvoice.client?.contactEmail || selectedInvoice.client?.billingEmail || 'accounts@client.co.uk'})
                  </div>
                  {selectedInvoice.client?.vatNumber && (
                    <div className="text-xs text-gray-500 mt-1">Client VAT: {selectedInvoice.client.vatNumber}</div>
                  )}
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9FE] text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Hours</th>
                        <th className="p-3 text-right">Rate/Hr</th>
                        <th className="p-3 text-right">Amount (GBP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                        selectedInvoice.items.map(it => (
                          <tr key={it.id}>
                            <td className="p-3 font-medium text-gray-900">{it.description}</td>
                            <td className="p-3 text-right text-gray-700">{it.quantityHours ?? it.hours ?? 0} hrs</td>
                            <td className="p-3 text-right text-gray-700">{formatRate(it.unitPrice ?? it.rate)}</td>
                            <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(it.amount ?? it.totalAmount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-3 font-medium text-gray-900">Manned Guarding & SIA Door Supervision</td>
                          <td className="p-3 text-right text-gray-700">160 hrs</td>
                          <td className="p-3 text-right text-gray-700">£24.50</td>
                          <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>UK VAT ({safeNumber(selectedInvoice.taxRate || 20)}%):</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-[#6C5CE7] pt-2 border-t border-gray-200">
                      <span>Total Due:</span>
                      <span>{formatCurrency(selectedInvoice.total ?? selectedInvoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Remittance */}
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-gray-600">
                  <div className="font-bold text-[#6C5CE7] mb-1">BACS Remittance Instructions:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Bank: Barclays Bank UK PLC</div>
                    <div>Account Name: Workforce EMS Operations Ltd</div>
                    <div>Sort Code: 20-00-00</div>
                    <div>Account No: 88392019</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
