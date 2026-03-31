'use client';

import React from 'react';
import { CaseStatus } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface StatusBadgeProps {
  status: CaseStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useLanguage();

  const styles: Record<string, string> = {
    submitted: 'bg-slate-100 text-slate-800 border-slate-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    qc: 'bg-purple-100 text-purple-800 border-purple-200',
    shipping: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${styles[status] ?? 'bg-slate-100 text-slate-800 border-slate-200'} ${sizeStyles[size]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
