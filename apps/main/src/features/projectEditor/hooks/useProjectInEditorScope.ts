import { useProject } from "@/entities/project/queries/useProjects";
import { useProjectEditorDataContext } from "../context/ProjectEditorDataContext";

/**
 * Returns project from editor context when inside ProjectEditorDataProvider and data is loaded,
 * so no separate projects?select=* request is made. Otherwise falls back to useProject(projectId).
 */
export function useProjectInEditorScope(projectId: string | undefined) {
  const editorContext = useProjectEditorDataContext();
  const projectFromEditor = editorContext?.data?.project ?? null;

  return {
    project: projectFromEditor,
    loading: editorContext?.data != null ? false : true,
    error: editorContext?.error,
    refresh: editorContext?.refresh,
  };
}
