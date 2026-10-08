'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-white rounded-2xl border border-[#E5E3F2] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto mx-auto',
          maxWidthMap[maxWidth]
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-5 py-4 border-b border-[#F0EEF8] shrink-0 bg-white">
            <div>
              {title && (
                <h3 id="modal-title" className="text-base font-bold text-[#171A2B]">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="mt-0.5 text-xs text-[#687086]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF] transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#F0EEF8] bg-[#F5F3FF] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
