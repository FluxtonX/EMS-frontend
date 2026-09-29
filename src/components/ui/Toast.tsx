'use client';

import React from 'react';
import { useToastStore, type ToastType } from '@/lib/toastStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-[#18B887] shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-[#F4A261] shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-[#EF6B73] shrink-0" />,
  info: <Info className="h-4 w-4 text-[#6C5CE7] shrink-0" />,
};

const borderMap: Record<ToastType, string> = {
  success: 'border-l-4 border-l-[#18B887]',
  warning: 'border-l-4 border-l-[#F4A261]',
  error: 'border-l-4 border-l-[#EF6B73]',
  info: 'border-l-4 border-l-[#6C5CE7]',
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
            'pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white rounded border border-[#E5E3F2] shadow-lg animate-in slide-in-from-bottom-2 duration-150',
            borderMap[t.type]
          )}
        >
          <div className="flex items-center gap-2.5">
            {iconMap[t.type]}
            <p className="text-xs font-medium text-[#171A2B]">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="p-1 rounded text-[#9096A9] hover:text-[#171A2B] hover:bg-[#F5F3FF] transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
