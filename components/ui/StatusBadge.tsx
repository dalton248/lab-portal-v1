import React from 'react';
import { CaseStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: CaseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    submitted: 'bg-slate-100 text-slate-800 border-slate-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    submitted: 'Submitted',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
