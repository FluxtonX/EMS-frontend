const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    try {
      const session = localStorage.getItem('workforce_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.accessToken) {
          headers['Authorization'] = `Bearer ${parsed.accessToken}`;
        }
      }
    } catch {
      // Fallback
    }
  }
  return headers;
}

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

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return json.data || json || [];
}

export async function fetchChatConversationById(id: string): Promise<ChatConversation | null> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json.data || json || null;
}

export async function fetchChatConversationByEmployee(employeeId: string): Promise<ChatConversation | null> {
  const res = await fetch(`${API_BASE_URL}/chat/by-employee/${employeeId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json.data || json || null;
}

export async function fetchChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return json.data || json || [];
}

export async function sendChatMessage(conversationId: string, text: string): Promise<ChatMessage | null> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json.data || json || null;
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
