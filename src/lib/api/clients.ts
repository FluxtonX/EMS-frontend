import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    try {
      const session = localStorage.getItem('workforce_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.accessToken) headers['Authorization'] = `Bearer ${parsed.accessToken}`;
      }
    } catch { /* noop */ }
  }
  return headers;
}

export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface Client {
  id: string;
  companyId: string;
  name: string;
  code: string;
  contactName?: string;
  contactEmail: string;
  contactPhone?: string;
  billingAddress?: string;
  paymentTermsDays: number;
  vatNumber?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  companyId: string;
  clientId: string;
  siteId?: string;
  name: string;
  code: string;
  startDate: string;
  endDate?: string;
  billingRatePerHour: number;
  holidayBillingRatePerHour?: number;
  currency: string;
  status: ContractStatus;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantityHours: number;
  unitPrice: number;
  amount: number;
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
  totalLaborCost: number;
  grossProfit: number;
  marginPercentage: number;
  invoiceCount: number;
  currency: string;
}

export interface CreateClientDto {
  name: string;
  code?: string;
  contactName?: string;
  contactEmail: string;
  contactPhone?: string;
  billingAddress?: string;
  paymentTermsDays?: number;
  vatNumber?: string;
  notes?: string;
}

export interface CreateContractDto {
  clientId: string;
  siteId?: string;
  name: string;
  code?: string;
  startDate: string;
  endDate?: string;
  billingRatePerHour: number;
  holidayBillingRatePerHour?: number;
  currency?: string;
  terms?: string;
}

export interface CreateInvoiceItemDto {
  description: string;
  quantityHours: number;
  unitPrice: number;
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
      return (data.data || data) as Client[];
    }, { ttlMs: 30 * 1000 });
  },

  async createClient(dto: CreateClientDto): Promise<Client> {
    apiCache.invalidate('clients');
    const res = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Failed to create client (${res.status})`);
    }
    const data = await res.json();
    apiCache.invalidate('clients');
    return (data.data || data) as Client;
  },

  async updateClient(id: string, dto: Partial<CreateClientDto>): Promise<Client> {
    apiCache.invalidate('clients');
    const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
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
      return (data.data || data) as Contract[];
    }, { ttlMs: 30 * 1000 });
  },

  async createContract(dto: CreateContractDto): Promise<Contract> {
    apiCache.invalidate('contracts');
    apiCache.invalidate('clients');
    const res = await fetch(`${API_BASE_URL}/clients/contracts/new`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
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
      return (data.data || data) as Invoice[];
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
      return (data.data || data) as Invoice;
    }, { ttlMs: 30 * 1000 });
  },

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    apiCache.invalidate('invoices');
    apiCache.invalidate('profitability');
    const res = await fetch(`${API_BASE_URL}/clients/invoices/new`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
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
      const data = await res.json();
      return (data.data || data) as ProfitabilitySummary;
    }, { ttlMs: 30 * 1000 });
  },
};
