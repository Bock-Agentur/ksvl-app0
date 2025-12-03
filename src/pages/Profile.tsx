import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useFooterMenuSettings, ConsecutiveSlotsProvider } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { ProfileView } from "@/components/profile-view";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

function ProfileContent() {
  const roleContext = useRole();
  const [showContent, setShowContent] = useState(false);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  const isFullyLoaded = !footerLoading && !roleContext?.isLoading;
  
  // Handle smooth transition
  useEffect(() => {
    if (isFullyLoaded && roleContext?.currentUser) {
      setLoaderExiting(true);
      const timer = setTimeout(() => setShowContent(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isFullyLoaded, roleContext?.currentUser]);
  
  if (!showContent) {
    return <PageLoader isExiting={loaderExiting} />;
  }
  
  const { currentRole, currentUser } = roleContext!;

  return (
    <AnimatedPage>
      <div className="min-h-screen flex flex-col relative z-0 pt-safe bg-background">
        <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
          <ProfileView currentRole={currentRole} />
        </main>
        <UnifiedFooter
          currentRole={currentRole}
          currentUser={currentUser}
        />
      </div>
    </AnimatedPage>
  );
}

export function Profile() {
  const { user, session, isLoading: loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/auth");
    }
  }, [loading, session, navigate]);

  if (loading || !session || !user) {
    return <PageLoader />;
  }

  return (
    <ConsecutiveSlotsProvider>
      <SlotsProvider>
        <ProfileContent />
      </SlotsProvider>
    </ConsecutiveSlotsProvider>
  );
}

export default Profile;
