import { useProject } from "@/entities/project/queries/useProjects";
import { useProjectEditorDataContext } from "../context/ProjectEditorDataContext";

/**
 * Returns project from editor context when inside ProjectEditorDataProvider and data is loaded,
 * so no separate projects?select=* request is made. Otherwise falls back to useProject(projectId).
 */
export function useProjectInEditorScope(projectId: string | undefined) {
  const editorContext = useProjectEditorDataContext();
  const projectFromEditor = editorContext?.data?.project ?? null;
  const fallbackProjectQuery = useProject(
    editorContext ? undefined : projectId,
  );

  if (editorContext) {
    return {
      project: projectFromEditor,
      loading: editorContext.loading,
      error: editorContext.error,
      refresh: editorContext.refresh,
    };
  }

  return {
    project: fallbackProjectQuery.project,
    loading: fallbackProjectQuery.loading,
    error: fallbackProjectQuery.error,
    refresh: fallbackProjectQuery.refresh,
  };
}
