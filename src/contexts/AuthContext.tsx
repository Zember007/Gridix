import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && !profileLoaded) {
        loadUserProfile(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    // Слушаем изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && !profileLoaded) {
        await loadUserProfile(session.user.id, session.user);
      } else if (!session?.user) {
        setUserProfile(null);
        setProfileLoaded(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string, currentUser?: any) => {
    if (profileLoaded) return; // Предотвращаем дублирование запросов
    
    try {
      // Делаем запрос к профилю с таймаутом
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

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
      setProfileLoaded(true);
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