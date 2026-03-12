'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        setLoading(true);
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const fetchProfile = async (userId: string) => {
    try {
      setProfileError(null);
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileError(error.message);
      } else if (data) {
        setProfile({
          id: data.id,
          role: data['role (dentist/lab admin)'] || data.role, // Handle column name variations
          full_name: data.full_name,
          email: data.email,
          lab_id: data.lab_id,
          office_name: data.office_name,
        });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching profile:', err);
      setProfileError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
