"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  login: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && !user && isMounted) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user:", e);
          localStorage.removeItem("user");
        }
      }
    } catch (err) {
      console.error("localStorage access error:", err);
    }

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      
      try {
        localStorage.removeItem("user");
      } catch (err) {
        console.error("localStorage removal error:", err);
      }
    } catch (error) {
      console.error("Sign out error:", error);
      setError(error instanceof Error ? error : new Error('Failed to sign out'));
    }
  };

  const login = async (userData: any) => {
    try {
      try {
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("localStorage write error:", err);
      }
      
      if (userData.email && userData.password) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
        
        if (loginError) throw loginError;
        
        // Supabase auth will update user through onAuthStateChange
      } else {
        setUser(userData);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error : new Error('Failed to log in'));
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
    login,
  };

  return (
    <AuthContext.Provider value={value}>
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