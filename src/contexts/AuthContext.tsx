import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const QUERY_TIMEOUT = 5000;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadingProfileRef = useRef<Set<string>>(new Set());
  const profileLoadedRef = useRef<Set<string>>(new Set());

  const createFallbackProfile = (userId: string, currentUser: User): UserProfile => ({
    id: userId,
    email: currentUser?.email || null,
    full_name: currentUser?.user_metadata?.full_name || null,
    avatar_url: null,
    company_name: currentUser?.user_metadata?.company_name || null,
    phone: currentUser?.user_metadata?.phone || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    const abortController = new AbortController();

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (abortController.signal.aborted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id, session.user, session, abortController.signal);
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (abortController.signal.aborted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserProfile(newSession.user.id, newSession.user, newSession, abortController.signal);
      } else {
        setUserProfile(null);
        profileLoadedRef.current.clear();
        loadingProfileRef.current.clear();
        setLoading(false);
      }
    });

    return () => {
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (
    userId: string,
    currentUser: User,
    currentSession: Session,
    signal: AbortSignal
  ) => {
    if (loadingProfileRef.current.has(userId) || profileLoadedRef.current.has(userId)) {
      setLoading(false);
      return;
    }
  
    loadingProfileRef.current.add(userId);
    let timeoutId: NodeJS.Timeout | null = null;
  
    try {
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
  
      timeoutId = setTimeout(() => {
        throw new Error('Query timeout');
      }, QUERY_TIMEOUT);
  
      // Define the expected Supabase response type
      const { data, error } = await Promise.race([
        queryPromise as Promise<{ data: UserProfile | null; error: any }>,
        new Promise<never>((_, reject) => timeoutId && reject(new Error('Query timeout'))),
      ]);
  
      if (signal.aborted || currentSession !== session) return;
  
      if (error) {
        if (error.code === 'PGRST116') {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  id: userId,
                  email: currentUser?.email || null,
                  full_name: currentUser?.user_metadata?.full_name || null,
                  company_name: currentUser?.user_metadata?.company_name || null,
                  phone: currentUser?.user_metadata?.phone || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();
  
            if (signal.aborted || currentSession !== session) return;
  
            if (createError) {
              setUserProfile(createFallbackProfile(userId, currentUser));
            } else {
              setUserProfile(newProfile);
            }
          } catch (createErr) {
            if (signal.aborted || currentSession !== session) return;
            setUserProfile(createFallbackProfile(userId, currentUser));
          }
        } else {
          setUserProfile(createFallbackProfile(userId, currentUser));
        }
      } else if (data) {
        setUserProfile(data);
      } else {
        setUserProfile(createFallbackProfile(userId, currentUser));
      }
    } catch (error) {
      if (signal.aborted || currentSession !== session) return;
      console.error('Error loading user profile:', error);
      setUserProfile(createFallbackProfile(userId, currentUser));
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      loadingProfileRef.current.delete(userId);
      profileLoadedRef.current.add(userId);
      if (!signal.aborted && currentSession === session) {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    if (!Object.keys(profileData).length) throw new Error('No profile data provided');

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};