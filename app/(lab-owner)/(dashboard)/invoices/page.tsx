'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, ArrowRight, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus } from '@/lib/types';

export default function InvoicesPage() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const query = supabase.from('Cases').select('*');

        if (profile.role === 'dentist') {
          query.eq('dentist_id', profile.id);
        } else {
          query.eq('lab_id', profile.lab_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        if (data) {
          const mapped: Case[] = data.map((item: any) => ({
            id: item.id,
            caseId: item.Case_number || 'N/A',
            patientName: item.FirstName_LastName || 'N/A',
            caseType: item.Type || '—',
            status: (item.status?.toLowerCase() || 'submitted') as CaseStatus,
            dueDate: item.due_date || item.created_at,
            createdAt: item.created_at,
            updatedAt: item.created_at,
            dentistId: item.dentist_id || '',
            dentistName: item.FirstName_LastName || 'N/A',
            labId: item.lab_id || '',
            price: item.price ?? null,
          }));
          setCases(mapped);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [profile]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const totalBilled = cases
    .filter((c) => c.price)
    .reduce((sum, c) => sum + (c.price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-blue-600" />
          {language === 'en' ? 'Invoices' : '账单'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'en'
            ? 'View all billed cases and pricing from your lab.'
            : '查看来自实验室的所有计费案件和定价。'}
        </p>
      </div>

      {totalBilled > 0 && (
        <div className="inline-flex items-center px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
          <DollarSign className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">
            {language === 'en' ? 'Total billed:' : '总计费:'}{' '}
            <span className="font-black">${totalBilled.toFixed(2)}</span>
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>{''}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>{language === 'en' ? 'No cases yet.' : '暂无案件。'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors group"
                      onClick={() => router.push(`/cases/${c.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-slate-500">{c.caseId}</TableCell>
                      <TableCell className="font-medium text-slate-900">{c.patientName}</TableCell>
                      <TableCell className="text-slate-600">{c.caseType}</TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {c.price != null ? `$${c.price.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
