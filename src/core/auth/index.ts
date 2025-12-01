/**
 * Auth Module - Central Export
 * Core authentication and authorization functionality
 */

export { AuthProvider, useAuth } from './contexts/auth-context';
export { ProtectedRoute } from './components/protected-route';
export { useRole } from './hooks/use-role';
export { usePermissions } from './hooks/use-permissions';
