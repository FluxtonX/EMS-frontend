import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

import { getAuthHeaders } from './authHeaders';

export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface Client {
  id: string;
  companyId: string;
  name: string;
  code: string;
  companyNumber?: string;
  contactName?: string;
  contactEmail: string;
  billingEmail?: string;
  contactPhone?: string;
  phone?: string;
  billingAddress?: string;
  address?: string;
  paymentTermsDays: number;
  vatNumber?: string;
  status: ClientStatus;
  notes?: string;
  activeContractsCount?: number;
  totalInvoicedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  companyId: string;
  clientId: string;
  siteId?: string;
  name: string;
  title?: string;
  code: string;
  contractNumber?: string;
  startDate: string;
  endDate?: string;
  billingRatePerHour: number;
  hourlyBillingRate?: number;
  holidayBillingRatePerHour?: number;
  billingCycle?: 'weekly' | 'bi_weekly' | 'monthly';
  currency: string;
  status: ContractStatus;
  terms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  site?: { id: string; name: string; code?: string };
}

export interface ContractUnbilledHours {
  contractId: string;
  contractTitle: string;
  contractNumber?: string;
  siteId?: string;
  siteName: string;
  hourlyBillingRate: number;
  totalHours: number;
  calculatedSubtotal: number;
  suggestedLineItems: Array<{
    description: string;
    quantityHours: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantityHours: number;
  hours?: number;
  unitPrice: number;
  rate?: number;
  amount: number;
  totalAmount?: number;
  siteId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  clientId: string;
  contractId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  totalAmount?: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface ProfitabilitySummary {
  periodStart: string;
  periodEnd: string;
  grossRevenue: number;
  totalRevenue?: number;
  totalLaborCost: number;
  grossProfit: number;
  marginPercentage: number;
  invoiceCount: number;
  currency: string;
  activeContractsCount?: number;
  activeClientsCount?: number;
}

export interface CreateClientDto {
  name: string;
  code?: string;
  companyNumber?: string;
  contactName?: string;
  contactEmail: string;
  billingEmail?: string;
  contactPhone?: string;
  phone?: string;
  billingAddress?: string;
  address?: string;
  paymentTermsDays?: number;
  vatNumber?: string;
  notes?: string;
}

export interface CreateContractDto {
  clientId: string;
  siteId?: string;
  name?: string;
  title?: string;
  code?: string;
  contractNumber?: string;
  startDate: string;
  endDate?: string;
  billingRatePerHour?: number;
  hourlyBillingRate?: number;
  holidayBillingRatePerHour?: number;
  billingCycle?: 'weekly' | 'bi_weekly' | 'monthly';
  currency?: string;
  terms?: string;
  notes?: string;
}

export interface CreateInvoiceItemDto {
  description: string;
  quantityHours?: number;
  hours?: number;
  unitPrice?: number;
  rate?: number;
  siteId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface CreateInvoiceDto {
  clientId: string;
  contractId?: string;
  issueDate: string;
  dueDate?: string;
  taxRate?: number;
  currency?: string;
  notes?: string;
  items: CreateInvoiceItemDto[];
}


export const clientsApi = {
  // --- Clients ---
  async getClients(params?: { status?: string; search?: string }): Promise<Client[]> {
    const cacheKey = `clients_list_${params?.status || 'all'}_${params?.search || ''}`;
    return apiCache.withCache(cacheKey, async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.append('status', params.status);
      if (params?.search) qs.append('search', params.search);
      const res = await fetch(`${API_BASE_URL}/clients?${qs.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch clients (${res.status})`);
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.data || []) as any[];
      return list.map((c) => ({
        ...c,
        code: c.code || c.companyNumber || (c.name ? c.name.slice(0, 4).toUpperCase() : 'CLNT'),
        contactName: c.contactName || c.name,
        contactEmail: c.contactEmail || c.billingEmail || '',
        contactPhone: c.contactPhone || c.phone || '',
        billingAddress: c.billingAddress || c.address || '',
        paymentTermsDays: c.paymentTermsDays ?? 30,
        status: c.status || 'active',
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
      })) as Client[];
    }, { ttlMs: 30 * 1000 });
  },

  async createClient(dto: CreateClientDto): Promise<Client> {
    apiCache.invalidate('clients');
    const payload = {
      name: dto.name.trim(),
      billingEmail: (dto.contactEmail || dto.billingEmail || '').trim(),
      companyNumber: dto.code || dto.companyNumber,
      vatNumber: dto.vatNumber,
      phone: dto.contactPhone || dto.phone,
      address: dto.billingAddress || dto.address,
      paymentTermsDays: dto.paymentTermsDays || 30,
      notes: dto.notes,
    };
    const res = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Failed to create client (${res.status})`);
    }
    const data = await res.json();
    apiCache.invalidate('clients');
    const c = data.data || data;
    return {
      ...c,
      code: c.code || c.companyNumber || (c.name ? c.name.slice(0, 4).toUpperCase() : 'CLNT'),
      contactName: c.contactName || c.name,
      contactEmail: c.contactEmail || c.billingEmail || '',
      contactPhone: c.contactPhone || c.phone || '',
      billingAddress: c.billingAddress || c.address || '',
    } as Client;
  },

  async updateClient(id: string, dto: Partial<CreateClientDto>): Promise<Client> {
    apiCache.invalidate('clients');
    const payload = {
      ...(dto.name && { name: dto.name.trim() }),
      ...((dto.contactEmail || dto.billingEmail) && { billingEmail: (dto.contactEmail || dto.billingEmail)!.trim() }),
      ...((dto.code || dto.companyNumber) && { companyNumber: dto.code || dto.companyNumber }),
      ...(dto.vatNumber !== undefined && { vatNumber: dto.vatNumber }),
      ...((dto.contactPhone || dto.phone) && { phone: dto.contactPhone || dto.phone }),
      ...((dto.billingAddress || dto.address) && { address: dto.billingAddress || dto.address }),
      ...(dto.paymentTermsDays !== undefined && { paymentTermsDays: dto.paymentTermsDays }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };
    const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || 'Failed to update client.');
    }
    const data = await res.json();
    apiCache.invalidate('clients');
    return (data.data || data) as Client;
  },

  async deleteClient(id: string): Promise<{ success: boolean; message: string }> {
    apiCache.invalidate('clients');
    const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || 'Failed to delete client.');
    }
    const data = await res.json();
    apiCache.invalidate('clients');
    return data;
  },

  // --- Contracts ---
  async getContracts(params?: { clientId?: string; status?: string }): Promise<Contract[]> {
    const cacheKey = `contracts_list_${params?.clientId || 'all'}_${params?.status || 'all'}`;
    return apiCache.withCache(cacheKey, async () => {
      const qs = new URLSearchParams();
      if (params?.clientId) qs.append('clientId', params.clientId);
      if (params?.status) qs.append('status', params.status);
      const res = await fetch(`${API_BASE_URL}/clients/contracts/list?${qs.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch contracts (${res.status})`);
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.data || []) as any[];
      return list.map((con) => ({
        ...con,
        code: con.code || con.contractNumber || 'CON-' + con.id?.slice(0, 4),
        contractNumber: con.contractNumber || con.code || 'CON-' + con.id?.slice(0, 4),
        name: con.name || con.title || 'Guarding Contract',
        title: con.title || con.name || 'Guarding Contract',
        billingRatePerHour: Number(con.billingRatePerHour ?? con.hourlyBillingRate ?? 0),
        hourlyBillingRate: Number(con.hourlyBillingRate ?? con.billingRatePerHour ?? 0),
        holidayBillingRatePerHour: con.holidayBillingRatePerHour
          ? Number(con.holidayBillingRatePerHour)
          : Number((con.hourlyBillingRate ?? con.billingRatePerHour ?? 0) * 1.5),
        status: con.status || 'active',
        startDate: con.startDate || '',
        endDate: con.endDate || '',
        currency: con.currency || 'GBP',
      })) as Contract[];
    }, { ttlMs: 30 * 1000 });
  },

  async createContract(dto: CreateContractDto): Promise<Contract> {
    apiCache.invalidate('contracts');
    apiCache.invalidate('clients');
    const payload = {
      clientId: dto.clientId,
      siteId: dto.siteId,
      title: dto.title || dto.name || 'Guarding Service Agreement',
      contractNumber: dto.contractNumber || dto.code || `CNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      startDate: dto.startDate,
      endDate: dto.endDate,
      billingCycle: dto.billingCycle || 'monthly',
      hourlyBillingRate: Number(dto.hourlyBillingRate ?? dto.billingRatePerHour ?? 24.50),
      notes: dto.notes || dto.terms,
    };
    const res = await fetch(`${API_BASE_URL}/clients/contracts/new`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Failed to create contract (${res.status})`);
    }
    const data = await res.json();
    apiCache.invalidate('contracts');
    return (data.data || data) as Contract;
  },

  async updateContract(id: string, dto: Partial<CreateContractDto>): Promise<Contract> {
    apiCache.invalidate('contracts');
    const res = await fetch(`${API_BASE_URL}/clients/contracts/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || 'Failed to update contract.');
    }
    const data = await res.json();
    apiCache.invalidate('contracts');
    return (data.data || data) as Contract;
  },

  async deleteContract(id: string): Promise<{ success: boolean; message: string }> {
    apiCache.invalidate('contracts');
    const res = await fetch(`${API_BASE_URL}/clients/contracts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || 'Failed to delete contract.');
    }
    const data = await res.json();
    apiCache.invalidate('contracts');
    return data;
  },

  async getContractUnbilledHours(contractId: string, startDate?: string, endDate?: string): Promise<ContractUnbilledHours> {
    const qs = new URLSearchParams();
    if (startDate) qs.append('startDate', startDate);
    if (endDate) qs.append('endDate', endDate);
    const res = await fetch(`${API_BASE_URL}/clients/contracts/${contractId}/unbilled-hours?${qs.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || 'Failed to fetch unbilled hours.');
    }
    const data = await res.json();
    return (data.data || data) as ContractUnbilledHours;
  },

  // --- Invoices ---
  async getInvoices(params?: { clientId?: string; status?: string }): Promise<Invoice[]> {
    const cacheKey = `invoices_list_${params?.clientId || 'all'}_${params?.status || 'all'}`;
    return apiCache.withCache(cacheKey, async () => {
      const qs = new URLSearchParams();
      if (params?.clientId) qs.append('clientId', params.clientId);
      if (params?.status) qs.append('status', params.status);
      const res = await fetch(`${API_BASE_URL}/clients/invoices/list?${qs.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch invoices (${res.status})`);
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.data || []) as any[];
      return list.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal || 0),
        taxRate: Number(inv.taxRate || 20),
        taxAmount: Number(inv.taxAmount || 0),
        total: Number(inv.total ?? inv.totalAmount ?? 0),
        totalAmount: Number(inv.totalAmount ?? inv.total ?? 0),
        status: inv.status || 'draft',
        client: inv.client
          ? {
              ...inv.client,
              code: inv.client.code || inv.client.companyNumber || (inv.client.name ? inv.client.name.slice(0, 4).toUpperCase() : 'CLNT'),
              name: inv.client.name || 'Corporate Client',
              contactEmail: inv.client.contactEmail || inv.client.billingEmail || '',
            }
          : undefined,
        items: (inv.items || []).map((it: any) => ({
          ...it,
          quantityHours: Number(it.quantityHours ?? it.hours ?? 0),
          hours: Number(it.hours ?? it.quantityHours ?? 0),
          unitPrice: Number(it.unitPrice ?? it.rate ?? 0),
          rate: Number(it.rate ?? it.unitPrice ?? 0),
          amount: Number(it.amount ?? it.totalAmount ?? 0),
          totalAmount: Number(it.totalAmount ?? it.amount ?? 0),
        })),
      })) as Invoice[];
    }, { ttlMs: 30 * 1000 });
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const cacheKey = `invoice_${id}`;
    return apiCache.withCache(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/clients/invoices/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch invoice (${res.status})`);
      }
      const data = await res.json();
      const inv = data.data || data;
      return {
        ...inv,
        subtotal: Number(inv.subtotal || 0),
        taxRate: Number(inv.taxRate || 20),
        taxAmount: Number(inv.taxAmount || 0),
        total: Number(inv.total ?? inv.totalAmount ?? 0),
        totalAmount: Number(inv.totalAmount ?? inv.total ?? 0),
        status: inv.status || 'draft',
        items: (inv.items || []).map((it: any) => ({
          ...it,
          quantityHours: Number(it.quantityHours ?? it.hours ?? 0),
          hours: Number(it.hours ?? it.quantityHours ?? 0),
          unitPrice: Number(it.unitPrice ?? it.rate ?? 0),
          rate: Number(it.rate ?? it.unitPrice ?? 0),
          amount: Number(it.amount ?? it.totalAmount ?? 0),
          totalAmount: Number(it.totalAmount ?? it.amount ?? 0),
        })),
      } as Invoice;
    }, { ttlMs: 30 * 1000 });
  },

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    apiCache.invalidate('invoices');
    apiCache.invalidate('profitability');
    const payload = {
      clientId: dto.clientId,
      contractId: dto.contractId || undefined,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      taxRate: dto.taxRate ?? 20,
      currency: dto.currency || 'GBP',
      notes: dto.notes,
      items: dto.items.map((it) => ({
        description: it.description,
        hours: Number(it.hours ?? it.quantityHours ?? 1),
        rate: Number(it.rate ?? it.unitPrice ?? 24.50),
        siteId: it.siteId,
      })),
    };
    const res = await fetch(`${API_BASE_URL}/clients/invoices/new`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Failed to create invoice (${res.status})`);
    }
    const data = await res.json();
    apiCache.invalidate('invoices');
    apiCache.invalidate('profitability');
    return (data.data || data) as Invoice;
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    apiCache.invalidate('invoices');
    apiCache.invalidate('profitability');
    const res = await fetch(`${API_BASE_URL}/clients/invoices/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Failed to update invoice status (${res.status})`);
    }
    const data = await res.json();
    apiCache.invalidate('invoices');
    apiCache.invalidate('profitability');
    return (data.data || data) as Invoice;
  },

  // --- Profitability ---
  async getProfitabilitySummary(params?: { periodStart?: string; periodEnd?: string }): Promise<ProfitabilitySummary> {
    const cacheKey = `profitability_${params?.periodStart || ''}_${params?.periodEnd || ''}`;
    return apiCache.withCache(cacheKey, async () => {
      const qs = new URLSearchParams();
      if (params?.periodStart) qs.append('periodStart', params.periodStart);
      if (params?.periodEnd) qs.append('periodEnd', params.periodEnd);
      const res = await fetch(`${API_BASE_URL}/clients/profitability?${qs.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch profitability (${res.status})`);
      }
      const raw = await res.json();
      const data = raw.data || raw;
      return {
        periodStart: data.periodStart || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        periodEnd: data.periodEnd || new Date().toISOString().split('T')[0],
        grossRevenue: Number(data.grossRevenue ?? data.totalRevenue ?? 0),
        totalRevenue: Number(data.totalRevenue ?? data.grossRevenue ?? 0),
        totalLaborCost: Number(data.totalLaborCost || 0),
        grossProfit: Number(data.grossProfit || 0),
        marginPercentage: Number(data.marginPercentage || 0),
        invoiceCount: Number(data.invoiceCount || 0),
        currency: data.currency || 'GBP',
        activeContractsCount: data.activeContractsCount,
        activeClientsCount: data.activeClientsCount,
      } as ProfitabilitySummary;
    }, { ttlMs: 30 * 1000 });
  },
};

