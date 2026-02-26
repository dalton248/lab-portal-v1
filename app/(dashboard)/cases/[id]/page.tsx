'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { getCurrentUser, getCaseById, getMessagesForCase } from '@/lib/mock-data';
import { CaseStatus } from '@/lib/types';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const currentUser = getCurrentUser();
  const caseData = getCaseById(params.id as string);
  const messages = getMessagesForCase(params.id as string);
  const [newMessage, setNewMessage] = useState('');
  const [caseStatus, setCaseStatus] = useState<CaseStatus>(caseData?.status || 'submitted');

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Case not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setNewMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{caseData.caseId}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Patient: {caseData.patientName}
          </p>
        </div>
        <StatusBadge status={caseStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Case Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Case Type</p>
                  <p className="mt-1 text-sm text-slate-900">{caseData.caseType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Shade</p>
                  <p className="mt-1 text-sm text-slate-900">{caseData.shade || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Due Date</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(caseData.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Submitted By</p>
                  <p className="mt-1 text-sm text-slate-900">{caseData.dentistName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(caseData.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Last Updated</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(caseData.updatedAt)}</p>
                </div>
              </div>
              {caseData.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-900">{caseData.notes}</p>
                </div>
              )}
              {currentUser.role === 'lab_admin' && (
                <div className="pt-4 border-t border-slate-200">
                  <Select
                    label="Update Status"
                    options={statusOptions}
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No messages yet
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUser.id
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-md rounded-lg px-4 py-2 ${
                          message.senderId === currentUser.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="flex items-baseline space-x-2 mb-1">
                          <p className="text-xs font-medium">{message.senderName}</p>
                          <p
                            className={`text-xs ${
                              message.senderId === currentUser.id
                                ? 'text-blue-100'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-slate-200 pt-4">
                <div className="flex space-x-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button type="submit" variant="primary" className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Files</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      impression_scan.stl
                    </p>
                    <p className="text-xs text-slate-500">2.4 MB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      shade_reference.jpg
                    </p>
                    <p className="text-xs text-slate-500">1.1 MB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      prescription.pdf
                    </p>
                    <p className="text-xs text-slate-500">345 KB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
