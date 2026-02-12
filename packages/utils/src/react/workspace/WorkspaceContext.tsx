import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type WorkspaceType = "developer" | "agent";

export interface WorkspaceOption {
  /**
   * Workspace id. `null` can be used for "own workspace" (developer).
   * For agent workspaces it should be a non-null application id.
   */
  id: string | null;
  label: string;
  type: "owner" | "manager" | "agent";
  developerInfo?: {
    full_name: string;
    company_name: string;
    email: string;
  };
  /**
   * Optional extra data for app-specific UI (kept intentionally untyped).
   * Avoid putting PII here unless necessary.
   */
  meta?: Record<string, unknown>;
}

export interface WorkspaceContextType {
  type: WorkspaceType;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  isManagerMode: boolean;
  availableWorkspaces: WorkspaceOption[];
  reloadWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = (): WorkspaceContextType => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
};

const loadFromStorage = (key: string): string | null => {
  try {
    const stored = localStorage.getItem(key);
    return stored === "null" || stored === null ? null : stored;
  } catch (e) {
    console.error("Error loading workspace from storage:", e);
    return null;
  }
};

const saveToStorage = (key: string, workspaceId: string | null) => {
  try {
    localStorage.setItem(key, workspaceId === null ? "null" : workspaceId);
  } catch (e) {
    console.error("Error saving workspace to storage:", e);
  }
};

export interface WorkspaceProviderProps {
  children: React.ReactNode;
  type: WorkspaceType;
  loadWorkspaces: () => Promise<WorkspaceOption[]>;
  /**
   * Used to invalidate / reload workspaces when upstream state changes.
   * Example: role, permissions, language.
   */
  reloadKey?: string;
  /**
   * When true and no workspace is selected, provider selects the first available workspace.
   * Recommended for agents (no `null` "own" workspace).
   */
  autoSelectFirst?: boolean;
  /**
   * Storage key used for persisting selection.
   * Default: `gridix_active_workspace_id:<type>`.
   */
  storageKey?: string;
  /**
   * Optional legacy key to migrate selection from.
   * If `storageKey` is empty, we will try to read from this key once and persist into `storageKey`.
   */
  migrateFromStorageKey?: string;
}

export function WorkspaceProvider({
  children,
  type,
  loadWorkspaces,
  reloadKey,
  autoSelectFirst = type === "agent",
  storageKey,
  migrateFromStorageKey,
}: WorkspaceProviderProps) {
  const effectiveStorageKey = storageKey ?? `gridix_active_workspace_id:${type}`;

  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const current = loadFromStorage(effectiveStorageKey);
    if (current !== null || !migrateFromStorageKey) return current;
    const legacy = loadFromStorage(migrateFromStorageKey);
    if (legacy !== null) saveToStorage(effectiveStorageKey, legacy);
    return legacy;
  });

  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceOption[]>([]);

  const setActiveWorkspaceId = (id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (typeof window !== "undefined") {
      saveToStorage(effectiveStorageKey, id);
    }
  };

  const reloadWorkspaces = async () => {
    const workspaces = await loadWorkspaces();
    setAvailableWorkspaces(workspaces);

    // Restore stored selection if still available; otherwise reset or auto-pick.
    const storedId = typeof window === "undefined" ? null : loadFromStorage(effectiveStorageKey);
    const isStoredAvailable =
      storedId === null
        ? workspaces.some((w) => w.id === null)
        : workspaces.some((w) => w.id === storedId);

    if (storedId !== null && isStoredAvailable) {
      setActiveWorkspaceIdState(storedId);
      return;
    }

    // If current active is no longer available, clear it.
    const isCurrentAvailable =
      activeWorkspaceId === null
        ? workspaces.some((w) => w.id === null)
        : workspaces.some((w) => w.id === activeWorkspaceId);

    if (!isCurrentAvailable) {
      if (autoSelectFirst && workspaces.length > 0) {
        const first = workspaces[0];
        setActiveWorkspaceId(first?.id ?? null);
      } else {
        setActiveWorkspaceId(null);
      }
    } else if (autoSelectFirst && activeWorkspaceId === null && !workspaces.some((w) => w.id === null)) {
      // No "own" workspace exists (agents), but active is null -> pick first.
      const first = workspaces[0];
      if (first) setActiveWorkspaceId(first.id);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (cancelled) return;
        await reloadWorkspaces();
      } catch (e) {
        console.error("Failed to reload workspaces:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, type]);

  const isManagerMode = activeWorkspaceId !== null;

  const value = useMemo<WorkspaceContextType>(
    () => ({
      type,
      activeWorkspaceId,
      setActiveWorkspaceId,
      isManagerMode,
      availableWorkspaces,
      reloadWorkspaces,
    }),
    [type, activeWorkspaceId, availableWorkspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/**
 * Provider for apps that do not use workspaces (e.g. partners app).
 * Supplies empty workspaces and no-op handlers so components like SimplifiedSidebar
 * that call useWorkspace() do not throw when showWorkspaceSwitcher is false.
 */
const NO_WORKSPACE_VALUE: WorkspaceContextType = {
  type: "developer",
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
  isManagerMode: false,
  availableWorkspaces: [],
  reloadWorkspaces: async () => {},
};

export function NoWorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceContext.Provider value={NO_WORKSPACE_VALUE}>
      {children}
    </WorkspaceContext.Provider>
  );
}

