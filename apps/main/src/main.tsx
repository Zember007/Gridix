import { createRoot } from "react-dom/client";
import App from "@/app/App";
import "./index.css";
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    tracePropagationTargets: [/^https:\/\/app\.gridix\.live/],
    dsn: "https://52b57de545d74b53fb151945fbf8f82e@o4510747380809728.ingest.de.sentry.io/4510747384938576",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
}



createRoot(document.getElementById("root")!).render(<App />);
