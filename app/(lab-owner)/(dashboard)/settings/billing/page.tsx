'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';


interface LabStatus {
  stripe_connect_id: string | null;
  stripe_onboarding_complete: boolean | null;
}

function BillingContent() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const returnedFromStripe = searchParams.get('success') === 'true';

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [verifying, setVerifying] = useState(returnedFromStripe);
  const [error, setError] = useState<string | null>(null);
  const [labStatus, setLabStatus] = useState<LabStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkCooldown, setCheckCooldown] = useState(false);

  const fetchStatus = async () => {
    if (!profile?.lab_id) {
      setFetchingStatus(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const response = await fetch(`/api/billing/status?lab_id=${profile.lab_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLabStatus(data);
        if (data.stripe_onboarding_complete) {
          setVerifying(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch billing status:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  // Fetch Supabase lab status on mount / when profile loads
  useEffect(() => {
    fetchStatus();
  }, [profile?.lab_id]);

  // Ping n8n check-status webhook every time the billing page is visited
  // This runs as soon as profile.lab_id is available, independently of fetchStatus
  useEffect(() => {
    if (!profile?.lab_id) return;
    console.log('[billing] Pinging check-status webhook for lab:', profile.lab_id);
    fetch('/api/billing/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lab_id: profile.lab_id }),
    }).catch((err) => console.warn('check-status ping failed:', err));
  }, [profile?.lab_id]);

  // Auto-poll every 15s when in verifying mode
  useEffect(() => {
    if (!verifying) return;
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [verifying, profile?.lab_id]);

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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isComplete = labStatus?.stripe_onboarding_complete === true;
  const hasId = !!labStatus?.stripe_connect_id;
  const isVerifyingState = hasId && !isComplete;
  const isNew = !hasId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('billing.title')}</h1>
        <p className="text-slate-500">{t('billing.subtitle')}</p>
      </div>

      {/* Verifying banner: shown after ?success=true redirect or when ID exists but not complete */}
      {(verifying || isVerifyingState) && !isComplete && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <Clock className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Stripe is reviewing your account</p>
            <p className="mt-0.5 text-amber-700">
              {t('billing.verifyingBanner')}
            </p>
            <button
              onClick={() => {
                if (!profile?.lab_id || checkingStatus || checkCooldown) return;
                setCheckingStatus(true);
                fetch('/api/billing/check-status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lab_id: profile.lab_id }),
                })
                  .then(() => fetchStatus())
                  .catch((err) => console.warn('check-status failed:', err))
                  .finally(() => {
                    setCheckingStatus(false);
                    setCheckCooldown(true);
                    setTimeout(() => setCheckCooldown(false), 10000);
                  });
              }}
              disabled={checkingStatus || checkCooldown}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking...
                </>
              ) : checkCooldown ? (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Checked — try again in a moment
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Refresh status
                </>
              )}
            </button>
          </div>
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
                    ) : isVerifyingState ? (
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

                {/* New lab — no ID yet */}
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

                {/* Has ID but not complete — Resume */}
                {isVerifyingState && (
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
      </div>
    </div>
  );
}

export default function SettingsBillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
