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

    // Helper to fetch profile with safety against outdated requests
    const safeFetchProfile = async (userId: string, currentSession: Session | null) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setProfileError(null);
        
        console.log(`Fetching profile for ${userId}...`);
        const { data, error } = await supabase
          .from('Users')
          .select('*')
          .eq('id', userId)
          .single();

        // If component unmounted or request was aborted, ignore this result
        if (!mounted || controller.signal.aborted) return;

        if (error) {
          console.error('Error fetching profile:', error);
          if (currentSession) {
            setProfileError(error.message);
          }
        } else if (data) {
          console.log('Profile fetched successfully');
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
        
        console.error('Unexpected error fetching profile:', err);
        setProfileError(err.message || 'Unexpected error');
      } finally {
        if (mounted && !controller.signal.aborted) {
          setLoading(false);
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        }
      }
    };

    // Initialize auth state immediately
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state via getSession...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          console.log('Initial session found');
          setSession(initialSession);
          setUser(initialSession.user);
          await safeFetchProfile(initialSession.user.id, initialSession);
        } else {
          console.log('No initial session');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error during initial session check:', err);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listener for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log(`Auth event: ${event}`);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setLoading(true);
          await safeFetchProfile(newSession.user.id, newSession);
        } else {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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
