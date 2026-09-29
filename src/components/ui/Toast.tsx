'use client';

import React from 'react';
import { useToastStore, type ToastType } from '@/lib/toastStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />,
  info: <Info className="h-4 w-4 text-[#0284C7] shrink-0" />,
};

const borderMap: Record<ToastType, string> = {
  success: 'border-l-4 border-l-[#16A34A]',
  warning: 'border-l-4 border-l-[#D97706]',
  error: 'border-l-4 border-l-[#DC2626]',
  info: 'border-l-4 border-l-[#0284C7]',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white rounded border border-[#E2E8F0] shadow-lg animate-in slide-in-from-bottom-2 duration-150',
            borderMap[t.type]
          )}
        >
          <div className="flex items-center gap-2.5">
            {iconMap[t.type]}
            <p className="text-xs font-medium text-[#0F172A]">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
