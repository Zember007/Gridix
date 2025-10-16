import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';

interface WorkspaceContextType {
  activeWorkspaceId: string | null; // null = собственный workspace, иначе ID застройщика
  setActiveWorkspaceId: (id: string | null) => void;
  isManagerMode: boolean; // true если активен workspace где пользователь является менеджером
  availableWorkspaces: WorkspaceOption[];
}

export interface WorkspaceOption {
  id: string | null; // null для собственного workspace
  label: string;
  type: 'owner' | 'manager';
  developerInfo?: {
    full_name: string;
    company_name: string;
    email: string;
  };
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const { userRole, isManager, isDeveloper, developerIds } = useUserRole();
  const { t } = useLanguage();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceOption[]>([]);

  // Определяем доступные workspace при изменении роли пользователя
  useEffect(() => {
    if (userRole.type === 'loading') return;

    const workspaces: WorkspaceOption[] = [];

    // Собственный workspace (всегда первый)
    if (isDeveloper) {
      workspaces.push({
        id: null,
        label: t('workspace.myWorkspace'),
        type: 'owner'
      });
    }

    // Manager workspaces
    if (isManager && userRole.managerData) {
      userRole.managerData.forEach((managerData) => {
        workspaces.push({
          id: managerData.developer_id,
          label: managerData.developer_profile?.company_name || 
                 managerData.developer_profile?.full_name || 
                 'Workspace',
          type: 'manager',
          developerInfo: managerData.developer_profile
        });
      });
    }

    setAvailableWorkspaces(workspaces);

    // Если текущий activeWorkspaceId больше не доступен, сбрасываем на собственный
    if (activeWorkspaceId !== null && !workspaces.find(w => w.id === activeWorkspaceId)) {
      setActiveWorkspaceId(null);
    }
  }, [userRole, isManager, isDeveloper, activeWorkspaceId, t]);

  // Определяем, находимся ли мы в режиме менеджера
  const isManagerMode = activeWorkspaceId !== null;

  const value = {
    activeWorkspaceId,
    setActiveWorkspaceId,
    isManagerMode,
    availableWorkspaces
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

