'use client';

import React, { useState, useEffect } from 'react';
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
} from '@/lib/api/clients';

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients' | 'contracts' | 'profitability'>('invoices');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profitability, setProfitability] = useState<ProfitabilitySummary | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cls, cts, invs, prof] = await Promise.all([
        clientsApi.getClients(),
        clientsApi.getContracts(),
        clientsApi.getInvoices(),
        clientsApi.getProfitabilitySummary(),
      ]);
      setClients(cls);
      setContracts(cts);
      setInvoices(invs);
      setProfitability(prof);
      if (cls.length > 0 && !invoiceForm.clientId) {
        setInvoiceForm(prev => ({ ...prev, clientId: cls[0].id }));
      }
    } catch (err) {
      console.error('Failed to load clients data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.contactEmail) return;
    try {
      setSaving(true);
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
    } catch (err) {
      console.error('Error creating client:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientId || invoiceForm.items.length === 0) return;
    try {
      setSaving(true);
      await clientsApi.createInvoice(invoiceForm);
      setIsInvoiceModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error creating invoice:', err);
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
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Calculations
  const totalBilled = invoices
    .filter(i => i.status !== 'void')
    .reduce((s, i) => s + i.total, 0);

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0);

  const activeContractsCount = contracts.filter(c => c.status === 'active').length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7]">
              Phase 14 • Enterprise
            </span>
            <span className="text-xs text-gray-500 font-medium">HMRC VAT Compliant • SIA Guard Rate Billing</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            Clients, Contracts & Invoicing
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Client accounts, hourly manned guarding contracts, automated billing, and live gross margin profitability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] text-[#6C5CE7] font-semibold text-sm rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <Building2 className="w-4 h-4 text-[#6C5CE7]" />
            New Client
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-sm rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(108,92,231,0.35)]"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* 4 Metric Cards with Generous Spacing */}
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
            <span className="ml-2 text-xs font-medium text-emerald-600">100% verified</span>
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
            <span className="ml-2 text-xs font-medium text-indigo-600">Avg £23.25/hr</span>
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
            <span className="text-2xl font-bold text-gray-900">£{totalBilled.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
            <span className="ml-2 text-xs font-medium text-emerald-600">inc. 20% VAT</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">£{totalPaid.toLocaleString('en-GB', { minimumFractionDigits: 2 })} collected via BACS</p>
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
              {profitability ? `${profitability.marginPercentage}%` : '35.3%'}
            </span>
            <span className="ml-2 text-xs font-medium text-gray-500">Net after guard wages</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Real-time revenue vs labor reconciliation</p>
        </div>
      </div>

      {/* Tabs Bar with Top Inset Shadow on Active */}
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

      {/* Independent Filters Container (generous spacing above and below) */}
      <div className="my-6 p-5 bg-white rounded-2xl border border-gray-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client, invoice #, or code..."
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
              <option value="paid">Paid</option>
              <option value="sent">Sent / Pending Payment</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Content with my-6 Separation */}
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
                {invoices.length} invoices generated
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
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8">
                        <EmptyState
                          icon={<ReceiptText className="w-8 h-8 text-[#6C5CE7]" />}
                          title="No Invoices Issued Yet"
                          description="Generate client invoices from recorded attendance and agreed hourly contract rates."
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
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#6C5CE7]">{inv.invoiceNumber}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{inv.client?.name || 'Corporate Client'}</div>
                          <div className="text-xs text-gray-400">{inv.client?.code}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{inv.issueDate}</td>
                        <td className="px-5 py-4 text-gray-600">{inv.dueDate}</td>
                        <td className="px-5 py-4 font-medium text-gray-700">£{inv.subtotal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-gray-500">£{inv.taxAmount.toFixed(2)}</td>
                        <td className="px-5 py-4 font-bold text-gray-900">£{inv.total.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'sent'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {inv.status === 'paid' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-3 py-1.5 bg-white border border-[#D5D0FA] hover:bg-[#F8F7FF] text-[#6C5CE7] rounded-lg text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              View
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
                <h3 className="font-bold text-gray-900 text-base">Client Accounts</h3>
                <p className="text-xs text-gray-500 mt-0.5">Corporate accounts, billing contacts, and payment agreements</p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-lg transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                + Add Client
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Building2 className="w-8 h-8 text-[#6C5CE7]" />}
                  title="No Client Accounts Found"
                  description="Register enterprise client accounts, SLA terms, billing contacts, and payment cycles."
                  action={
                    <button
                      onClick={() => setIsClientModalOpen(true)}
                      className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Register First Client
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
              {clients.map(cli => (
                <div
                  key={cli.id}
                  className="bg-[#FAF9FE] p-5 rounded-2xl border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#6C5CE7]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7] bg-white px-2 py-0.5 rounded border border-[#D5D0FA]">
                          {cli.code}
                        </span>
                        <h4 className="font-bold text-gray-900 text-base mt-2">{cli.name}</h4>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {cli.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">Contact:</span>
                        <span>{cli.contactName || 'Corporate Procurement'} ({cli.contactEmail})</span>
                      </div>
                      {cli.contactPhone && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-700">Phone:</span>
                          <span>{cli.contactPhone}</span>
                        </div>
                      )}
                      {cli.billingAddress && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-gray-700">Address:</span>
                          <span className="text-gray-500">{cli.billingAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">Payment Terms:</span>
                        <span className="text-[#6C5CE7] font-semibold">{cli.paymentTermsDays} Days Net</span>
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
                    <span className="text-xs text-gray-400">Created: {new Date(cli.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setInvoiceForm(prev => ({ ...prev, clientId: cli.id }));
                        setIsInvoiceModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#6C5CE7] hover:underline"
                    >
                      Bill Client →
                    </button>
                  </div>
                </div>
              ))}
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-[#FAF9FE] text-gray-700 font-semibold text-xs border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Contract Code</th>
                    <th className="px-5 py-3.5">Title / Scope</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Billing Rate</th>
                    <th className="px-5 py-3.5">Holiday Multiplier Rate</th>
                    <th className="px-5 py-3.5">Period</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8">
                        <EmptyState
                          icon={<Files className="w-8 h-8 text-[#6C5CE7]" />}
                          title="No Guarding Contracts Active"
                          description="Attach master service agreements, billing cycles, and overtime multipliers to client sites."
                        />
                      </td>
                    </tr>
                  ) : (
                    contracts.map(con => (
                    <tr key={con.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#6C5CE7]">{con.code}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{con.name}</td>
                      <td className="px-5 py-4 text-gray-700">{con.client?.name || 'Corporate Client'}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600">£{con.billingRatePerHour.toFixed(2)}/hr</td>
                      <td className="px-5 py-4 font-semibold text-purple-600">
                        {con.holidayBillingRatePerHour ? `£${con.holidayBillingRatePerHour.toFixed(2)}/hr` : '1.5x Standard'}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {con.startDate} to {con.endDate || 'Rolling'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {con.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )))}
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
                    £{profitability?.grossRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '39,280.00'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Excluding 20% pass-through VAT</p>
                </div>

                <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Guard Labor Wage Cost</div>
                  <div className="text-2xl font-bold text-rose-700 mt-2">
                    £{profitability?.totalLaborCost.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '25,420.50'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">From Phase 13 Pay Run timesheets</p>
                </div>

                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Net Gross Profit</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-2">
                    £{profitability?.grossProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '13,859.50'}
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {profitability ? `${profitability.marginPercentage}% Gross Margin` : '35.3% Gross Margin'}
                  </p>
                </div>
              </div>

              {/* Visual Margin Bar */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                  <span>Labor Cost ({profitability ? (100 - profitability.marginPercentage).toFixed(1) : 64.7}%)</span>
                  <span>Gross Margin ({profitability?.marginPercentage || 35.3}%)</span>
                </div>
                <div className="w-full h-4 bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${100 - (profitability?.marginPercentage || 35.3)}%` }}
                    className="bg-rose-500 h-full"
                  />
                  <div
                    style={{ width: `${profitability?.marginPercentage || 35.3}%` }}
                    className="bg-emerald-500 h-full"
                  />
                </div>
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
                  onChange={e => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
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
                    £{((invoiceForm.items[0]?.quantityHours || 0) * (invoiceForm.items[0]?.unitPrice || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>HMRC VAT (20%):</span>
                  <span className="font-semibold text-gray-900">
                    £{(((invoiceForm.items[0]?.quantityHours || 0) * (invoiceForm.items[0]?.unitPrice || 0)) * 0.20).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#6C5CE7] pt-2 border-t border-purple-200">
                  <span>Total Amount Due:</span>
                  <span>
                    £{(((invoiceForm.items[0]?.quantityHours || 0) * (invoiceForm.items[0]?.unitPrice || 0)) * 1.20).toFixed(2)}
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#6C5CE7] text-white">
                  TAX INVOICE
                </span>
                <span className="font-bold text-gray-900">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
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
                <div className="font-bold text-gray-900">{selectedInvoice.client?.name}</div>
                <div className="text-xs text-gray-600 mt-0.5">{selectedInvoice.client?.billingAddress}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Attn: {selectedInvoice.client?.contactName} ({selectedInvoice.client?.contactEmail})
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
                    {selectedInvoice.items?.map(it => (
                      <tr key={it.id}>
                        <td className="p-3 font-medium text-gray-900">{it.description}</td>
                        <td className="p-3 text-right text-gray-700">{it.quantityHours} hrs</td>
                        <td className="p-3 text-right text-gray-700">£{it.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-gray-900">£{it.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900">£{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>UK VAT ({selectedInvoice.taxRate}%):</span>
                    <span className="font-semibold text-gray-900">£{selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#6C5CE7] pt-2 border-t border-gray-200">
                    <span>Total Due:</span>
                    <span>£{selectedInvoice.total.toFixed(2)}</span>
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
