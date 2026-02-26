'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/Input';
import { getCurrentUser, getCasesForCurrentUser, searchCases } from '@/lib/mock-data';

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const allCases = getCasesForCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCases = searchCases(searchQuery, allCases);

  const stats = {
    total: allCases.length,
    inProgress: allCases.filter((c) => c.status === 'in_progress').length,
    onHold: allCases.filter((c) => c.status === 'on_hold').length,
    completed: allCases.filter((c) => c.status === 'completed').length,
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className="text-sm font-medium text-slate-600">On Hold</p>
                  <p className="mt-1 text-3xl font-semibold text-orange-600">{stats.onHold}</p>
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
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Recent Cases</h2>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case ID, patient name, or status..."
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
                <TableHead>Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    {searchQuery ? 'No cases match your search' : 'No cases found'}
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
