import { useState, useEffect } from 'react';
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
  type: 'developer' | 'manager' | 'both' | 'loading'; // 'both' - пользователь и застройщик, и менеджер
  managerData?: ManagerRole[];  // Массив для поддержки нескольких застройщиков
  developerIds?: string[];      // Массив ID застройщиков
  primaryDeveloperId?: string;  // Основной застройщик (первый)
}

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>({ type: 'loading' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
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

        // Проверяем, есть ли у пользователя собственные проекты (является ли застройщиком)
        const { data: ownProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        const isDeveloperWithProjects = (ownProjects && ownProjects.length > 0);

        if (managerAccounts && managerAccounts.length > 0) {
        console.log('managerAccounts', managerAccounts);
        
          // Пользователь является менеджером (и возможно также застройщиком)
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
            type: isDeveloperWithProjects ? 'both' : 'manager', // Новый тип 'both' если пользователь и застройщик, и менеджер
            managerData,
            developerIds,
            primaryDeveloperId: isDeveloperWithProjects ? user.id : developerIds[0] // Если пользователь и застройщик, то его ID как основной
          });
        } else {
          // Пользователь является только застройщиком
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
      }
    };

    checkUserRole();
  }, [user, authLoading]);

  return {
    userRole,
    loading: loading || authLoading,
    isManager: userRole.type === 'manager' || userRole.type === 'both',
    isDeveloper: userRole.type === 'developer' || userRole.type === 'both',
    developerIds: userRole.developerIds || [],
    primaryDeveloperId: userRole.primaryDeveloperId,
    // Для обратной совместимости
    developerId: userRole.primaryDeveloperId
  };
};
