'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { searchCases } from '@/lib/mock-data';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus } from '@/lib/types';

export default function CasesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('due_date_asc');

  useEffect(() => {
    async function fetchCases() {
      if (!profile?.id) return;
      
      setLoading(true);
      try {
        let sortColumn = 'due_date';
        let sortAscending = true;

        if (sortBy === 'due_date_desc') {
          sortAscending = false;
        } else if (sortBy === 'created_at_desc') {
          sortColumn = 'created_at';
          sortAscending = false;
        } else if (sortBy === 'created_at_asc') {
          sortColumn = 'created_at';
          sortAscending = true;
        }

        const query = supabase
          .from('Cases')
          .select('*')
          .order(sortColumn, { ascending: sortAscending, nullsFirst: false });

        if (profile.role === 'dentist') {
          query.eq('dentist_id', profile.id);
        } else {
          query.eq('lab_id', profile.lab_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const mappedCases: Case[] = data.map((item: any) => ({
            id: item.id,
            caseId: item.Case_number || 'N/A',
            patientName: item.FirstName_LastName || 'N/A',
            caseType: item.Type || 'Crown',
            status: (item.status?.toLowerCase() || 'submitted') as CaseStatus,
            dueDate: item.due_date || item.created_at,
            createdAt: item.created_at,
            updatedAt: item.created_at,
            dentistId: item.dentist_id || '',
            dentistName: item.FirstName_LastName || 'N/A',
            labId: item.lab_id || '',
          }));
          setAllCases(mappedCases);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, [profile, sortBy]);

  const statusFiltered =
    statusFilter === 'all'
      ? allCases
      : allCases.filter((c) => c.status === statusFilter);

  const filteredCases = searchCases(searchQuery, statusFiltered);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const filterOptions = [
    { value: 'all', label: t('cases.filterAll') },
    { value: 'submitted', label: t('status.submitted') },
    { value: 'in_progress', label: t('status.in_progress') },
    { value: 'on_hold', label: t('status.on_hold') },
    { value: 'completed', label: t('status.completed') },
    { value: 'rejected', label: t('status.rejected') },
  ];

  const currentUserRole = profile?.role || 'dentist';

  const sortOptions = [
    { value: 'due_date_asc', label: 'Due Date (Soonest)' },
    { value: 'due_date_desc', label: 'Due Date (Latest)' },
    { value: 'created_at_desc', label: 'Most Recent' },
    { value: 'created_at_asc', label: 'Oldest' },
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
            <div className="flex gap-2">
              <div className="w-48">
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                />
              </div>
              {currentUserRole === 'lab_admin' && (
                <div className="w-48">
                  <Select
                    options={filterOptions}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  />
                </div>
              )}
            </div>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p>{t('common.loading') || 'Loading cases...'}</p>
            </div>
          ) : (
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
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
