'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Case, CaseStatus } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Calendar, User, ArrowRight, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KanbanBoardProps {
  cases: Case[];
  onStatusChange?: (id: string, newStatus: CaseStatus) => void;
}

export function KanbanBoard({ cases, onStatusChange }: KanbanBoardProps) {
  const { t, language } = useLanguage();
  const router = useRouter();

  const columns: { title: string; status: CaseStatus; color: string; next: CaseStatus | null }[] = [
    { title: t('status.submitted'),   status: 'submitted',   color: 'bg-slate-50 border-slate-100',  next: 'in_progress' },
    { title: t('status.in_progress'), status: 'in_progress', color: 'bg-blue-50 border-blue-100',    next: 'qc' },
    { title: t('status.qc'),          status: 'qc',          color: 'bg-purple-50 border-purple-100', next: 'shipping' },
    { title: t('status.shipping'),    status: 'shipping',    color: 'bg-cyan-50 border-cyan-100',     next: 'completed' },
  ];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getCasesByStatus = (status: CaseStatus) => {
    return cases.filter((c) => c.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[600px]">
      {columns.map((column) => (
        <div key={column.status} className={`flex flex-col rounded-xl border ${column.color} p-4`}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-slate-900 flex items-center">
              {column.title}
              <span className="ml-2 text-xs bg-white text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {getCasesByStatus(column.status).length}
              </span>
            </h3>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {getCasesByStatus(column.status).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200/50 rounded-xl bg-white/30">
                <p className="text-xs font-medium italic">{t('dashboard.noCasesFound')}</p>
              </div>
            ) : (
              getCasesByStatus(column.status).map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className="group hover:ring-2 hover:ring-blue-500/20 transition-all cursor-pointer shadow-sm hover:shadow-md border-slate-200"
                  onClick={() => router.push(`/cases/${caseItem.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {caseItem.caseId}
                      </span>
                      <StatusBadge status={caseItem.status} size="sm" />
                    </div>

                    <h4 className="font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {caseItem.patientName}
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <User className="h-3 w-3 mr-2 text-slate-400" />
                        <span className="truncate">{caseItem.dentistName}</span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Calendar className="h-3 w-3 mr-2 text-slate-400" />
                        <span>{formatDate(caseItem.dueDate)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="text-[10px] font-medium text-slate-400">
                        {caseItem.caseType}
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {column.next && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange?.(caseItem.id, column.next!);
                            }}
                            className="p-1.5 bg-white/80 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            title={`Move to ${column.next}`}
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
