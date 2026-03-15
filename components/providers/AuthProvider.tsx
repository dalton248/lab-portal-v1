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
          setProfile({
            id: data.id,
            role: data['role (dentist/lab admin)'] || data.role,
            full_name: data.full_name,
            email: data.email,
            lab_id: data.lab_id,
            office_name: data.office_name,
          });
        }
      } catch (err: any) {
        if (!mounted || controller.signal.aborted) return;
        if (err.name === 'AbortError') return; // Silence abort errors
        
        console.error('Unexpected error fetching profile:', err);
        setProfileError(err.message || 'Unexpected error');
      } finally {
        if (mounted && !controller.signal.aborted) {
          setLoading(false);
          // Only clear ref if it's still this controller
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        }
      }
    };

    // Initialize auth listener - it will handle the INITIAL_SESSION event automatically
    const initAuth = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;

        console.log(`Auth event: ${event}`);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
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

      return subscription;
    };

    const subscription = initAuth();

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
