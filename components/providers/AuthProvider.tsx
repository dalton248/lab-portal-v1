'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  role: 'dentist' | 'lab_admin';
  full_name?: string;
  email: string;
  lab_id?: string;
  office_name?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Use a ref to track the active AbortController to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    // Helper to fetch profile with safety against outdated requests
    const safeFetchProfile = async (userId: string) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setProfileError(null);
        
        console.log(`[Auth] Fetching profile for ${userId}...`);
        const { data, error } = await supabase
          .from('Users')
          .select('*')
          .eq('id', userId)
          .single();

        // If component unmounted or request was aborted, ignore this result
        if (!mounted || controller.signal.aborted) return;

        if (error) {
          // Log structured error if possible
          console.error('[Auth] Error fetching profile:', JSON.stringify(error, null, 2));
          setProfileError(error.message || 'Failed to load user profile');
        } else if (data) {
          console.log('[Auth] Profile fetched successfully');
          setProfile({
            id: data.id,
            role: data.role || data['role (dentist/lab admin)'],
            full_name: data.full_name,
            email: data.email,
            lab_id: data.lab_id,
            office_name: data.office_name,
          });
        }
      } catch (err: any) {
        if (!mounted || controller.signal.aborted) return;
        if (err.name === 'AbortError') return; 
        
        console.error('[Auth] Unexpected error fetching profile:', err);
        setProfileError(err.message || 'An unexpected error occurred while loading your profile');
      } finally {
        if (mounted && !controller.signal.aborted) {
          setLoading(false);
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        }
      }
    };

    // Main sync function to handle session changes
    const handleAuthChange = async (newSession: Session | null) => {
      if (!mounted) return;
      
      authInitialized = true;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setLoading(true);
        await safeFetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    // 1. Set up the listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[Auth] Event: ${event}`);
      await handleAuthChange(newSession);
    });

    // 2. Fallback: If onAuthStateChange doesn't fire immediately (can happen in some environments),
    // trigger a manual check after a short delay to ensure the UI doesn't hang.
    const fallbackTimer = setTimeout(async () => {
      if (!authInitialized && mounted) {
        console.log('[Auth] Fallback: manual session check');
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error?.message?.includes('Refresh Token Not Found')) {
            console.warn('[Auth] Invalid refresh token, signing out...');
            await supabase.auth.signOut();
            if (mounted) {
              await handleAuthChange(null);
            }
            return;
          }

          if (!authInitialized && mounted) {
            await handleAuthChange(currentSession);
          }
        } catch (err) {
          console.error('[Auth] Manual session check failed:', err);
          if (!authInitialized && mounted) {
            await handleAuthChange(null);
          }
        }
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, profileError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
