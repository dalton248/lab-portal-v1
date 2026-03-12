'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Download, ChevronRight, User as UserIcon, FileText } from 'lucide-react';

// Mock data for the inbox
const inboxSources = [
  { 
    id: '3shape', 
    name: '3Shape', 
    count: 2, 
    logo: '3S',
    examples: [
      { patient: 'John Smith', dentist: 'Dr. Sarah Johnson' },
      { patient: 'Lisa Anderson', dentist: 'Dr. Sarah Johnson' }
    ]
  },
  { 
    id: 'itero', 
    name: 'iTero', 
    count: 1, 
    logo: 'iT',
    examples: [
      { patient: 'Emily Brown', dentist: 'Dr. James Wilson' },
    ]
  },
  { 
    id: 'email', 
    name: 'Email', 
    count: 1, 
    logo: '@',
    examples: [
      { patient: 'Robert Wilson', dentist: 'Dr. Maria Garcia' },
    ]
  },
];

const inboxCases = [
  {
    source: '3Shape',
    caseId: 'C-10421',
    patient: 'John Smith',
    clinic: 'Bright Smile Dental',
    restoration: 'Crown #14',
    time: '10:32 AM',
    status: 'New',
  },
  {
    source: 'iTero',
    caseId: 'IT-55092',
    patient: 'Emily Brown',
    clinic: 'City Dental Care',
    restoration: 'Bridge #3-5',
    time: '09:15 AM',
    status: 'New',
  },
  {
    source: 'Email',
    caseId: 'EM-99014',
    patient: 'Robert Wilson',
    clinic: 'Northside Clinic',
    restoration: 'Implant #19',
    time: 'Yesterday',
    status: 'Open',
  },
  {
    source: '3Shape',
    caseId: 'C-10425',
    patient: 'Sarah Miller',
    clinic: 'Lakeside Dental',
    restoration: 'Veneers #7-10',
    time: 'Yesterday',
    status: 'Open',
  },
];

export default function CaseInboxPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string | null>(null);

  const handleFilter = (sourceId: string) => {
    setFilter(prev => prev === sourceId ? null : sourceId);
  };

  const filteredCases = filter 
    ? inboxCases.filter(c => c.source.toLowerCase() === filter.toLowerCase())
    : inboxCases;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('inbox.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('inbox.subtitle')}</p>
        </div>
        <button 
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-slate-50 font-medium text-sm transition-all shadow-sm"
          onClick={() => alert('Downloading all cases...')}
        >
          <Download className="mr-2 h-4 w-4" />
          {t('inbox.downloadAll')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {inboxSources.map((source) => (
          <Card 
            key={source.id} 
            className={`transition-all border-2 ${
              filter === source.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-slate-200 hover:shadow-md'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {source.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{source.name === 'Email' ? t('inbox.emailUploads') : source.name}</h3>
                    <p className="text-sm text-slate-500">{source.count} {t('nav.cases')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pb-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {t('inbox.recentPatients')}
                </p>
                <div className="space-y-2.5">
                  {source.examples.map((ex, i) => (
                    <div key={i} className="flex items-center text-sm text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2">
                        <UserIcon className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ex.patient}</p>
                        <p className="text-[11px] text-slate-500 truncate">{ex.dentist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  variant={filter === source.id ? 'primary' : 'secondary'} 
                  className="w-full flex items-center justify-center"
                  onClick={() => handleFilter(source.id)}
                >
                  {t('inbox.viewCases')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {filter ? `${inboxSources.find(s => s.id === filter)?.name} ${t('nav.cases')}` : t('inbox.recentPatients')}
            </h2>
            {filter && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {filteredCases.length}
              </span>
            )}
          </div>
          {filter && (
            <button 
              onClick={() => setFilter(null)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {t('cases.filterAll')}
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-24">{t('inbox.source')}</TableHead>
                  <TableHead>{t('table.caseId')}</TableHead>
                  <TableHead>{t('table.patient')}</TableHead>
                  <TableHead>{t('inbox.dentistClinic')}</TableHead>
                  <TableHead>{t('inbox.restoration')}</TableHead>
                  <TableHead>{t('inbox.time')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('inbox.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        item.source === '3Shape' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                        item.source === 'iTero' ? 'text-cyan-600 border-cyan-200 bg-cyan-50' :
                        'text-indigo-600 border-indigo-200 bg-indigo-50'
                      }`}>
                        {item.source}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.caseId}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{item.patient}</TableCell>
                    <TableCell className="text-slate-600">{item.clinic}</TableCell>
                    <TableCell className="text-slate-600">{item.restoration}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{item.time}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'New' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status === 'New' ? t('inbox.new') : t('inbox.open')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider transition-colors">
                        {t('inbox.open')}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-slate-200 mb-2" />
                        <p>{t('dashboard.noCasesFound')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
