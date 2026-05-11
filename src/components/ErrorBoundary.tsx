import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { logSystemError } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    logSystemError({
      message: error.message,
      module: "ErrorBoundary",
      severity: "high",
      stack: error.stack,
      context: { componentStack: errorInfo.componentStack }
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] w-full flex flex-col items-center justify-center p-6 bg-destructive/5 rounded-lg border border-destructive/20 my-4">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Algo deu errado nesta seção
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            Ocorreu um erro ao carregar este componente. Nossa equipe já foi notificada.
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;