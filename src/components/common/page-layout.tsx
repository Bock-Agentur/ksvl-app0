import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * Consistent layout wrapper for all pages
 * - Provides standard container styling
 * - Footer wird AUSSERHALB von AnimatedPage gerendert (nicht hier)
 * - Ensures pb-20 spacing for footer
 */
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col pt-safe bg-background">
      <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
        {children}
      </main>
    </div>
  );
}
