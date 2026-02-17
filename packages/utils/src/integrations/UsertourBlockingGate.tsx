import { type ReactNode, useSyncExternalStore } from "react";

import { getUsertourUiBlocked, subscribeUsertourUiBlocked } from "./usertour";
/* import { FullPageLoaderView } from "@gridix/ui"; */

function useUsertourUiBlocked(): boolean {
  return useSyncExternalStore(
    subscribeUsertourUiBlocked,
    getUsertourUiBlocked,
    () => false,
  );
}

export function UsertourBlockingGate({ children }: { children: ReactNode }) {
  const blocked = useUsertourUiBlocked();

  return (
    <div className="relative min-h-screen">
      <div style={{ pointerEvents: blocked ? "none" : "auto" }}>{children}</div>
    </div>
  );
}
