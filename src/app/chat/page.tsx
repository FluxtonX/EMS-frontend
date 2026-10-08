'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  fetchChatConversations,
  fetchChatConversationByEmployee,
  fetchChatMessages,
  sendChatMessage,
  ChatConversation,
  ChatMessage,
} from '@/lib/api/chat';
import {
  Search,
  Send,
  MessageSquare,
  Shield,
  Building2,
  Clock,
  CheckCheck,
  Check,
  Phone,
  Mail,
  User,
  X,
} from 'lucide-react';

const avatarGradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-cyan-400 to-blue-600',
];

const getAvatarGradient = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
};

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase() || 'EM';
};

import { useWorkforceStore } from '@/lib/stores/workforceStore';
import { UserPlus } from 'lucide-react';

function CompanyChatContent() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const targetEmployeeId = searchParams.get('employeeId');
  const queryClient = useQueryClient();

  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { employees: storeEmployees, fetchEmployees: syncEmployees } = useWorkforceStore();

  useEffect(() => {
    syncEmployees();
  }, [syncEmployees]);

  // Fetch Team Members for search
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-chat'],
    queryFn: async () => {
      const token = session?.accessToken;
      if (!token) return [];
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const payload = data.data !== undefined ? data.data : data;
      return (payload.members || []) as Array<{ id: string; name: string; email: string; role: string }>;
    },
    enabled: !!session?.accessToken,
  });

  // Poll conversations every 4 seconds
  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchChatConversations,
    refetchInterval: 4000,
  });

  // Start chat with an employee or team member
  const handleStartEmployeeChat = async (empId: string) => {
    setIsStartingChat(true);
    try {
      const conv = await fetchChatConversationByEmployee(empId);
      if (conv) {
        queryClient.setQueryData(['chat-conversations'], (old: ChatConversation[] = []) => {
          const exists = old.some((c) => c.id === conv.id);
          if (exists) return old.map((c) => (c.id === conv.id ? conv : c));
          return [conv, ...old];
        });
        setSelectedConversationId(conv.id);
        setSearchQuery('');
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  // If query param employeeId is provided, resolve or create that conversation
  useEffect(() => {
    if (targetEmployeeId && session) {
      handleStartEmployeeChat(targetEmployeeId);
    }
  }, [targetEmployeeId, session]);

  // Set default selected conversation
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0 && !targetEmployeeId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, targetEmployeeId]);

  const activeConversation = conversations.find((c) => c.id === selectedConversationId);

  // Poll active conversation messages every 2.5 seconds
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedConversationId],
    queryFn: () => (selectedConversationId ? fetchChatMessages(selectedConversationId) : []),
    enabled: !!selectedConversationId,
    refetchInterval: 2500,
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedConversationId || !text.trim()) return null;
      return sendChatMessage(selectedConversationId, text);
    },
    onSuccess: (newMsg) => {
      if (newMsg) {
        setInputText('');
        queryClient.setQueryData(['chat-messages', selectedConversationId], (old: ChatMessage[] = []) => [
          ...old,
          newMsg,
        ]);
        queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConversationId] });
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
      }
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sendMutation.isPending) return;
    sendMutation.mutate(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const q = searchQuery.toLowerCase().trim();

  // Filter existing active conversations
  const filteredConversations = conversations.filter((c) => {
    if (!q) return true;
    return (
      c.employee_name?.toLowerCase().includes(q) ||
      c.employee_number?.toLowerCase().includes(q) ||
      c.site_name?.toLowerCase().includes(q)
    );
  });

  // Find registered employees & team members who don't have an active conversation listed yet
  const existingEmpIds = new Set(conversations.map((c) => c.employee_id));
  const unstartedParticipants = React.useMemo(() => {
    const list: Array<{ id: string; name: string; role: string; subtext: string; isTeamMember?: boolean }> = [];

    // 1. Registered Employees
    for (const emp of storeEmployees) {
      if (existingEmpIds.has(emp.id)) continue;
      const name = `${emp.firstName} ${emp.lastName}`;
      const role = emp.currentAssignment?.role || 'Security Officer';
      const subtext = `#${emp.employeeNumber}`;
      if (!q || name.toLowerCase().includes(q) || emp.employeeNumber.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)) {
        list.push({ id: emp.id, name, role, subtext });
      }
    }

    // 2. Registered Team Members (Manager, Operator, Owner, Admin)
    for (const tm of teamMembers) {
      if (existingEmpIds.has(tm.id)) continue;
      const name = tm.name;
      const role = tm.role === 'Supervisor' ? 'Operator' : tm.role;
      const subtext = tm.email;
      if (q && (name.toLowerCase().includes(q) || tm.email.toLowerCase().includes(q) || role.toLowerCase().includes(q))) {
        list.push({ id: tm.id, name, role: `Team • ${role}`, subtext, isTeamMember: true });
      }
    }

    return list;
  }, [conversations, storeEmployees, teamMembers, q]);

  const quickReplies = [
    'Shift confirmed for today.',
    'Please report to site control.',
    'Acknowledged. Stay safe.',
    'All relief cover is en route.',
  ];

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Workforce Communications Hub
              </h1>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDE9FE] text-[#6C5CE7]">
                <MessageSquare className="h-3 w-3" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure, real-time bidirectional messaging between company operations and deployed officers.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Gateway Active
            </span>
          </div>
        </div>

        {/* Main Glass Chat Box */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/85 shadow-[0_12px_40px_-8px_rgba(22,34,66,0.06)] overflow-hidden">
          {/* Left Column: Officer Conversation List (4 Cols) */}
          <div className="md:col-span-4 lg:col-span-4 border-r border-slate-200/70 flex flex-col bg-white/40">
            {/* Search filter */}
            <div className="p-3.5 border-b border-slate-200/70">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search registered officers, staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/90 border border-slate-200/70 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] outline-none transition-all"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 p-2 space-y-1">
              {isConversationsLoading && conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading directory...</div>
              ) : filteredConversations.length === 0 && unstartedParticipants.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  {searchQuery ? 'No matching registered officers or staff found.' : 'No active conversations found.'}
                </div>
              ) : (
                <>
                  {filteredConversations.map((conv) => {
                    const isSelected = conv.id === selectedConversationId;
                    const grad = getAvatarGradient(conv.employee_name || conv.id);
                    const initials = getInitials(conv.employee_name || 'Officer');

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA] shadow-[inset_0_2px_4px_rgba(108,92,231,0.14)] font-semibold'
                            : 'hover:bg-[#F5F3FF]/70'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr ${grad} text-white font-bold text-xs shadow-xs ring-2 ring-white`}
                          >
                            {initials}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {conv.employee_name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {conv.employee_role || 'Security Officer'} • {conv.site_name || 'Static Site'}
                          </p>

                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                              {conv.last_message_preview || 'Tap to chat with officer'}
                            </p>
                            {conv.unread_count && conv.unread_count > 0 ? (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#6C5CE7] px-1 text-[9px] font-bold text-white shadow-xs">
                                {conv.unread_count}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Registered Officers & Team Members ready to start chat */}
                  {unstartedParticipants.length > 0 && (
                    <div className="pt-3 pb-1">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Registered Team & Officers
                      </p>
                      {unstartedParticipants.map((participant) => {
                        const grad = getAvatarGradient(participant.name);
                        const initials = getInitials(participant.name);

                        return (
                          <button
                            key={participant.id}
                            onClick={() => handleStartEmployeeChat(participant.id)}
                            disabled={isStartingChat}
                            className="w-full text-left p-2.5 rounded-2xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-100 transition-all flex items-center gap-3 select-none"
                          >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${grad} text-white font-bold text-xs shrink-0`}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{participant.name}</h5>
                              <p className="text-[10px] text-slate-500 truncate">
                                {participant.role} • {participant.subtext}
                              </p>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#6C5CE7] bg-[#EDE9FE] px-2 py-0.5 rounded-full shrink-0">
                              <UserPlus className="h-3 w-3" />
                              Start Chat
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column: Active Message Thread & Input (8 Cols) */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col h-full bg-white/70">
            {activeConversation ? (
              <>
                {/* Active Header */}
                <div className="p-4 border-b border-slate-200/70 flex items-center justify-between bg-white/60 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                        activeConversation.employee_name
                      )} text-white font-bold text-sm shadow-xs ring-2 ring-white`}
                    >
                      {getInitials(activeConversation.employee_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {activeConversation.employee_name}
                        </h3>
                        <span className="font-mono text-[10px] text-slate-400">
                          #{activeConversation.employee_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span>{activeConversation.site_name || 'Deployed Post'}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeConversation.employee_phone && (
                      <a
                        href={`tel:${activeConversation.employee_phone}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#6C5CE7] hover:bg-[#F5F3FF] transition-colors"
                        title="Call officer phone"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {activeConversation.employee_email && (
                      <a
                        href={`mailto:${activeConversation.employee_email}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#6C5CE7] hover:bg-[#F5F3FF] transition-colors"
                        title="Send formal email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Message Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
                  {isMessagesLoading && messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading conversation...</div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                     Start Conversation here.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isCompany = msg.sender_type === 'company';
                      const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isCompany ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 px-1 mb-1 font-medium">
                            {isCompany ? 'You (Operations Dispatch)' : activeConversation.employee_name}
                          </span>
                          <div
                            className={`max-w-[78%] sm:max-w-[68%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                              isCompany
                                ? 'bg-gradient-to-r from-[#6C5CE7] to-[#5A4ACD] text-white rounded-tr-xs shadow-[#6C5CE7]/20'
                                : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                            }`}
                          >
                            <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                                isCompany ? 'text-purple-100' : 'text-slate-400'
                              }`}
                            >
                              <span>{timeStr}</span>
                              {isCompany && (
                                <CheckCheck className="h-3 w-3 text-purple-200 stroke-[2.2]" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick replies bar */}
                {showQuickReplies && quickReplies.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-200/60 bg-white/70 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                        Quick Suggestions:
                      </span>
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => setInputText(reply)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-[#EDE9FE] hover:text-[#6C5CE7] hover:border-[#D5D0FA] text-slate-600 border border-slate-200/60 whitespace-nowrap transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowQuickReplies(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 shrink-0 ml-2"
                      title="Dismiss quick suggestions"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Input bar */}
                <form
                  onSubmit={handleSend}
                  className="p-3.5 border-t border-slate-200/70 bg-white/90 flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    placeholder={`Message ${activeConversation.employee_name}... (Press Enter to send)`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-100/90 border border-slate-200/80 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#5A4ACD] text-white shadow-md shadow-[#6C5CE7]/25 hover:from-[#5A4ACD] hover:to-[#4A3BB0] disabled:opacity-50 transition-all shrink-0"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="h-12 w-12 text-slate-300 stroke-1 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Select an officer</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Choose an officer from the directory on the left or click &quot;Chat&quot; on any employee card in the Employees directory to start real-time messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function CompanyChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
            <p className="text-xs text-[#687086] font-medium">Opening secure comms…</p>
          </div>
        </div>
      }
    >
      <CompanyChatContent />
    </Suspense>
  );
}
