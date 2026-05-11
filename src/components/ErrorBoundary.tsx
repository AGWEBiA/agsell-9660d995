import React, { Component, ErrorInfo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get organization from localStorage if available, as context might not be ready
      let organizationId = null;
      try {
        const orgData = localStorage.getItem('currentOrganization');
        if (orgData) {
          organizationId = JSON.parse(orgData).id;
        }
      } catch (e) {
        console.error("Error parsing organization from localStorage:", e);
      }

      await Promise.all([
        supabase.from('system_logs').insert({
          level: 'error',
          event: 'frontend_crash',
          source: 'ErrorBoundary',
          message: error.message || 'Frontend Uncaught Error',
          payload: {
            name: error.name,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
          },
          user_id: user?.id || null,
          organization_id: organizationId
        }),
        supabase.from('system_errors').insert({
          severity: 'high',
          module: 'Frontend',
          error_message: error.message || 'Frontend Uncaught Error',
          stack_trace: error.stack,
          error_details: errorInfo.componentStack,
          endpoint: window.location.pathname,
          status: 'open',
          user_id: user?.id || null,
          organization_id: organizationId,
          metadata: {
            url: window.location.href,
            userAgent: navigator.userAgent,
          }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log error to database:", logError);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0F172A",
          color: "#F8FAFC",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            width: "100%",
            background: "#111827",
            border: "1px solid #1F2937",
            borderRadius: 12,
            padding: 28,
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          <h1 style={{ fontSize: 22, margin: 0, marginBottom: 8, color: "#EF4444" }}>
            Ops! Algo deu errado.
          </h1>
          <p style={{ color: "#94A3B8", marginTop: 0, marginBottom: 20 }}>
            Ocorreu um erro inesperado ao carregar a aplicação. Você pode tentar
            recarregar a página ou voltar para o início.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <button
              onClick={this.handleReload}
              style={{
                background: "#EF4444",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Recarregar página
            </button>
            <button
              onClick={this.handleHome}
              style={{
                background: "#1F2937",
                color: "#F8FAFC",
                border: "1px solid #374151",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Voltar ao início
            </button>
            <button
              onClick={this.handleClearAndReload}
              style={{
                background: "transparent",
                color: "#94A3B8",
                border: "1px solid #374151",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Limpar cache e recarregar
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#0B1220",
                border: "1px solid #1F2937",
                borderRadius: 8,
                padding: 14,
                marginTop: 8,
              }}
            >
              <div style={{ color: "#F87171", fontWeight: 600, marginBottom: 6 }}>
                {error.name}: {error.message}
              </div>
              {(isDev || true) && (
                <details style={{ color: "#94A3B8" }}>
                  <summary style={{ cursor: "pointer", marginBottom: 8 }}>
                    Detalhes técnicos
                  </summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: 12,
                      lineHeight: 1.5,
                      maxHeight: 320,
                      overflow: "auto",
                      margin: 0,
                    }}
                  >
                    {error.stack}
                    {errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
