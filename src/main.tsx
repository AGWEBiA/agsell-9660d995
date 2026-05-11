import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { initGlobalErrorHandling } from "./lib/error-logger";

// build: 2026-05-11-v1 — integrated centralized logging and resilience
initGlobalErrorHandling();

// Inject dynamic deploy ID for correlation
window.__DEPLOY_ID__ = "deploy_" + new Date().toISOString().split('T')[0] + "_" + Math.random().toString(36).substring(7);

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary module="Root">
    <App />
  </GlobalErrorBoundary>
);
