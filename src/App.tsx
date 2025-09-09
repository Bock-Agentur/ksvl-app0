import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { StartupScreen } from "@/components/startup-screen";
import { useStartupScreen } from "@/hooks/use-startup-screen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/Settings";
import StyleCenter from "./pages/StyleCenter";

const queryClient = new QueryClient();

const App = () => {
  const { settings, isVisible, hideStartupScreen } = useStartupScreen();
  const [showMainContent, setShowMainContent] = useState(!settings.enabled);

  // Control body background color for smooth startup transition
  useEffect(() => {
    if (!settings.enabled) {
      // If startup is disabled, immediately reset body background
      document.body.style.backgroundColor = '';
    } else if (!isVisible && showMainContent) {
      // Reset body background when startup is complete
      document.body.style.backgroundColor = '';
    }
  }, [isVisible, settings.enabled, showMainContent]);

  const handleStartupComplete = () => {
    hideStartupScreen();
    setShowMainContent(true);
    // Reset body background after a small delay to ensure smooth transition
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 100);
  };

  return (
    <ErrorBoundary boundary="Application Root">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* Black Background Overlay for Startup */}
          {(isVisible && settings.enabled) && (
            <div className="fixed inset-0 bg-black z-[9998]" />
          )}
          
          {/* Startup Screen */}
          <StartupScreen
            isVisible={isVisible && settings.enabled}
            settings={settings}
            onComplete={handleStartupComplete}
          />
          
          {/* Main App Content */}
          <div 
            className={cn(
              "transition-opacity duration-500",
              showMainContent ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{
              visibility: showMainContent ? 'visible' : 'hidden'
            }}
          >
            {showMainContent && (
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/style-center" element={<StyleCenter />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            )}
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;