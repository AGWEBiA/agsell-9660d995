import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error tracking for better debugging in production
// Global error tracking for better debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error:", { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled Rejection:", event.reason);
};

createRoot(document.getElementById("root")!).render(<App />);
