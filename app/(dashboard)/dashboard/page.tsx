'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getCurrentUser, getCasesForCurrentUser } from '@/lib/mock-data';

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const cases = getCasesForCurrentUser();

  const stats = {
    total: cases.length,
    inProgress: cases.filter((c) => c.status === 'in_progress').length,
    completed: cases.filter((c) => c.status === 'completed').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
            {currentUser.role === 'dentist' ? 'My Cases' : 'All Cases'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {currentUser.role === 'dentist'
              ? 'Manage and track your dental lab cases'
              : 'Overview of all laboratory cases'}
          </p>
        </div>
        {currentUser.role === 'dentist' && (
          <Button
            variant="primary"
            onClick={() => router.push('/cases/new')}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        )}
      </div>

      {currentUser.role === 'lab_admin' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Total Cases</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="mt-1 text-3xl font-semibold text-blue-600">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="mt-1 text-3xl font-semibold text-green-600">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Recent Cases</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
