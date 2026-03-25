import { type ReactNode, useSyncExternalStore } from "react";

import {
  getOnboardingUiBlocked,
  subscribeOnboardingUiBlocked,
} from "./onboardingUiBlock";

function useOnboardingUiBlocked(): boolean {
  return useSyncExternalStore(
    subscribeOnboardingUiBlocked,
    getOnboardingUiBlocked,
    () => false,
  );
}

export function OnboardingBlockingGate({ children }: { children: ReactNode }) {
  const blocked = useOnboardingUiBlocked();

  return (
    <div className="relative min-h-screen">
      <div style={{ pointerEvents: blocked ? "none" : "auto" }}>{children}</div>
    </div>
  );
}
