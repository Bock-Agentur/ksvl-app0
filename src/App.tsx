import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { RoleProvider } from "@/hooks/use-role";
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
    <ErrorBoundary boundary="Application Root">
      <QueryClientProvider client={queryClient}>
        <RoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/header-message" element={<HeaderMessage />} />
                <Route path="/desktop-background" element={<DesktopBackground />} />
                <Route path="/file-manager" element={<FileManager />} />
                <Route path="/reports" element={<Reports />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RoleProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;