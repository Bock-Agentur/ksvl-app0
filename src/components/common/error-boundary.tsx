/**
 * React Error Boundary für robuste Fehlerbehandlung
 * Verhindert komplette App-Abstürze bei Komponentenfehlern
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  boundary?: string; // Identifiziert welche Komponente den Fehler verursacht hat
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const boundary = this.props.boundary || 'Unknown';
    
    // Log error details
    logger.error('ERROR_BOUNDARY', `Error in ${boundary}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      boundary,
    });

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Etwas ist schiefgelaufen</CardTitle>
              <CardDescription>
                Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              {!import.meta.env.PROD && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-lg text-left">
                  <summary className="cursor-pointer font-medium text-sm">
                    Entwickler-Details
                  </summary>
                  <div className="mt-2 text-xs font-mono">
                    <p className="font-semibold">Fehler:</p>
                    <p className="text-destructive">{this.state.error.message}</p>
                    
                    {this.state.error.stack && (
                      <>
                        <p className="font-semibold mt-2">Stack Trace:</p>
                        <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border mt-1">
                          {this.state.error.stack}
                        </pre>
                      </>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <p className="font-semibold mt-2">Komponenten Stack:</p>
                        <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Erneut versuchen
              </Button>
              <Button onClick={this.handleGoHome} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Zur Startseite
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundary?: string,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary boundary={boundary} fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized error boundaries for different parts of the app
export const SlotErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary boundary="Slot Management">
    {children}
  </ErrorBoundary>
);

export const UserErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary boundary="User Management">
    {children}
  </ErrorBoundary>
);

export const CalendarErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary boundary="Calendar">
    {children}
  </ErrorBoundary>
);