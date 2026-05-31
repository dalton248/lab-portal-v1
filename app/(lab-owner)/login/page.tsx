'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { setCurrentUser } from '@/lib/mock-data';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';

// Possible views on this page
type View = 'login' | 'signup' | 'forgotPassword';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, profile, loading: authLoading, profileError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<View>('login');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'dentist' | 'lab'>('dentist');
  const [labEmail, setLabEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { t } = useLanguage();

  // Convenience alias so existing code that reads `isLogin` still works
  const isLogin = view === 'login';

  // Show success banner when redirected back from /auth/reset-password
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMsg('Password updated successfully. Sign in with your new password.');
    }
  }, [searchParams]);

  // Redirect if already logged in and profile loaded, or show error if fetch fails
  useEffect(() => {
    // If auth is taking too long to initialize, don't block the UI indefinitely
    const authTimeout = setTimeout(() => {
      if (authLoading && !session) {
        console.warn('Auth initialization timed out, allowing user interaction');
        // We don't have a direct way to set authLoading to false, but we can 
        // handle it in our local UI logic if needed.
      }
    }, 3000);

    if (authLoading) return () => clearTimeout(authTimeout);

    if (session && profile) {
      router.replace('/dashboard');
    } else if (profileError) {
      const timer = setTimeout(() => {
        if (profileError && !profile) {
          setError(`Failed to load profile: ${profileError}`);
          setLoading(false);
        }
      }, 1000);
      return () => {
        clearTimeout(timer);
        clearTimeout(authTimeout);
      };
    }
    
    return () => clearTimeout(authTimeout);
  }, [session, profile, authLoading, profileError, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log('Login successful, pushing to dashboard');
      // On success, we don't setLoading(false) because we expect a redirect.
      // However, if the redirect hangs, the button stays stuck.
      // Let's add a safety timeout to clear loading if redirect doesn't happen.
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          setLoading(false);
        }
      }, 5000);

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred during login');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (role === 'dentist' && !labEmail) {
      setError('Lab email is required for dentists');
      setLoading(false);
      return;
    }

    // Simulate sending a "Request Access" email/saving to a requests table
    // Removing the direct signup
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSuccessMsg("Access request received. We will email you shortly.");
    setLoading(false);
  };

  // ── Forgot Password handler ───────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Check if this is a lab-admin email by looking up the profile role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (profileData && profileData.role === 'lab') {
      setError('Lab administrator accounts cannot reset their password here. Contact your system administrator.');
      setLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccessMsg('Check your inbox for a reset link. It will expire in 1 hour.');
    }
    setLoading(false);
  };

  // ── Forgot Password view ──────────────────────────────────────────────────
  if (view === 'forgotPassword') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
          <LanguageSwitcher />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <img src="/logo.png" alt="LabOps Logo" className="w-16 h-16 object-contain rounded-xl shadow-sm" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your dentist email and we'll send a reset link.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm rounded-lg border border-slate-200 sm:px-10">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
                {successMsg}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <Input
                label={t('login.email')}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setView('login'); setError(null); setSuccessMsg(null); }}
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

  // ── Login / Sign-up view ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.png" alt="LabOps Logo" className="w-16 h-16 object-contain rounded-xl shadow-sm" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">
          {isLogin ? t('login.title') : t('login.createAccount')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? t('login.subtitle') : "Request Access"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
              {successMsg}
            </div>
          )}
          <form className="space-y-6" onSubmit={isLogin ? handleLogin : handleSignUp}>
            {!isLogin && (
              <Input
                label={t('login.fullName')}
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('login.fullNamePlaceholder')}
              />
            )}

            <Input
              label={t('login.email')}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
            />

            {!isLogin ? null : (
              <Input
                label={t('login.password')}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
              />
            )}

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    {t('login.role')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('dentist')}
                      className={`py-2 px-4 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        role === 'dentist'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t('login.dentistRole')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('lab')}
                      className={`py-2 px-4 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        role === 'lab'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t('login.labRole')}
                    </button>
                  </div>
                </div>

                {role === 'dentist' && (
                  <Input
                    label={t('login.labEmail')}
                    type="email"
                    required
                    value={labEmail}
                    onChange={(e) => setLabEmail(e.target.value)}
                    placeholder={t('login.labEmailPlaceholder')}
                  />
                )}
              </>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                    {t('login.rememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => { setView('forgotPassword'); setError(null); setSuccessMsg(null); }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading || authLoading}>
              {(loading || authLoading) ? '...' : (isLogin ? t('login.signIn') : 'Request Access')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? "Don't have an account? Request Access" : t('login.backToLogin')}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">{t('login.demoAccounts')}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEmail('sarah.johnson@dental.com');
                  setPassword('password');
                }}
                className="text-xs"
              >
                {t('login.dentist')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEmail('michael.chen@precisionlab.com');
                  setPassword('password');
                }}
                className="text-xs"
              >
                {t('login.labAdmin')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
