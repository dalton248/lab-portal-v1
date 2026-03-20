'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Send, Loader2, Download, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { getMessagesForCase } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CaseDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const router = useRouter();
  const { profile } = useAuth();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingScans, setFetchingScans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('submitted');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { t, language } = useLanguage();

  const fetchCaseDetails = async (withScans = false) => {
    if (!params.id) return;
    
    // Ensure we have a session to forward for RLS
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (withScans) setFetchingScans(true);
    else setLoading(true);
    
    setError(null);
    try {
      const url = `/api/cases/${params.id}${withScans ? '?fetchScans=true' : ''}`;
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch case details');
      }
      const data = await response.json();
      setCaseData(data);
      setCaseStatus(data.status);
    } catch (err: any) {
      console.error('Error fetching case:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setFetchingScans(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [params.id]);

  // Create a compatible user object from the profile
  const currentUser = profile ? {
    id: profile.id,
    email: profile.email,
    role: profile.role === 'lab_admin' ? 'lab_admin' : 'dentist',
    name: profile.full_name || profile.email.split('@')[0],
    officeName: profile.office_name || 'N/A',
  } : null;

  const messages = getMessagesForCase(params.id as string);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p>{t('common.loading') || 'Loading case details...'}</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-24 px-6">
        <div className="max-w-md mx-auto">
          <p className="text-slate-600 mb-6 text-lg">{error || t('cases.caseNotFound')}</p>
          <Button 
            variant="outline" 
            className="flex items-center justify-center mx-auto space-x-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back') || 'Go Back'}</span>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = async (newStatus: CaseStatus) => {
    if (!params.id) return;
    
    setUpdatingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/cases/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      setCaseStatus(newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setNewMessage('');
  };

  return (
    <div className="space-y-6 pb-12">
      {caseData.n8n_failed && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-amber-800">
          <p className="text-sm font-medium">{t('common.partialData')}</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white border-amber-300 hover:bg-amber-100"
            onClick={() => fetchCaseDetails(true)}
            disabled={fetchingScans}
          >
            {fetchingScans ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.retry')}
          </Button>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{caseData.caseId}</h1>
            <span className="text-xs font-medium text-slate-400 border border-slate-200 px-2 py-0.5 rounded">ID: {caseData.id.split('-')[0]}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t('cases.patientLabel')}: <span className="text-slate-900 font-medium">{caseData.patientName}</span>
          </p>
        </div>
        <StatusBadge status={caseStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">{t('cases.detailsTitle')}</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('cases.typeLabel')}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{caseData.caseType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('cases.shadeLabel')}</p>
                  <p className="mt-1 text-sm text-slate-900">{caseData.shade || t('common.na')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">UNN</p>
                  <p className="mt-1 text-sm text-slate-900 font-medium">{caseData.unn || t('common.na')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Submitted Date</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(caseData.submitted_date || caseData.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('cases.dueDateLabel')}</p>
                  <p className="mt-1 text-sm text-slate-900 text-blue-600 font-bold">{formatDate(caseData.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">System Created At</p>
                  <p className="mt-1 text-sm text-slate-400 italic">{formatDate(caseData.createdAt)}</p>
                </div>
              </div>

              {(caseData.notes || caseData.additional_info) && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Additional Instructions / Notes</p>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg italic">
                    {caseData.additional_info || caseData.notes}
                  </p>
                </div>
              )}

              {currentUser?.role === 'lab_admin' && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Select
                        label={t('cases.updateStatusLabel')}
                        options={[
                          { value: 'submitted', label: t('status.submitted') },
                          { value: 'in_progress', label: t('status.in_progress') },
                          { value: 'on_hold', label: t('status.on_hold') },
                          { value: 'completed', label: t('status.completed') },
                          { value: 'rejected', label: t('status.rejected') },
                        ]}
                        value={caseStatus}
                        onChange={(e) => handleStatusUpdate(e.target.value as CaseStatus)}
                        disabled={updatingStatus}
                      />
                    </div>
                    {updatingStatus && (
                      <div className="pt-6">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">{t('cases.messagesTitle')}</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    {t('cases.noMessages')}
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUser?.id
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2 ${
                          message.senderId === currentUser?.id
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-900 rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-baseline space-x-2 mb-1">
                          <p className="text-xs font-bold">{message.senderName}</p>
                          <p
                            className={`text-[10px] ${
                              message.senderId === currentUser?.id
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
                    placeholder={t('cases.typeMessage')}
                    rows={2}
                    className="flex-1 resize-none border-slate-200 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" className="self-end rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-md">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-100 bg-blue-50/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{t('cases.filesTitle')}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm font-medium">
                    {caseData.stl_links?.length || 0} Scans
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!caseData.stl_links || caseData.stl_links.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-4 px-4 font-medium">No STL scan files retrieved from 3Shape yet</p>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="rounded-full px-6 shadow-sm flex items-center space-x-2 mx-auto"
                      onClick={() => {
                        if (caseData.threeShapeId) {
                          window.location.href = `https://n8n-3shape-connection.onrender.com/webhook/get-3shape-file?caseId=${caseData.threeShapeId}`;
                        } else {
                          console.error('No 3ShapeID available for download');
                          alert('Error: 3ShapeID not found for this case.');
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download STL</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    {caseData.stl_links.map((file, index) => (
                      <div 
                        key={index}
                        className="group flex items-center space-x-3 p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-white hover:shadow-md transition-all cursor-pointer bg-white/80"
                      >
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg transition-colors group-hover:bg-blue-100 group-hover:shadow-inner">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">3D Scanner Output</p>
                        </div>
                        <a 
                          href={file.url} 
                          download 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline"
                      className="w-full mt-4 flex items-center justify-center space-x-2 bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => fetchCaseDetails(true)}
                      disabled={fetchingScans}
                    >
                      <Loader2 className={`h-4 w-4 ${fetchingScans ? 'animate-spin' : 'hidden'}`} />
                      <span>{fetchingScans ? 'Updating...' : 'Sync with 3Shape'}</span>
                    </Button>

                    <Button 
                      variant="primary"
                      className="w-full mt-2 flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download All Files</span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
