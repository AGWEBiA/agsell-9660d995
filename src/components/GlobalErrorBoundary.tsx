
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logSystemError } from '@/lib/error-logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  module?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logSystemError({
      message: error.message,
      module: this.props.module || 'GlobalErrorBoundary',
      severity: 'critical',
      stack: error.stack,
      context: { componentStack: errorInfo.componentStack }
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-background border rounded-lg m-4 shadow-sm">
          <div className="bg-destructive/10 p-3 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Ocorreu um erro inesperado nesta parte do sistema. Já notificamos nossa equipe técnica.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => this.setState({ hasError: false })} 
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-muted rounded text-left text-xs overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
