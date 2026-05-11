import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { UserProfile } from '../types';

function generatePartnerCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsProfileSetup: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  async function loadProfile(user: User) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile && !error) {
      setUserProfile(profile as UserProfile);
      setNeedsProfileSetup(false);
    } else {
      setUserProfile(null);
      setNeedsProfileSetup(true);
    }
  }

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setFirebaseUser(user);
      if (user) {
        setLoading(false);
        loadProfile(user);
      } else {
        setUserProfile(null);
        setNeedsProfileSetup(false);
        setLoading(false);
      }
    }).catch((err) => {
      console.error("Auth session error:", err);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setFirebaseUser(user);
      if (user) {
        setLoading(false);
        loadProfile(user);
      } else {
        setUserProfile(null);
        setNeedsProfileSetup(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loginWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function registerWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (firebaseUser) {
      await loadProfile(firebaseUser);
    }
  }

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      loading,
      needsProfileSetup,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { generatePartnerCode };
