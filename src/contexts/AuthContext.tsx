import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Используем refs для отслеживания состояния загрузки и предотвращения дублирования
  const loadingProfileRef = useRef<Set<string>>(new Set());
  const profileLoadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Получаем текущую сессию
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Слушаем изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user);
      } else {
        setUserProfile(null);
        // Очищаем кэш при выходе
        profileLoadedRef.current.clear();
        loadingProfileRef.current.clear();
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, currentUser: User) => {
    // Проверяем, не загружается ли уже профиль для этого пользователя
    if (loadingProfileRef.current.has(userId)) {
      return;
    }
    
    // Проверяем, не загружен ли уже профиль для этого пользователя
    if (profileLoadedRef.current.has(userId)) {
      setLoading(false);
      return;
    }

    // Добавляем userId в множество загружающихся профилей
    loadingProfileRef.current.add(userId);
    
    try {
      // Делаем запрос к профилю с таймаутом
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        // Если профиль не найден, создаем базовый профиль
        if (error.code === 'PGRST116') {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([{
                id: userId,
                email: currentUser?.email || null,
                full_name: currentUser?.user_metadata?.full_name || null,
                company_name: currentUser?.user_metadata?.company_name || null,
                phone: currentUser?.user_metadata?.phone || null
              }])
              .select()
              .single();

            if (createError) {
              // Если создание профиля не удалось, создаем минимальный профиль локально
              setUserProfile({
                id: userId,
                email: currentUser?.email || null,
                full_name: currentUser?.user_metadata?.full_name || null,
                avatar_url: null,
                company_name: currentUser?.user_metadata?.company_name || null,
                phone: currentUser?.user_metadata?.phone || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            } else {
              setUserProfile(newProfile);
            }
          } catch (createErr) {
            // Fallback: создаем минимальный профиль локально
            setUserProfile({
              id: userId,
              email: currentUser?.email || null,
              full_name: currentUser?.user_metadata?.full_name || null,
              avatar_url: null,
              company_name: currentUser?.user_metadata?.company_name || null,
              phone: currentUser?.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } else {
          // Для других ошибок тоже создаем fallback профиль
          setUserProfile({
            id: userId,
            email: currentUser?.email || null,
            full_name: currentUser?.user_metadata?.full_name || null,
            avatar_url: null,
            company_name: currentUser?.user_metadata?.company_name || null,
            phone: currentUser?.user_metadata?.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Создаем fallback профиль для любых ошибок
      setUserProfile({
        id: userId,
        email: currentUser?.email || null,
        full_name: currentUser?.user_metadata?.full_name || null,
        avatar_url: null,
        company_name: currentUser?.user_metadata?.company_name || null,
        phone: currentUser?.user_metadata?.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      // Удаляем userId из множества загружающихся профилей
      loadingProfileRef.current.delete(userId);
      // Добавляем userId в множество загруженных профилей
      profileLoadedRef.current.add(userId);
      setLoading(false);
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

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
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