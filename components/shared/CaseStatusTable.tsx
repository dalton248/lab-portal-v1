'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseStatus } from '@/lib/types';

type Case = {
  id: string;
  Case_number: string;
  FirstName_LastName: string;
  Type: string;
  status: CaseStatus;
  due_date: string;
};

interface CaseStatusTableProps {
  userRole: 'lab_admin' | 'dentist';
}

export function CaseStatusTable({ userRole }: CaseStatusTableProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      // The Supabase RLS policies will automatically filter cases transparently.
      // - lab_admin sees all cases for their lab_id
      // - dentist sees only cases where dentist_id = auth.uid()
      const { data, error } = await supabase
        .from('Cases')
        .select('id, "Case_number", "FirstName_LastName", "Type", status, due_date')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cases:', error);
      } else {
        setCases(data || []);
      }
      setLoading(false);
    }

    fetchCases();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading cases...</div>;
  }

  if (cases.length === 0) {
    return <div className="p-8 text-center text-slate-500">No cases found.</div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-semibold">Case ID</TableHead>
            <TableHead className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-semibold">Patient</TableHead>
            <TableHead className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-semibold">Type</TableHead>
            <TableHead className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</TableHead>
            <TableHead className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => (
            <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
              <TableCell className="py-4 px-6 font-medium text-slate-900">{c.Case_number || 'N/A'}</TableCell>
              <TableCell className="py-4 px-6 text-slate-700">{c.FirstName_LastName || 'N/A'}</TableCell>
              <TableCell className="py-4 px-6 text-slate-600">{c.Type || 'Unknown'}</TableCell>
              <TableCell className="py-4 px-6">
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell className="py-4 px-6 text-slate-600 text-right">
                {c.due_date ? new Date(c.due_date).toLocaleDateString() : 'TBD'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
