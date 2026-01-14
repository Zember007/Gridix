import { ReactNode, useSyncExternalStore } from "react";
import { getUsertourUiBlocked, subscribeUsertourUiBlocked } from "@/integrations/usertour";

function useUsertourUiBlocked(): boolean {
  return useSyncExternalStore(subscribeUsertourUiBlocked, getUsertourUiBlocked, () => false);
}

export function UsertourBlockingGate({ children }: { children: ReactNode }) {
  const blocked = useUsertourUiBlocked();

  return (
    <div className="relative min-h-screen">
      <div style={{ pointerEvents: blocked ? "none" : "auto" }}>{children}</div>

      {blocked && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
          style={{ pointerEvents: "auto" }}
          aria-label="Loading onboarding"
          role="status"
        >
          <div className="rounded-xl bg-white/90 shadow-lg px-5 py-4 flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-b-gray-900" />
            <div className="text-sm font-medium text-gray-900">Загрузка обучения…</div>
          </div>
        </div>
      )}
    </div>
  );
}

