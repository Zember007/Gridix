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

export interface UserRole {
  type: 'developer' | 'manager' | 'loading';
  managerData?: ManagerRole;
  developerId?: string;
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
        // Проверяем, является ли пользователь менеджером
        const { data: managerAccount, error: managerError } = await supabase
          .from('manager_accounts')
          .select(`
            *,
            user_profiles!developer_id (
              full_name,
              company_name,
              email
            )
          `)
          .eq('manager_id', user.id)
          .eq('status', 'active')
          .single();

        if (managerError && managerError.code !== 'PGRST116') {
          console.error('Error checking manager role:', managerError);
        }

        if (managerAccount) {
          // Пользователь является менеджером
          setUserRole({
            type: 'manager',
            managerData: {
              ...managerAccount,
              developer_profile: managerAccount.user_profiles
            },
            developerId: managerAccount.developer_id
          });
        } else {
          // Пользователь является застройщиком
          setUserRole({
            type: 'developer',
            developerId: user.id
          });
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        // В случае ошибки считаем пользователя застройщиком
        setUserRole({
          type: 'developer',
          developerId: user?.id
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
    isManager: userRole.type === 'manager',
    isDeveloper: userRole.type === 'developer',
    developerId: userRole.developerId
  };
};
