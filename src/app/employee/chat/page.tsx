'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyOverview } from '@/lib/api/me';
import {
  fetchChatConversationByEmployee,
  fetchChatMessages,
  sendChatMessage,
} from '@/lib/api/chat';
import {
  Send,
  Shield,
  Building2,
  Clock,
  CheckCheck,
  Phone,
  Radio,
  X,
} from 'lucide-react';

export default function EmployeeDispatchChatPage() {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [showQuickPills, setShowQuickPills] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch current employee identity
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['my-overview'],
    queryFn: fetchMyOverview,
  });

  const employeeId = overview?.employee?.id;

  // 2. Resolve or create chat conversation with company dispatch
  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ['my-dispatch-conversation', employeeId],
    queryFn: () => (employeeId ? fetchChatConversationByEmployee(employeeId) : null),
    enabled: !!employeeId,
    refetchInterval: 10000,
  });

  const conversationId = conversation?.id;

  // 3. Poll messages in real-time every 2.5 seconds
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['my-dispatch-messages', conversationId],
    queryFn: () => (conversationId ? fetchChatMessages(conversationId) : []),
    enabled: !!conversationId,
    refetchInterval: 2500,
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!conversationId || !text.trim()) return null;
      return sendChatMessage(conversationId, text);
    },
    onSuccess: (newMsg) => {
      if (newMsg) {
        setInputText('');
        queryClient.setQueryData(['my-dispatch-messages', conversationId], (old: any = []) => [
          ...old,
          newMsg,
        ]);
        queryClient.invalidateQueries({ queryKey: ['my-dispatch-messages', conversationId] });
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

  const quickPills = [
    'On site and clocked in.',
    'Routine perimeter patrol underway.',
    'Post handover complete.',
    'Need supervisor check-in.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-8px_rgba(22,34,66,0.06)] overflow-hidden">
      {/* Dispatch Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs ring-2 ring-white">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Company Operations Control
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{overview?.assignment?.siteName || 'Assigned Client Post'}</span>
              <span>•</span>
              <span>Direct Operations Line</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            Officer #{overview?.employee?.employeeNumber || 'OFFICER'}
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/50">
        {isMessagesLoading && messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Connecting to dispatch...</div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No messages sent yet. Use the message field below to message company operations or supervisor on duty.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_type === 'employee';
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 px-1 mb-1 font-medium">
                  {isMe ? 'You' : 'Operations Dispatch'}
                </span>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-[#6C5CE7] to-[#5A4ACD] text-white rounded-tr-xs shadow-[#6C5CE7]/20'
                      : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                  }`}
                >
                  <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                      isMe ? 'text-purple-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && <CheckCheck className="h-3 w-3 text-purple-200 stroke-[2.2]" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Dispatch Pills */}
      {showQuickPills && quickPills.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200/60 bg-white/70 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Quick Suggestions:
            </span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                onClick={() => setInputText(pill)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-[#EDE9FE] hover:text-[#6C5CE7] hover:border-[#D5D0FA] text-slate-600 border border-slate-200/60 whitespace-nowrap transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowQuickPills(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 shrink-0 ml-2"
            title="Dismiss quick suggestions"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 border-t border-slate-200/70 bg-white/90 flex items-center gap-2.5"
      >
        <input
          type="text"
          placeholder="Message dispatch operations... (Press Enter to send)"
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
    </div>
  );
}
