/**
 * useProfileLoader Hook
 * 
 * Extracts profile loading logic from ProfileView component.
 * Handles loading user profile data and checking admin status.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks";
import { useRole } from "@/hooks";
import { User as UserType, UserRole } from "@/types";
import { userLogger } from "@/lib/logger";

interface UseProfileLoaderOptions {
  userId?: string;
}

interface ProfileLoaderResult {
  user: UserType | null;
  loading: boolean;
  isAdmin: boolean;
  aiInfoEnabled: boolean;
  setAiInfoEnabled: (enabled: boolean) => void;
  reload: () => Promise<void>;
}

export function useProfileLoader(options?: UseProfileLoaderOptions): ProfileLoaderResult {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiInfoEnabled, setAiInfoEnabled] = useState(false);
  const { toast } = useToast();
  const { currentUser: roleCurrentUser } = useRole();

  const checkAdminStatus = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);
      
      // Admin or Vorstand can edit restricted fields
      setIsAdmin(roles?.some(r => r.role === 'admin' || r.role === 'vorstand') || false);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      
      // If userId is provided, load that user's profile (admin view)
      // Otherwise, use the current user from RoleContext (respects role switching)
      let targetUserId: string;
      
      if (options?.userId) {
        targetUserId = options.userId;
      } else if (roleCurrentUser) {
        // Use the current user from RoleContext (role switching aware)
        targetUserId = roleCurrentUser.id;
      } else {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          throw new Error('Nicht angemeldet');
        }
        targetUserId = authUser.id;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId);

      if (rolesError) throw rolesError;

      const roles = userRoles?.map(r => r.role as UserRole) || [];
      const primaryRole = roles.find(r => r !== 'mitglied') || roles[0] || 'mitglied';

      const userData: UserType = {
        id: profile.id,
        name: profile.name || '',
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        username: profile.username || undefined,
        email: profile.email,
        phone: profile.phone || '',
        boatName: profile.boat_name || '',
        memberNumber: profile.member_number || '',
        streetAddress: profile.street_address || undefined,
        postalCode: profile.postal_code || undefined,
        city: profile.city || undefined,
        roles: roles,
        role: primaryRole as UserRole,
        status: (profile.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        joinDate: profile.entry_date || profile.created_at || '',
        joinedAt: profile.entry_date || profile.created_at || '',
        isActive: profile.status === 'active',
        
        // Existing fields
        oesvNumber: profile.oesv_number || '',
        address: profile.address || '',
        berthNumber: profile.berth_number || '',
        berthType: profile.berth_type || '',
        birthDate: profile.birth_date || '',
        entryDate: profile.entry_date || '',
        dinghyBerthNumber: profile.dinghy_berth_number || '',
        boatType: profile.boat_type || '',
        boatLength: profile.boat_length || undefined,
        boatWidth: profile.boat_width || undefined,
        parkingPermitNumber: profile.parking_permit_number || '',
        parkingPermitIssueDate: profile.parking_permit_issue_date || '',
        beverageChipNumber: profile.beverage_chip_number || '',
        beverageChipIssueDate: profile.beverage_chip_issue_date || '',
        emergencyContact: profile.emergency_contact || '',
        notes: profile.notes || '',
        vorstandFunktion: profile.vorstand_funktion || '',
        dataPublicInKsvl: profile.data_public_in_ksvl === true,
        contactPublicInKsvl: profile.contact_public_in_ksvl === true,
        
        // New fields
        passwordChangeRequired: profile.password_change_required || false,
        twoFactorMethod: profile.two_factor_method || 'Aus',
        membershipType: profile.membership_type || undefined,
        membershipStatus: profile.membership_status || 'Aktiv',
        boardPositionStartDate: profile.board_position_start_date || undefined,
        boardPositionEndDate: profile.board_position_end_date || undefined,
        boatColor: profile.boat_color || undefined,
        berthLength: profile.berth_length || undefined,
        berthWidth: profile.berth_width || undefined,
        buoyRadius: profile.buoy_radius || undefined,
        hasDinghyBerth: profile.has_dinghy_berth || false,
        beverageChipStatus: profile.beverage_chip_status || 'Aktiv',
        statuteAccepted: profile.statute_accepted || false,
        privacyAccepted: profile.privacy_accepted || false,
        newsletterOptin: profile.newsletter_optin || false,
        emergencyContactName: profile.emergency_contact_name || undefined,
        emergencyContactPhone: profile.emergency_contact_phone || undefined,
        emergencyContactRelationship: profile.emergency_contact_relationship || undefined,
        documentBfa: profile.document_bfa || undefined,
        documentInsurance: profile.document_insurance || undefined,
        documentBerthContract: profile.document_berth_contract || undefined,
        documentMemberPhoto: profile.document_member_photo || undefined,
        membershipStatusHistory: profile.membership_status_history || [],
        boardPositionHistory: profile.board_position_history || [],
        createdBy: profile.created_by || undefined,
        modifiedBy: profile.modified_by || undefined,
        ai_info_enabled: profile.ai_info_enabled || false
      } as any;

      setUser(userData);
      setAiInfoEnabled(profile.ai_info_enabled === true);
    } catch (error) {
      userLogger.error('Error loading user profile', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [options?.userId, roleCurrentUser?.id, toast]);

  useEffect(() => {
    loadCurrentUser();
    checkAdminStatus();
  }, [loadCurrentUser, checkAdminStatus]);

  return {
    user,
    loading,
    isAdmin,
    aiInfoEnabled,
    setAiInfoEnabled,
    reload: loadCurrentUser,
  };
}
