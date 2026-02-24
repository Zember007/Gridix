import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  loadProjectEditorData,
  type ProjectEditorLoadResult,
} from "../api/projectEditorApi";

interface ProjectEditorDataContextValue {
  data: ProjectEditorLoadResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ProjectEditorDataContext =
  createContext<ProjectEditorDataContextValue | null>(null);

interface ProjectEditorDataProviderProps {
  projectId: string | null;
  enabled: boolean;
  children: ReactNode;
}

export function ProjectEditorDataProvider({
  projectId,
  enabled,
  children,
}: ProjectEditorDataProviderProps) {
  const [data, setData] = useState<ProjectEditorLoadResult | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId && enabled));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loadProjectEditorData(projectId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const value: ProjectEditorDataContextValue = {
    data,
    loading,
    error,
    refresh: load,
  };

  return (
    <ProjectEditorDataContext.Provider value={value}>
      {children}
    </ProjectEditorDataContext.Provider>
  );
}

// Hook in same file as context is a common pattern; Fast Refresh warning accepted.
// eslint-disable-next-line react-refresh/only-export-components -- context consumer hook
export function useProjectEditorDataContext() {
  const ctx = useContext(ProjectEditorDataContext);
  return ctx;
}
