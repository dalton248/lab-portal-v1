'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Send, Loader2, Download, ArrowRight, X, AlertTriangle, Printer } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { supabase } from '@/lib/supabase';
import { Case, CaseStatus } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseMessage {
  id: string;
  case_id: string;
  sender_id: string | null;
  message: string;
  message_type: 'chat' | 'status_change';
  metadata?: {
    previous_status?: string;
    new_status?: string;
    sender_name?: string;
    rejection_reason?: string | null;
  } | null;
  created_at: string;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Intake',
  in_progress: 'Design',
  qc: 'QC',
  shipping: 'Shipping',
  on_hold: 'On Hold',
  completed: 'Completed',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  submitted:   'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  qc:          'bg-purple-100 text-purple-700 border-purple-200',
  shipping:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  on_hold:     'bg-amber-100 text-amber-700 border-amber-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  rejected:    'bg-red-100 text-red-700 border-red-200',
};

// ─── Rejection Modal ───────────────────────────────────────────────────────────

function RejectionModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Reject Case</h3>
              <p className="text-sm text-slate-500">Provide a reason for the dentist</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Textarea
          label="Rejection reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Incomplete impression, missing shade information..."
          rows={4}
        />

        <div className="flex space-x-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim()}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CaseDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const router = useRouter();
  const { profile } = useAuth();

  const [caseData, setCaseData]         = useState<Case | null>(null);
  const [loading, setLoading]           = useState(true);
  const [fetchingScans, setFetchingScans] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [caseStatus, setCaseStatus]     = useState<CaseStatus>('submitted');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Messages
  const [messages, setMessages]         = useState<CaseMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [newMessage, setNewMessage]     = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingStatus, setPendingStatus]     = useState<CaseStatus | null>(null);

  const { t, language } = useLanguage();

  // ── Fetch case ──────────────────────────────────────────────────────────────

  const fetchCaseDetails = async (withScans = false) => {
    if (!params.id) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (withScans) setFetchingScans(true);
    else setLoading(true);

    setError(null);
    try {
      const url = `/api/cases/${params.id}${withScans ? '?fetchScans=true' : ''}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to fetch case details');
      }
      const data = await res.json();
      setCaseData(data);
      setCaseStatus(data.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setFetchingScans(false);
    }
  };

  // ── Fetch messages ──────────────────────────────────────────────────────────

  const fetchMessages = async () => {
    if (!params.id) return;
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('Case_Messages')
        .select('*')
        .eq('case_id', params.id)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data as CaseMessage[]);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    fetchMessages();
  }, [params.id]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Status update ───────────────────────────────────────────────────────────

  const applyStatusUpdate = async (newStatus: CaseStatus, rejectionReason?: string) => {
    setUpdatingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/cases/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: rejectionReason || undefined,
          sender_id: profile?.id || null,
          sender_name: profile?.full_name || profile?.email || 'Lab',
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      setCaseStatus(newStatus);
      // Refresh messages to show the new audit entry
      await fetchMessages();
    } catch (err) {
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (newStatus === 'rejected') {
      setPendingStatus(newStatus);
      setShowRejectModal(true);
    } else {
      applyStatusUpdate(newStatus);
    }
  };

  const handleRejectConfirm = (reason: string) => {
    setShowRejectModal(false);
    if (pendingStatus) applyStatusUpdate(pendingStatus, reason);
    setPendingStatus(null);
  };

  // ── Send chat message ────────────────────────────────────────────────────────

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !params.id) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase.from('Case_Messages').insert({
        case_id: params.id,
        sender_id: profile?.id || null,
        message: newMessage.trim(),
        message_type: 'chat',
        metadata: { sender_name: profile?.full_name || profile?.email || 'Unknown' },
      });
      if (!error) {
        setNewMessage('');
        await fetchMessages();
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const isLabAdmin = profile?.role === 'lab_admin';

  // ── Loading / Error states ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p>Loading case details...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-24 px-6">
        <div className="max-w-md mx-auto">
          <p className="text-slate-600 mb-6 text-lg">{error || t('cases.caseNotFound')}</p>
          <Button variant="outline" className="flex items-center justify-center mx-auto space-x-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back') || 'Go Back'}</span>
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {showRejectModal && (
        <RejectionModal
          onConfirm={handleRejectConfirm}
          onCancel={() => { setShowRejectModal(false); setPendingStatus(null); }}
        />
      )}

      <div className="space-y-6 pb-12">
        {caseData.n8n_failed && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-amber-800 print:hidden">
            <p className="text-sm font-medium">{t('common.partialData')}</p>
            <Button size="sm" variant="outline" className="bg-white border-amber-300 hover:bg-amber-100" onClick={() => fetchCaseDetails(true)} disabled={fetchingScans}>
              {fetchingScans ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.retry')}
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors print:hidden">
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
          <div className="flex items-center space-x-3 print:hidden">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              <span>Print Case</span>
            </Button>
          </div>
          <StatusBadge status={caseStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
          <div className="lg:col-span-2 space-y-6 print:col-span-3">

            {/* Case Details */}
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
                    <p className="mt-1 text-sm text-slate-900">{formatDate(caseData.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t('cases.dueDateLabel')}</p>
                    <p className="mt-1 text-sm text-blue-600 font-bold">{formatDate(caseData.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Current Status</p>
                    <div className="mt-1"><StatusBadge status={caseStatus} size="sm" /></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t('cases.priceLabel') || 'Price ($)'}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {caseData.price !== undefined && caseData.price !== null
                        ? `$${Number(caseData.price).toFixed(2)}`
                        : t('common.na')}
                    </p>
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

                {/* Status updater — lab admin only */}
                {isLabAdmin && (
                  <div className="pt-4 border-t border-slate-200 print:hidden">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <Select
                          label={t('cases.updateStatusLabel')}
                          options={[
                            { value: 'submitted',   label: 'Intake — Not started yet' },
                            { value: 'in_progress', label: 'Design — Currently making the case' },
                            { value: 'qc',          label: 'QC — Quality check' },
                            { value: 'shipping',    label: 'Shipping — Case is on its way' },
                            { value: 'on_hold',     label: 'On Hold — Waiting on a question' },
                            { value: 'completed',   label: 'Completed — Case delivered' },
                            { value: 'rejected',    label: 'Rejected — Case cancelled' },
                          ]}
                          value={caseStatus}
                          onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
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

            {/* Messages / Activity Log */}
            <Card className="print:hidden">
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">{t('cases.messagesTitle')}</h2>
              </CardHeader>
              <CardContent>
                {/* Message list */}
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">{t('cases.noMessages')}</p>
                  ) : (
                    messages.map((msg) => {
                      if (msg.message_type === 'status_change') {
                        // ── Audit log pill ──
                        const prevStatus = msg.metadata?.previous_status;
                        const newStatus  = msg.metadata?.new_status;
                        const prevLabel  = prevStatus ? (STATUS_LABELS[prevStatus] ?? prevStatus) : '?';
                        const newLabel   = newStatus  ? (STATUS_LABELS[newStatus]  ?? newStatus)  : '?';
                        const newColor   = newStatus  ? (STATUS_COLORS[newStatus]  ?? STATUS_COLORS.submitted) : STATUS_COLORS.submitted;
                        const rejReason  = msg.metadata?.rejection_reason;

                        return (
                          <div key={msg.id} className="flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1 w-full max-w-sm">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-500">
                                <span className={`px-2 py-0.5 rounded-full font-medium border text-xs ${STATUS_COLORS[prevStatus ?? 'submitted']}`}>
                                  {prevLabel}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                <span className={`px-2 py-0.5 rounded-full font-medium border text-xs ${newColor}`}>
                                  {newLabel}
                                </span>
                              </div>
                              {rejReason && (
                                <p className="text-xs text-red-500 italic px-3">Reason: {rejReason}</p>
                              )}
                              <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)} · {msg.metadata?.sender_name || 'Lab'}</span>
                            </div>
                          </div>
                        );
                      }

                      // ── Chat bubble ──
                      const isMe = msg.sender_id === profile?.id;
                      const senderName = msg.metadata?.sender_name || (isMe ? 'You' : 'Lab');
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none'}`}>
                            <div className="flex items-baseline space-x-2 mb-1">
                              <p className="text-xs font-bold">{senderName}</p>
                              <p className={`text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat input */}
                <form onSubmit={handleSendMessage} className="border-t border-slate-200 pt-4 print:hidden">
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('cases.typeMessage')}
                      rows={2}
                      className="flex-1 resize-none border-slate-200 focus:ring-blue-500"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="self-end rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-md"
                    >
                      {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar — Files */}
          <div className="space-y-6 print:hidden">
            <Card className="border-blue-100 bg-blue-50/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{t('cases.filesTitle')}</h2>
                  <span className="text-xs text-slate-500 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm font-medium">
                    {caseData.stl_links?.length || 0} Scans
                  </span>
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
                        className="rounded-full px-6 shadow-sm flex items-center space-x-2 mx-auto print:hidden"
                        onClick={() => {
                          if (caseData.threeShapeId) {
                            window.location.href = `https://n8n-3shape-connection.onrender.com/webhook/get-3shape-file?caseId=${caseData.threeShapeId}`;
                          } else {
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
                        <div key={index} className="group flex items-center space-x-3 p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-white hover:shadow-md transition-all cursor-pointer bg-white/80">
                          <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-100">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                            <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">3D Scanner Output</p>
                          </div>
                          <a href={file.url} download className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all print:hidden" onClick={(e) => e.stopPropagation()}>
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-4 flex items-center justify-center space-x-2 bg-white border-blue-200 text-blue-600 hover:bg-blue-50 print:hidden" onClick={() => fetchCaseDetails(true)} disabled={fetchingScans}>
                        <Loader2 className={`h-4 w-4 ${fetchingScans ? 'animate-spin' : 'hidden'}`} />
                        <span>{fetchingScans ? 'Updating...' : 'Sync with 3Shape'}</span>
                      </Button>
                      <Button variant="primary" className="w-full mt-2 flex items-center justify-center space-x-2 shadow-lg print:hidden">
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
    </>
  );
}
