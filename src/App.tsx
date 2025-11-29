import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";
import { RoleProvider } from "@/hooks/use-role";
import { ProtectedRoute } from "@/components/common/protected-route";
import { ROUTES } from "@/lib/registry/routes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";
import { HeaderMessage } from "./pages/HeaderMessage";
import { DesktopBackground } from "./pages/DesktopBackground";
import { FileManager } from "./pages/FileManager";
import { Reports } from "./pages/Reports";

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
                <Routes>
                  {/* Public Routes */}
                  <Route path={ROUTES.public.auth.path} element={<Auth />} />
                  
                  {/* Redirect /dashboard to / */}
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  
                  {/* Protected Routes with Role Guards */}
                  <Route 
                    path={ROUTES.protected.dashboard.path} 
                    element={<Index />} 
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
                    path={ROUTES.protected.headerMessage.path} 
                    element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <HeaderMessage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.protected.desktopBackground.path} 
                    element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <DesktopBackground />
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