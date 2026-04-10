import { useEffect, useState } from "react";
import {
  subscribeChecklistPanelOpen,
  type ChecklistPanelOpenPayload,
} from "@gridix/utils/integrations";

type Options = { scope: "admin" } | { scope: "project"; projectId: string };

/**
 * Increments when `requestOpenChecklistPanel` matches this scope (and project, if any).
 * Parent can `useEffect` on the number to expand the panel.
 */
export function useChecklistOpenSignal(options: Options): number {
  const [signal, setSignal] = useState(0);
  const scope = options.scope;
  const projectId = options.scope === "project" ? options.projectId : undefined;

  useEffect(() => {
    return subscribeChecklistPanelOpen((payload) => {
      if (scope === "admin") {
        if (payload.scope === "admin") setSignal((s) => s + 1);
        return;
      }
      if (
        payload.scope === "project" &&
        projectId !== undefined &&
        payload.projectId === projectId
      ) {
        setSignal((s) => s + 1);
      }
    });
  }, [scope, projectId]);

  return signal;
}
