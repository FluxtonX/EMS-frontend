import { getAuthHeaders } from './authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'company' | 'employee';
  sender_id?: string;
  sender_name: string;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface ChatConversation {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  employee_number: string;
  employee_email: string;
  employee_phone?: string;
  employee_role?: string;
  site_name?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count?: number;
  created_at: string;
}

function normalizeConversation(c: any): ChatConversation {
  if (!c) return c;
  const emp = c.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName}`.trim()
    : c.employee_name || 'Officer';

  return {
    id: c.id,
    company_id: c.companyId || c.company_id || '',
    employee_id: c.employeeId || c.employee_id || emp.id || '',
    employee_name: empName,
    employee_number: emp.employeeNumber || c.employee_number || 'EMP',
    employee_email: emp.email || c.employee_email || '',
    employee_phone: emp.phone || c.employee_phone || '',
    employee_role: emp.employmentStatus ? `${emp.employmentStatus.toUpperCase()} Officer` : c.employee_role || 'Security Officer',
    site_name: emp.currentSiteName || c.site_name || '',
    last_message_at: c.lastMessageAt || c.updatedAt || c.created_at || c.createdAt || new Date().toISOString(),
    last_message_preview: c.lastMessagePreview || c.last_message_preview || 'No messages yet',
    unread_count: typeof c.unreadCount === 'number' ? c.unreadCount : c.unread_count || 0,
    created_at: c.createdAt || c.created_at || new Date().toISOString(),
  };
}

function normalizeMessage(m: any): ChatMessage {
  if (!m) return m;
  const senderType = (m.senderRole || m.sender_type || 'company').toLowerCase();
  return {
    id: m.id,
    conversation_id: m.conversationId || m.conversation_id || '',
    sender_type: senderType === 'employee' ? 'employee' : 'company',
    sender_id: m.senderId || m.sender_id || '',
    sender_name: m.senderName || m.sender_name || 'Staff',
    text: m.content || m.text || '',
    status: m.isRead ? 'read' : 'sent',
    created_at: m.createdAt || m.created_at || new Date().toISOString(),
  };
}

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const rawList = Array.isArray(json) ? json : json.data || [];
  return rawList.map(normalizeConversation);
}

export async function fetchChatConversationById(id: string): Promise<ChatConversation | null> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  const raw = json.data || json;
  return raw ? normalizeConversation(raw) : null;
}

export async function fetchChatConversationByEmployee(employeeId: string): Promise<ChatConversation | null> {
  // Try GET /chat/by-employee/:employeeId
  let res = await fetch(`${API_BASE_URL}/chat/by-employee/${employeeId}`, {
    headers: getAuthHeaders(),
  });

  // Fallback to POST /chat/conversations
  if (!res.ok) {
    res = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId }),
    });
  }

  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  const raw = json.data || json;
  return raw ? normalizeConversation(raw) : null;
}

export async function fetchChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const rawList = Array.isArray(json) ? json : json.data || [];
  return rawList.map(normalizeMessage);
}

export async function sendChatMessage(conversationId: string, text: string): Promise<ChatMessage | null> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content: text, text }),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  const raw = json.data || json;
  return raw ? normalizeMessage(raw) : null;
}

export async function fetchUnreadChatCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/unread-count`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return 0;
    const json = await res.json().catch(() => ({ unreadCount: 0 }));
    return json.data?.unreadCount ?? json.unreadCount ?? 0;
  } catch {
    return 0;
  }
}
