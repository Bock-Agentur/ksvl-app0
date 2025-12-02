import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";
import { RoleProvider } from "@/hooks";
import { ProtectedRoute } from "@/components/common/protected-route";
import { ROUTES } from "@/lib/registry/routes";
import { TabRedirect } from "@/components/common/tab-redirect";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";
import { FileManager } from "./pages/FileManager";
import { Reports } from "./pages/Reports";
import { Users } from "./pages/Users";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import SettingsManager from "./pages/SettingsManager";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            <ErrorBoundary boundary="Application Root">
              <BrowserRouter future={{ 
                v7_startTransition: true, 
                v7_relativeSplatPath: true 
              }}>
                <ScrollToTop />
                <TabRedirect />
                <Routes>
                  {/* Public Routes */}
                  <Route path={ROUTES.public.auth.path} element={<Auth />} />
                  
                  {/* Legacy Redirects for backward compatibility */}
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/settings" element={<Navigate to={ROUTES.protected.settings.path} replace />} />
                  
                  {/* Protected Routes - Core Pages (All Users) */}
                  <Route 
                    path={ROUTES.protected.dashboard.path} 
                    element={<Index />} 
                  />
                  
                  <Route 
                    path={ROUTES.protected.calendar.path} 
                    element={<Calendar />} 
                  />
                  
                  <Route 
                    path={ROUTES.protected.profile.path} 
                    element={<Profile />} 
                  />
                  
                  {/* Legacy redirect for /slots */}
                  <Route path="/slots" element={<Navigate to="/kalender" replace />} />
                  
                  {/* Protected Routes - Role-Restricted */}
                  <Route 
                    path={ROUTES.protected.users.path}
                    element={
                      <ProtectedRoute requiredRoles={['admin', 'vorstand']}>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.protected.settings.path} 
                    element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.protected.fileManager.path}
                    element={
                      <ProtectedRoute requiredRoles={['admin', 'vorstand']}>
                        <FileManager />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.protected.reports.path} 
                    element={
                      <ProtectedRoute requiredRoles={['admin', 'vorstand']}>
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.protected.settingsManager.path} 
                    element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <SettingsManager />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
