'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus } from '@/lib/types';
import { Download, LayoutGrid, List, Loader2, FileText, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { KanbanBoard } from '@/components/cases/KanbanBoard';
import { useRouter } from 'next/navigation';

export default function CaseInboxPage() {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const router = useRouter();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCases = async () => {
    if (!profile?.lab_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Cases')
        .select('*')
        .eq('lab_id', profile.lab_id)
        .order('created_at', { ascending: false });

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
        setCases(mappedCases);
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [profile]);

  const handleStatusChange = async (id: string, newStatus: CaseStatus) => {
    setUpdatingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local state
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('inbox.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('inbox.subtitle')}</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-lg transition-all ${
              view === 'table' 
                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title="List View"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-2 rounded-lg transition-all ${
              view === 'kanban' 
                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title="Kanban View"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="font-medium">{t('common.loading') || 'Loading cases...'}</p>
        </div>
      ) : (
        <>
          {view === 'kanban' ? (
            <KanbanBoard cases={cases} onStatusChange={handleStatusChange} />
          ) : (
            <Card className="overflow-hidden border-slate-100 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="pl-6">{t('table.caseId')}</TableHead>
                      <TableHead>{t('table.patient')}</TableHead>
                      <TableHead>{t('inbox.restoration')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead>{t('table.dueDate')}</TableHead>
                      <TableHead className="text-right pr-6">{t('inbox.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                          <div className="flex flex-col items-center">
                            <FileText className="h-10 w-10 text-slate-200 mb-3" />
                            <p>{t('dashboard.noCasesFound')}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cases.map((item) => (
                        <TableRow 
                          key={item.id} 
                          className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/cases/${item.id}`)}
                        >
                          <TableCell className="pl-6 font-mono text-xs text-slate-500">
                            {item.caseId}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {item.patientName}
                          </TableCell>
                          <TableCell className="text-slate-600 font-medium">
                            {item.caseType}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {formatDate(item.dueDate)}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <button className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center">
                              {t('inbox.open')}
                              <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
