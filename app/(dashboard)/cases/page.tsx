'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { getCurrentUser, getCasesForCurrentUser, searchCases } from '@/lib/mock-data';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function CasesPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const allCases = getCasesForCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { t, language } = useLanguage();

  const statusFiltered =
    statusFilter === 'all'
      ? allCases
      : allCases.filter((c) => c.status === statusFilter);

  const filteredCases = searchCases(searchQuery, statusFiltered);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filterOptions = [
    { value: 'all', label: t('cases.filterAll') },
    { value: 'submitted', label: t('status.submitted') },
    { value: 'in_progress', label: t('status.in_progress') },
    { value: 'on_hold', label: t('status.on_hold') },
    { value: 'completed', label: t('status.completed') },
    { value: 'rejected', label: t('status.rejected') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('cases.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('cases.subtitle')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('cases.allCases')}</h2>
            {currentUser.role === 'lab_admin' && (
              <div className="w-48">
                <Select
                  options={filterOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('dashboard.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.caseId')}</TableHead>
                <TableHead>{t('table.patient')}</TableHead>
                <TableHead>{t('table.type')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.dueDate')}</TableHead>
                <TableHead>{t('table.lastUpdated')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {searchQuery || statusFilter !== 'all' ? t('cases.noFilterMatches') : t('dashboard.noCasesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((caseItem) => (
                  <TableRow
                    key={caseItem.id}
                    onClick={() => router.push(`/cases/${caseItem.id}`)}
                  >
                    <TableCell className="font-medium">{caseItem.caseId}</TableCell>
                    <TableCell>{caseItem.patientName}</TableCell>
                    <TableCell className="text-slate-500">{caseItem.caseType}</TableCell>
                    <TableCell>
                      <StatusBadge status={caseItem.status} />
                    </TableCell>
                    <TableCell>{formatDate(caseItem.dueDate)}</TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(caseItem.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
