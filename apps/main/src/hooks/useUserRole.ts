import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useAuth } from "@/contexts/AuthContext";

export interface ManagerRole {
  id: string;
  developer_id: string;
  manager_id: string;
  email: string;
  full_name: string;
  status: "pending" | "active" | "suspended";
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
  is_demo_viewer: boolean;
  user_profiles?: {
    full_name?: string;
    company_name?: string;
    email?: string;
  };
}

export interface UserRole {
  type: "developer" | "manager" | "loading"; // Убрали 'both' - пользователь может быть только одного типа
  managerData?: ManagerRole[]; // Массив для поддержки нескольких застройщиков
  developerIds?: string[]; // Массив ID застройщиков
  primaryDeveloperId?: string | undefined; // Основной застройщик (первый)
  /** Demo workspaces the user joined as a read-only viewer (doesn't change primary role). */
  demoManagerData?: ManagerRole[];
}

const buildDeveloperRole = (userId: string | undefined): UserRole => ({
  type: "developer",
  developerIds: userId ? [userId] : [],
  primaryDeveloperId: userId,
});

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: userRole, isLoading } = useQuery<UserRole>({
    queryKey: ["userRole", user?.id],
    enabled: !authLoading && !!user,
    // Роль пользователя меняется крайне редко, можем считать её вечно свежей
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<UserRole> => {
      if (!user) {
        return { type: "loading" };
      }

      try {
        // Всегда проверяем, есть ли у пользователя активные manager_accounts
        // Это позволяет корректно определять роль даже если в user_profiles нет account_type = 'manager'
        const { data: managerAccounts, error: managerError } = await supabase
          .from("manager_accounts")
          .select(
            `
            *,
            user_profiles!fk_manager_accounts_developer_profile (
              full_name,
              company_name,
              email
            )
          `,
          )
          .eq("manager_id", user.id)
          .eq("status", "active");

        if (managerError) {
          console.error("Error checking manager role:", managerError);
        }

        if (managerAccounts && managerAccounts.length > 0) {
          const accountsArray =
            managerAccounts as unknown as ManagerAccountWithProfile[];

          const toManagerRole = (
            account: ManagerAccountWithProfile,
          ): ManagerRole => ({
            id: account.id,
            developer_id: account.developer_id,
            manager_id: account.manager_id,
            email: account.email,
            full_name: account.full_name,
            status: account.status as "pending" | "active" | "suspended",
            developer_profile: {
              full_name: account.user_profiles?.full_name || "",
              company_name: account.user_profiles?.company_name || "",
              email: account.user_profiles?.email || "",
            },
          });

          // Demo-viewer accounts must NOT change the primary role — a developer who
          // joined the demo stays a developer.
          const realAccounts = accountsArray.filter((a) => !a.is_demo_viewer);
          const demoAccounts = accountsArray.filter((a) => a.is_demo_viewer);

          if (realAccounts.length > 0) {
            // Пользователь является менеджером (есть реальные приглашения)
            const managerData = realAccounts.map(toManagerRole);
            const developerIds = realAccounts.map((a) => a.developer_id);

            return {
              type: "manager",
              managerData,
              developerIds,
              primaryDeveloperId: developerIds[0],
              demoManagerData: demoAccounts.map(toManagerRole),
            };
          }

          if (demoAccounts.length > 0) {
            // Только демо-доступ — остаётся застройщиком, но с демо воркспейсами
            return {
              ...buildDeveloperRole(user.id),
              demoManagerData: demoAccounts.map(toManagerRole),
            };
          }
        }

        // Пользователь является застройщиком (по умолчанию или если нет активных manager_accounts)
        return buildDeveloperRole(user.id);
      } catch (error) {
        console.error("Error determining user role:", error);
        // В случае ошибки считаем пользователя застройщиком
        return buildDeveloperRole(user.id);
      }
    },
  });

  // Мемоизируем возвращаемый объект, чтобы избежать лишних ре-рендеров
  return useMemo(() => {
    // Определяем финальную роль: если данных ещё нет - считаем, что идёт загрузка
    const finalUserRole: UserRole = userRole || { type: "loading" };

    return {
      userRole: finalUserRole,
      loading: isLoading || authLoading,
      isManager: finalUserRole.type === "manager",
      isDeveloper: finalUserRole.type === "developer",
      developerIds: finalUserRole.developerIds || [],
      primaryDeveloperId: finalUserRole.primaryDeveloperId,
      // Для обратной совместимости
      developerId: finalUserRole.primaryDeveloperId,
    };
  }, [userRole, isLoading, authLoading]);
};
