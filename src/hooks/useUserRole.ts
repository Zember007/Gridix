import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ManagerRole {
  id: string;
  developer_id: string;
  manager_id: string;
  email: string;
  full_name: string;
  status: 'pending' | 'active' | 'suspended';
  developer_profile?: {
    full_name: string;
    company_name: string;
    email: string;
  };
}

interface ManagerAccountWithProfile {
  id: string;
  developer_id: string;
  manager_id: string;
  email: string;
  full_name: string;
  status: string;
  user_profiles?: {
    full_name?: string;
    company_name?: string;
    email?: string;
  };
}

export interface UserRole {
  type: 'developer' | 'manager' | 'loading'; // Убрали 'both' - пользователь может быть только одного типа
  managerData?: ManagerRole[];  // Массив для поддержки нескольких застройщиков
  developerIds?: string[];      // Массив ID застройщиков
  primaryDeveloperId?: string;  // Основной застройщик (первый)
}

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>({ type: 'loading' });
  const [loading, setLoading] = useState(true);
  const isCheckingRef = useRef(false);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const checkUserRole = async () => {
      // Предотвращаем множественные одновременные запросы
      if (isCheckingRef.current) {
        return;
      }

      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      // Проверяем, изменился ли пользователь
      if (userIdRef.current === user.id && userRole.type !== 'loading') {
        return;
      }

      isCheckingRef.current = true;
      userIdRef.current = user.id;

      try {
        // Получаем account_type из user_profiles
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading user profile:', profileError);
        }

        const accountType = userProfile?.account_type || 'developer';

        // Проверяем, является ли пользователь менеджером (может быть у нескольких застройщиков)
        const { data: managerAccounts, error: managerError } = await supabase
          .from('manager_accounts')
          .select(`
          *,
          user_profiles!fk_manager_accounts_developer_profile (
            full_name,
            company_name,
            email
          )
        `)
          .eq('manager_id', user.id)
          .eq('status', 'active');

        if (managerError) {
          console.error('Error checking manager role:', managerError);
        }

        // Упрощенная логика: только 'developer' или 'manager'
        if (accountType === 'manager' && managerAccounts && managerAccounts.length > 0) {
          // Пользователь является менеджером
          const accountsArray = managerAccounts as unknown as ManagerAccountWithProfile[];
          const managerData: ManagerRole[] = accountsArray.map((account) => ({
            id: account.id,
            developer_id: account.developer_id,
            manager_id: account.manager_id,
            email: account.email,
            full_name: account.full_name,
            status: account.status as 'pending' | 'active' | 'suspended',
            developer_profile: account.user_profiles ? {
              full_name: account.user_profiles.full_name || '',
              company_name: account.user_profiles.company_name || '',
              email: account.user_profiles.email || ''
            } : undefined
          }));

          const developerIds = managerAccounts.map(account => account.developer_id);

          setUserRole({
            type: 'manager',
            managerData,
            developerIds,
            primaryDeveloperId: developerIds[0]
          });
        } else {
          // Пользователь является застройщиком
          setUserRole({
            type: 'developer',
            developerIds: [user.id],
            primaryDeveloperId: user.id
          });
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        // В случае ошибки считаем пользователя застройщиком
        setUserRole({
          type: 'developer',
          developerIds: user?.id ? [user.id] : [],
          primaryDeveloperId: user?.id
        });
      } finally {
        setLoading(false);
        isCheckingRef.current = false;
      }
    };

    checkUserRole();
  }, [user, authLoading, userRole.type]);

  // Мемоизируем возвращаемый объект, чтобы избежать лишних ре-рендеров
  return useMemo(() => ({
    userRole,
    loading: loading || authLoading,
    isManager: userRole.type === 'manager',
    isDeveloper: userRole.type === 'developer',
    developerIds: userRole.developerIds || [],
    primaryDeveloperId: userRole.primaryDeveloperId,
    // Для обратной совместимости
    developerId: userRole.primaryDeveloperId
  }), [userRole, loading, authLoading]);
};
