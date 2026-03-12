'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getCurrentUser, getCasesForCurrentUser, searchCases } from '@/lib/mock-data';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const allCases = getCasesForCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCases = searchCases(searchQuery, allCases);
  const { t, language } = useLanguage();

  const stats = {
    total: allCases.length,
    inProgress: allCases.filter((c) => c.status === 'in_progress').length,
    onHold: allCases.filter((c) => c.status === 'on_hold').length,
    completed: allCases.filter((c) => c.status === 'completed').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser.role === 'dentist' ? t('dashboard.myCases') : t('dashboard.allCases')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {currentUser.role === 'dentist'
              ? t('dashboard.dentistSubtitle')
              : t('dashboard.labSubtitle')}
          </p>
        </div>
        {currentUser.role === 'dentist' && (
          <Button
            variant="primary"
            onClick={() => router.push('/cases/new')}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.newCase')}
          </Button>
        )}
      </div>

      {currentUser.role === 'lab_admin' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-50/50 border-dashed">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.totalCases')}</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">{t('dashboard.inProgress')}</p>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50/50 border-orange-100">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">{t('dashboard.onHold')}</p>
              <p className="text-3xl font-bold text-orange-600">{stats.onHold}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50/50 border-green-100">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">{t('dashboard.completed')}</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {currentUser.role === 'lab_admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('inbox.title')}</h2>
            <Button variant="secondary" size="sm" onClick={() => router.push('/case-inbox')}>
              {t('inbox.viewCases')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => router.push('/case-inbox')}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">3S</div>
                  <span className="font-medium text-slate-700">3Shape</span>
                </div>
                <span className="text-lg font-bold text-slate-900">2</span>
              </CardContent>
            </Card>
            <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => router.push('/case-inbox')}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-xs">iT</div>
                  <span className="font-medium text-slate-700">iTero</span>
                </div>
                <span className="text-lg font-bold text-slate-900">1</span>
              </CardContent>
            </Card>
            <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => router.push('/case-inbox')}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">@</div>
                  <span className="font-medium text-slate-700">{language === 'en' ? 'Email' : '邮件上传'}</span>
                </div>
                <span className="text-lg font-bold text-slate-900">1</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.recentCases')}</h2>
          </div>
          <div className="mt-4 relative">
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
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.dueDate')}</TableHead>
                <TableHead>{t('table.lastUpdated')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    {searchQuery ? t('dashboard.noSearchMatches') : t('dashboard.noCasesFound')}
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
