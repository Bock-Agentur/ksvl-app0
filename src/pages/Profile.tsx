import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useFooterMenuSettings } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { TestDataProvider, ConsecutiveSlotsProvider } from "@/hooks";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { ProfileView } from "@/components/profile-view";
import { PageLoader } from "@/components/common/page-loader";

function ProfileContent() {
  const roleContext = useRole();
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  const isFullyLoaded = !footerLoading && !roleContext?.isLoading;
  
  if (!roleContext || !isFullyLoaded || !roleContext.currentUser) {
    return <PageLoader />;
  }
  
  const { currentRole, currentUser, setRole } = roleContext;

  return (
    <div className="min-h-screen flex flex-col relative z-0 pt-safe bg-background">
      <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
        <ProfileView currentRole={currentRole} />
      </main>
      <UnifiedFooter
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={setRole}
      />
    </div>
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
    <TestDataProvider>
      <ConsecutiveSlotsProvider>
        <SlotsProvider>
          <ProfileContent />
        </SlotsProvider>
      </ConsecutiveSlotsProvider>
    </TestDataProvider>
  );
}

export default Profile;
