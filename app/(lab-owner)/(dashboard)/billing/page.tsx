'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, AlertCircle, CheckCircle2, Clock, Building2, Plus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ServiceCatalog } from '@/components/billing/ServiceCatalog';

interface LabStatus {
  stripe_connect_id: string | null;
  stripe_onboarding_complete: boolean | null;
}

function BillingContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const returnedFromStripe = searchParams.get('success') === 'true';

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labStatus, setLabStatus] = useState<LabStatus | null>(null);

  const fetchStatus = async () => {
    if (!profile?.lab_id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const response = await fetch(`/api/billing/status?lab_id=${profile.lab_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLabStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch billing status:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [profile?.lab_id]);

  const handleAction = async (e: React.MouseEvent, endpoint: string) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab_id: profile?.lab_id }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(data.error || t('billing.onboardingError'));
      }

      const url = data.url || data.link || data.onboarding_url;
      if (url) {
        setRedirecting(true);
        window.location.assign(url);
      } else {
        console.log('No redirect URL in response:', data);
        alert('Request sent successfully.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isComplete = labStatus?.stripe_onboarding_complete === true;
  const isVerifying = !!labStatus?.stripe_connect_id && !isComplete;
  const isNew = !labStatus?.stripe_connect_id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('billing.title')}</h1>
        <p className="text-slate-500">{t('billing.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Success / verifying banner shown after returning from Stripe */}
        {(returnedFromStripe || isVerifying) && !isComplete && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <Clock className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
            <span>{t('billing.verifyingBanner')}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{t('billing.connectTitle')}</CardTitle>
                  <CardDescription>{t('billing.connectDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700">Status:</span>
                    <span className="flex items-center text-sm">
                      {isComplete ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">{t('billing.statusComplete')}</span>
                        </>
                      ) : isVerifying ? (
                        <>
                          <Clock className="h-4 w-4 mr-1 text-amber-500" />
                          <span className="text-amber-600 font-medium">{t('billing.statusVerifying')}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-1 text-slate-400" />
                          <span className="text-slate-500">{t('billing.statusDisconnected')}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {isNew && (
                    <Button
                      type="button"
                      onClick={(e) => handleAction(e, '/api/billing/onboard')}
                      disabled={loading || redirecting}
                      variant="primary"
                    >
                      {redirecting ? 'Redirecting...' : loading ? '...' : t('billing.connectButton')}
                    </Button>
                  )}

                  {isVerifying && (
                    <Button
                      type="button"
                      onClick={(e) => handleAction(e, '/api/billing/resume')}
                      disabled={loading || redirecting}
                      variant="primary"
                    >
                      {redirecting ? 'Redirecting...' : loading ? '...' : t('billing.resumeButton')}
                    </Button>
                  )}
                </div>

                {isComplete && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100">
                    {t('billing.completedMessage')}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>{t('billing.invoiceGenerator')}</CardTitle>
                  <CardDescription>Generate new invoices and orders for your clients.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Quickly create a clinical case and its corresponding invoice using your service catalog.
                </p>
                <Button
                  type="button"
                  onClick={() => router.push('/billing/invoices/new')}
                  variant="primary"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('billing.createInvoice')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
