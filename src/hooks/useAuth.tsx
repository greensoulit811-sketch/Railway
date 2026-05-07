import { useState, useEffect, createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'manager' | 'order_handler' | 'customer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isStaff: boolean;
  userRole: AppRole | null;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TIMEOUT_MS = 8000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const checkRoles = async (userId: string) => {
    try {
      // Check is_active first
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        // User is disabled
        await supabase.auth.signOut();
        setAuthError('Your account has been disabled. Contact an administrator.');
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsStaff(false);
        setUserRole(null);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const role = (roleData?.role as AppRole) || 'customer';
      setUserRole(role);
      setIsAdmin(role === 'admin');
      setIsStaff(['admin', 'manager', 'order_handler'].includes(role));
    } catch (error) {
      console.error('Error checking roles:', error);
      setIsAdmin(false);
      setIsStaff(false);
      setUserRole(null);
    }
  };

  const finishLoading = () => {
    setIsLoading(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    timeoutRef.current = window.setTimeout(() => {
      console.warn('Auth initialization timed out');
      setAuthError('Auth initialization timed out');
      finishLoading();
    }, AUTH_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(async () => {
            await checkRoles(newSession.user.id);
            finishLoading();
          }, 0);
        } else {
          setIsAdmin(false);
          setIsStaff(false);
          setUserRole(null);
          finishLoading();
        }
      }
    );

    supabase.auth.getSession()
      .then(async ({ data: { session: currentSession }, error }) => {
        if (error) {
          setAuthError(error.message);
          finishLoading();
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await checkRoles(currentSession.user.id);
        }
        finishLoading();
      })
      .catch(() => {
        setAuthError('Failed to initialize auth');
        finishLoading();
      });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setAuthError(error.message);
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsStaff(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isStaff, userRole, isLoading, authError, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
