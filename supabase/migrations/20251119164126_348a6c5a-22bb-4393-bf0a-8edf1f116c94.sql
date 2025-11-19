-- ====================================================================
-- KRITISCHE SICHERHEITS-MIGRATION
-- Behebt: Profile-Datenleck, Slot Double-Booking, Audit-Log-Sicherheit
-- ====================================================================

-- Phase 1.1: Profile-Tabelle RLS-Policy einschränken
-- Problem: Alle authentifizierten Benutzer können ALLE Profile lesen (PII-Leak!)
-- Lösung: Benutzer sehen nur eigenes Profil ODER sind Admin/Vorstand

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR is_admin(auth.uid())
  OR has_role(auth.uid(), 'vorstand'::app_role)
);

-- Phase 1.2: Slot Double-Booking verhindern
-- Problem: Race Condition erlaubt mehreren Benutzern denselben Slot zu buchen
-- Lösung: UNIQUE INDEX auf (date, time) für gebuchte Slots

CREATE UNIQUE INDEX IF NOT EXISTS slots_unique_booking_idx 
ON public.slots (date, time) 
WHERE is_booked = true;

-- Kommentar für Constraint
COMMENT ON INDEX slots_unique_booking_idx IS 'Verhindert Double-Booking durch atomare Constraint-Validierung';

-- Phase 2: Monday Sync Logs absichern (Audit-Trail-Integrität)
-- Problem: Keine INSERT/UPDATE/DELETE Policies = potenzielle Log-Manipulation
-- Lösung: Strikte Policies für Log-Integrität

DROP POLICY IF EXISTS "Admins can view monday_sync_logs" ON public.monday_sync_logs;

-- SELECT: Nur Admins können Logs lesen
CREATE POLICY "Admins can view sync logs"
ON public.monday_sync_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- INSERT: Nur via Service Role (Edge Functions)
CREATE POLICY "Service role can insert sync logs"
ON public.monday_sync_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- UPDATE und DELETE: Explizit KEINE Policies = komplett verboten
-- Audit-Logs dürfen niemals geändert oder gelöscht werden