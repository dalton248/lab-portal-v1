'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type PageState = 'loading' | 'form' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    async function initSession() {
      const hash = window.location.hash;

      if (!hash || !hash.includes('access_token')) {
        setTokenError('No reset token found. This link may be invalid or expired.');
        setPageState('error');
        return;
      }

      // Issue #31: Parse the hash fragment manually directly from window.location.hash.
      // This bypasses the race condition inherent in Supabase's onAuthStateChange event
      // listener during redirect recovery flow, preventing UI hangs.
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (type !== 'recovery' || !accessToken || !refreshToken) {
        setTokenError('This link is not a valid password reset link. Please request a new one.');
        setPageState('error');
        return;
      }

      // Explicitly set the session using the tokens from the URL
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setTokenError(`Could not verify reset link: ${sessionError.message}. It may have expired.`);
        setPageState('error');
        return;
      }

      // Clear the hash from the URL so tokens aren't visible / reused
      window.history.replaceState(null, '', window.location.pathname);
      setPageState('form');
    }

    initSession();
  }, []);

  const isValid =
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    // Safety timeout — if updateUser hangs for 15s, surface an error
    const timeoutId = setTimeout(() => {
      setError('Request timed out. Please try again or request a new reset link.');
      setSubmitting(false);
    }, 15000);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      clearTimeout(timeoutId);

      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
        return;
      }

      // Redirect immediately — no signOut needed (Supabase handles session on next login)
      router.push('/login?reset=success');
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(err?.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  // ── Error (bad / expired token) ───────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="LabOps Logo" className="w-14 h-14 object-contain rounded-xl shadow-sm" />
          </div>
          <div className="bg-white py-8 px-4 shadow-sm rounded-lg border border-slate-200 sm:px-10 text-center">
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {tokenError}
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Reset links expire after 1 hour and can only be used once.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to login to request a new link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.png" alt="LabOps Logo" className="w-14 h-14 object-contain rounded-xl shadow-sm" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">Set new password</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Choose a strong password for your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1 text-xs text-red-500">Password must be at least 8 characters.</p>
              )}
            </div>

            <div>
              <Input
                label="Confirm New Password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!isValid || submitting}
            >
              {submitting ? 'Updating…' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
