'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { getCurrentUser, getCasesForCurrentUser } from '@/lib/mock-data';
import { CaseStatus } from '@/lib/types';

export default function CasesPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const allCases = getCasesForCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCases =
    statusFilter === 'all'
      ? allCases
      : allCases.filter((c) => c.status === statusFilter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filterOptions = [
    { value: 'all', label: 'All Cases' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all cases
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">All Cases</h2>
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No cases found
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
