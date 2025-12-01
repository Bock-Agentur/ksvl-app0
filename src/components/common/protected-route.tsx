/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication and/or specific roles.
 * Redirects to login if not authenticated, or shows access denied if insufficient permissions.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/hooks';
import { UserRole } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[]; // If not specified, only authentication is required
  fallbackPath?: string; // Where to redirect if access denied (default: '/')
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  fallbackPath = '/' 
}: ProtectedRouteProps) {
  const { currentUser, currentRole, hasAnyRole, isLoading } = useRole();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If no specific roles required, just being authenticated is enough
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasAccess = hasAnyRole(requiredRoles);

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Zugriff verweigert</AlertTitle>
          <AlertDescription>
            Sie haben keine Berechtigung, diese Seite zu sehen.
            {requiredRoles && requiredRoles.length > 0 && (
              <>
                <br />
                Erforderliche Rolle(n): {requiredRoles.join(', ')}
                <br />
                Ihre Rolle: {currentRole}
              </>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-6">
          <a 
            href={fallbackPath}
            className="text-primary hover:underline"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
