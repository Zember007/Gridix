import { type ReactNode, useEffect, useSyncExternalStore } from "react";

import "driver.js/dist/driver.css";
import "./driver/gridix-driver-overrides.css";

import {
  startGridixDriverSpotlightObserver,
  stopGridixDriverSpotlightObserver,
} from "./driver/gridixDriverSpotlight";
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

  useEffect(() => {
    startGridixDriverSpotlightObserver();
    return stopGridixDriverSpotlightObserver;
  }, []);

  return (
    <div className="relative min-h-screen">
      <div style={{ pointerEvents: blocked ? "none" : "auto" }}>{children}</div>
    </div>
  );
}
