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

const WORKSPACE_STORAGE_KEY = 'gridix_active_workspace_id';

// Загрузка activeWorkspaceId из localStorage
const loadWorkspaceFromStorage = (): string | null => {
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    return stored === 'null' || stored === null ? null : stored;
  } catch (error) {
    console.error('Error loading workspace from localStorage:', error);
    return null;
  }
};

// Сохранение activeWorkspaceId в localStorage
const saveWorkspaceToStorage = (workspaceId: string | null) => {
  try {
    if (workspaceId === null) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, 'null');
    } else {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    }
  } catch (error) {
    console.error('Error saving workspace to localStorage:', error);
  }
};

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const { userRole, isManager, isDeveloper, developerIds } = useUserRole();
  const { t } = useLanguage();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(loadWorkspaceFromStorage);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceOption[]>([]);

  // Обертка для setActiveWorkspaceId с сохранением в localStorage
  const setActiveWorkspaceId = (id: string | null) => {
    setActiveWorkspaceIdState(id);
    saveWorkspaceToStorage(id);
  };

  // Определяем доступные workspace при изменении роли пользователя
  useEffect(() => {
    if (userRole.type === 'loading') return;

    const workspaces: WorkspaceOption[] = [];

      workspaces.push({
        id: null,
        label: t('workspace.myWorkspace'),
        type: 'owner'
      });

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

    // Восстанавливаем workspace из localStorage, если он доступен
    const storedWorkspaceId = loadWorkspaceFromStorage();
    if (storedWorkspaceId !== null) {
      // Проверяем, доступен ли сохраненный workspace
      const isAvailable = workspaces.find(w => w.id === storedWorkspaceId);
      if (isAvailable) {
        setActiveWorkspaceIdState(storedWorkspaceId);
      } else {
        // Если сохраненный workspace недоступен, сбрасываем на собственный
        setActiveWorkspaceId(null);
      }
    } else if (activeWorkspaceId !== null && !workspaces.find(w => w.id === activeWorkspaceId)) {
      // Если текущий activeWorkspaceId больше не доступен, сбрасываем на собственный
      setActiveWorkspaceId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole.type, isManager, JSON.stringify(userRole.managerData), t]);

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

