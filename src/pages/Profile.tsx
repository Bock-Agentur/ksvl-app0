import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useFooterMenuSettings, ConsecutiveSlotsProvider } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { ProfileView } from "@/components/profile-view";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

/**
 * Profile Page
 * 
 * Pattern A: PageLoader für Loading, dann AnimatedPage + Footer ohne Conditional
 */
function ProfileContent() {
  const roleContext = useRole();
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  const isReady = !footerLoading && !roleContext?.isLoading && !!roleContext?.currentUser;

  // Pattern A: PageLoader für Loading-State
  if (!isReady) {
    return <PageLoader />;
  }

  // Pattern A: AnimatedPage + Footer ohne Conditional
  return (
    <>
      <AnimatedPage>
        <div className="min-h-screen flex flex-col pt-safe bg-background">
          <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
            <ProfileView currentRole={roleContext.currentRole} />
          </main>
        </div>
      </AnimatedPage>
      <UnifiedFooter
        currentRole={roleContext.currentRole}
        currentUser={roleContext.currentUser}
      />
    </>
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

  // Auth-Check mit PageLoader
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
