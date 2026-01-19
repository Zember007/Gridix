import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseAuthInitPromise } from '@/shared/api/supabase';
import { processPendingReferralAfterAuth } from '@/features/partnerProgram/referralTracking';
import { resetUsertour } from '@/integrations/usertour';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  onboarding?: {
    admin_main_done?: boolean;
    project_creation_done?: boolean;
    partners_done?: boolean;
    project_editor_done_ids?: string[];
    pending_next?: string | null;
    pending_project_id?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  requiresPasswordSetup: boolean;
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
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);

  const loadingProfileRef = useRef<Set<string>>(new Set());
  const currentUserIdRef = useRef<string | null>(null);

  const createFallbackProfile = (userId: string, currentUser: User): UserProfile => ({
    id: userId,
    email: currentUser?.email || null,
    full_name: currentUser?.user_metadata?.full_name || null,
    avatar_url: null,
    company_name: currentUser?.user_metadata?.company_name || null,
    phone: currentUser?.user_metadata?.phone || null,
    onboarding: {
      admin_main_done: false,
      project_creation_done: false,
      partners_done: false,
      project_editor_done_ids: [],
      pending_next: null,
      pending_project_id: null,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const loadUserProfile = useCallback(async (
    userId: string,
    currentUser: User,
    signal: AbortSignal
  ) => {
    // Проверяем, что userId все еще актуален
    if (currentUserIdRef.current !== userId) {
      // Пользователь изменился, не загружаем профиль
      return;
    }

    // Предотвращаем параллельные загрузки для одного пользователя
    if (loadingProfileRef.current.has(userId)) {
      return;
    }

    loadingProfileRef.current.add(userId);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      await processPendingReferralAfterAuth();

      // Проверяем еще раз после async операции
      if (signal.aborted || currentUserIdRef.current !== userId) {
        return;
      }

      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Race the request against a proper timeout Promise.
      // NOTE: throwing inside setTimeout does NOT reject the awaiting Promise.
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT);
      });

      // Define the expected Supabase response type
      const { data, error } = await Promise.race([
        queryPromise as unknown as Promise<{ data: UserProfile | null; error: unknown }>,
        timeoutPromise,
      ]);

      // Проверяем актуальность userId после запроса
      if (signal.aborted || currentUserIdRef.current !== userId) {
        return;
      }

      if (error) {
        const errorCode =
          typeof error === 'object' && error !== null && 'code' in error
            ? (error as { code?: unknown }).code
            : undefined;

        if (errorCode === 'PGRST116') {
          // Профиль не найден, создаем новый
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
                  onboarding: {
                    admin_main_done: false,
                    project_creation_done: false,
                    partners_done: false,
                    project_editor_done_ids: [],
                    pending_next: null,
                    pending_project_id: null,
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();

            // Проверяем актуальность после создания
            if (signal.aborted || currentUserIdRef.current !== userId) {
              return;
            }

            if (createError) {
              console.error('Error creating profile:', createError);
              setUserProfile(createFallbackProfile(userId, currentUser));
            } else {
              setUserProfile(newProfile);
            }
          } catch (createErr) {
            if (signal.aborted || currentUserIdRef.current !== userId) {
              return;
            }
            console.error('Error creating profile:', createErr);
            setUserProfile(createFallbackProfile(userId, currentUser));
          }
        } else {
          console.error('Error loading profile:', error);
          setUserProfile(createFallbackProfile(userId, currentUser));
        }
      } else if (data) {
        // Успешно загружен профиль
        setUserProfile(data);
      } else {
        // Данные не получены, используем fallback
        setUserProfile(createFallbackProfile(userId, currentUser));
      }
    } catch (error) {
      if (signal.aborted || currentUserIdRef.current !== userId) {
        return;
      }
      console.error('Error loading user profile:', error);
      setUserProfile(createFallbackProfile(userId, currentUser));
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      loadingProfileRef.current.delete(userId);
      
      // Устанавливаем loading в false только если это все еще актуальный пользователь
      if (!signal.aborted && currentUserIdRef.current === userId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const initializeAuth = async () => {
      try {
        // If this tab was opened via a partner "login as client" link (#access_token=...),
        // initialize the tab-scoped session first so `getSession()` returns the right user.
        await supabaseAuthInitPromise;
        const { data: { session } } = await supabase.auth.getSession();
        if (abortController.signal.aborted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          currentUserIdRef.current = session.user.id;
          // Проверяем, требуется ли установка пароля
          const requiresPassword = session.user.user_metadata?.requires_password_setup === true;
          setRequiresPasswordSetup(requiresPassword);

          await loadUserProfile(session.user.id, session.user, abortController.signal);
        } else {
          currentUserIdRef.current = null;
          setLoading(false);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (abortController.signal.aborted) return;

      const newUserId = newSession?.user?.id ?? null;
      const previousUserId = currentUserIdRef.current;

      // Если пользователь изменился, очищаем профиль только после подтверждения
      if (previousUserId !== null && previousUserId !== newUserId) {
        // Не очищаем сразу - дождемся загрузки нового профиля
        currentUserIdRef.current = newUserId;
        loadingProfileRef.current.clear();
      } else if (newUserId) {
        currentUserIdRef.current = newUserId;
      } else {
        currentUserIdRef.current = null;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Проверяем, требуется ли установка пароля
        const requiresPassword = newSession.user.user_metadata?.requires_password_setup === true;
        console.log('requiresPassword', requiresPassword);
        setRequiresPasswordSetup(requiresPassword);

        await loadUserProfile(newSession.user.id, newSession.user, abortController.signal);
      } else {
        // Очищаем только если точно нет пользователя
        setUserProfile(null);
        setRequiresPasswordSetup(false);
        loadingProfileRef.current.clear();
        setLoading(false);
      }
    });

    return () => {
      abortController.abort();
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Usertour: initialize/identify only after auth + profile are ready.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      resetUsertour();
      return;
    } 
  }, [loading, user, userProfile]);

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
    requiresPasswordSetup,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};