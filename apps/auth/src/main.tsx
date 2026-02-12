import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
// Load Supabase so hash tokens (#access_token=...&refresh_token=...) are consumed as early as possible
import "@gridix/utils/api";
import App from "@/app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

