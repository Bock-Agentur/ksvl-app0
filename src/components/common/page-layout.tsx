import { ReactNode } from "react";
import { UnifiedFooter } from "./unified-footer";
import { useFooterAnimation } from "@/hooks/use-footer-animation";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

/**
 * Consistent layout wrapper for all pages
 * - Provides standard container styling
 * - Automatically includes UnifiedFooter
 * - Manages global footer animation state
 * - Ensures pb-20 spacing for footer
 */
export function PageLayout({ children, showFooter = true }: PageLayoutProps) {
  const { hasAnimated } = useFooterAnimation();
  
  return (
    <div className="min-h-screen flex flex-col relative z-0 pt-safe bg-background">
      <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
        {children}
      </main>
      {showFooter && (
        <UnifiedFooter hasAnimated={hasAnimated} />
      )}
    </div>
  );
}
