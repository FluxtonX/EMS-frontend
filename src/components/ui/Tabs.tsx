'use client';

import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  activeTab,
  onChange,
  children,
  className,
}: {
  activeTab: string;
  onChange: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: onChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center space-x-1 border-b border-[#E5E3F2] mb-4', className)}
    >
      {children}
    </div>
  );
}

export function TabTrigger({
  value,
  children,
  badge,
  className,
}: {
  value: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be used inside Tabs');
  const isActive = context.activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer outline-none select-none',
        isActive
          ? 'border-[#6C5CE7] text-[#6C5CE7]'
          : 'border-transparent text-[#687086] hover:text-[#171A2B] hover:border-[#D5D0FA]',
        className
      )}
    >
      {children}
      {badge && <span className="ml-1">{badge}</span>}
    </button>
  );
}

export function TabContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent must be used inside Tabs');
  if (context.activeTab !== value) return null;

  return (
    <div role="tabpanel" className={cn('focus-visible:outline-none', className)}>
      {children}
    </div>
  );
}
