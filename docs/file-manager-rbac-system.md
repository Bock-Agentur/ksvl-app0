# File Manager RBAC System - Technische Dokumentation

## Übersicht

Das File Manager RBAC (Role-Based Access Control) System ermöglicht eine granulare, rollenbasierte Zugriffskontrolle für Dateien. Admins können Dateien bestimmten Benutzerrollen zuweisen und so den Zugriff präzise steuern.

## Architektur

### 1. Datenbank-Schema

#### file_metadata Tabelle - Neue Spalte
```sql
-- allowed_roles: Array von Rollennamen, die Zugriff haben
allowed_roles TEXT[]
```

**Zugriffspriorität:**
1. **Admin** - Vollzugriff auf alle Dateien
2. **Owner** - Voller Zugriff auf eigene Dateien (owner_id)
3. **Linked User** - Zugriff auf verlinkte Dateien (linked_user_id)
4. **Public** - Alle authentifizierten Nutzer bei is_public = true
5. **Role-Based** - Nutzer mit passender Rolle in allowed_roles

### 2. RLS Policies

#### file_metadata SELECT Policy
```sql
CREATE POLICY "Users can view role-allowed files"
ON file_metadata FOR SELECT
USING (
  is_admin(auth.uid()) OR
  owner_id = auth.uid() OR
  linked_user_id = auth.uid() OR
  is_public = true OR
  (allowed_roles IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role::text = ANY(file_metadata.allowed_roles)
  ))
);
```

#### Storage RLS Integration
```sql
-- Zentrale Zugriffsfunktion
CREATE FUNCTION public.can_access_file(storage_path TEXT)
RETURNS BOOLEAN
```

**Zugriffsprüfung:**
1. Authentifizierung prüfen
2. File-Metadata laden
3. Admin-Check
4. Owner-Check
5. Linked-User-Check
6. Public-Check
7. Role-Check

### 3. Frontend-Komponenten

#### use-file-permissions Hook
**Zweck:** Zentrale Berechtigungslogik mit Caching

**Features:**
- `canUpload(category, linkedUserId)` - Upload-Berechtigung prüfen
- `canView(fileId)` - View-Berechtigung prüfen (mit Cache)
- `canEdit(fileId)` - Edit-Berechtigung prüfen
- `canDelete(fileId)` - Delete-Berechtigung prüfen
- `canViewMultiple(fileIds[])` - Batch-Berechtigungen prüfen
- `clearCache(fileId)` - Cache invalidieren

**Caching-Strategie:**
```typescript
// 1 Minute TTL für Permission Cache
const CACHE_TTL = 60000;
const permissionCache = useRef<Map<string, {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  timestamp: number;
}>>(new Map());
```

**Performance-Optimierung:**
- Single-File: Cache-basierte Prüfung
- Multi-File: Batch-Query mit Cache-Integration

#### FileDetailDrawer
**RBAC-Features:**
- Rollen-Checkboxen für Admins (nur im Edit-Mode)
- Automatisches Speichern bei Rollen-Änderung
- Visuelle Rollen-Anzeige mit Shield-Icon

**Verfügbare Rollen:**
- mitglied
- kranfuehrer
- vorstand
- admin

#### FileCard
**Visuelle Indikatoren:**
- Shield-Icon bei zugewiesenen Rollen
- Badge mit Anzahl der Rollen
- Gleiche Anzeige in Grid- und List-View

#### BulkPermissionsDialog
**Bulk-Operationen:**
- Multi-Select für Rollen
- Anwendung auf mehrere Dateien gleichzeitig
- Batch-Update mit Fehlerbehandlung

**Nutzung:**
```typescript
// 1. Dateien auswählen (Multi-Select Mode)
// 2. "Berechtigungen" Button klicken
// 3. Rollen auswählen
// 4. "Anwenden" klicken
```

## Implementierungs-Phasen

### Phase 1: Datenbank-Schema ✅
- `allowed_roles` Spalte hinzugefügt
- RLS Policies erweitert
- `can_access_file()` Funktion erstellt
- Storage RLS synchronisiert

### Phase 2: UI für Einzeldateien ✅
- FileDetailDrawer: Rollen-Checkboxen
- FileCard: Rollen-Badge
- use-file-manager: Update-Logik

### Phase 3: Standardisierte Bildanzeige ✅
- FilePreview-Komponente überall
- Preview-URL-Caching
- HEIC-Warnung

### Phase 4: Performance-Optimierung ✅
- Permission-Caching (1 Min TTL)
- Batch-Abfragen für Multi-File
- Cache-Invalidierung

### Phase 5: Bulk-Operationen ✅
- BulkPermissionsDialog
- Multi-Select Integration
- Batch-Update-Logik

## Sicherheitskonzept

### Defense in Depth
1. **Client-Side:** UI-Validierung, Permission-Checks
2. **RLS-Layer:** Datenbank-Policies auf file_metadata
3. **Storage-Layer:** RLS-Policies auf storage.objects
4. **Function-Layer:** can_access_file() als SECURITY DEFINER

### Kritische Sicherheitsregeln
- ✅ Niemals direkte URL-Zugriffe ohne RLS-Check
- ✅ Owner/Linked-User immer Zugriff gewähren
- ✅ Admin-Status server-seitig prüfen
- ✅ Role-Checks via user_roles Tabelle
- ❌ Keine Client-Side-Only-Checks für Berechtigungen

## Best Practices

### 1. Admin-Workflow
```
1. Datei hochladen
2. FileDetailDrawer öffnen
3. Rollen auswählen
4. Automatisches Speichern
```

### 2. Bulk-Workflow
```
1. Multi-Select Mode aktivieren
2. Dateien auswählen
3. "Berechtigungen" Button
4. Rollen auswählen
5. "Anwenden"
```

### 3. Performance
- Cache bei häufigen Abfragen nutzen
- Batch-Operationen für Multi-File
- Cache invalidieren nach Updates

### 4. UX-Guidelines
- Shield-Icon als visueller Indikator
- Klare Rollen-Labels (Deutsch)
- Feedback bei Bulk-Operationen

## Erweiterungsmöglichkeiten

### Mögliche Erweiterungen
1. **Audit-Logging:** Änderungen an Berechtigungen protokollieren
2. **Vererbung:** Ordner-Berechtigungen auf Dateien vererben
3. **Zeitbasiert:** Temporäre Zugriffe mit Ablaufdatum
4. **Benachrichtigungen:** User über neue Zugriffe informieren
5. **Erweiterte Rollen:** Custom-Rollen definieren

### Implementierte Features (Phase 6)
- [x] FileCard Tooltips mit spezifischen Rollennamen
- [x] Admin-Berechtigungsübersicht unter `/file-permissions`
- [x] Erweiterte Test-Szenarien in Dokumentation
- [ ] Audit-Log-Tabelle mit Trigger (geplant für Phase 7)

### Geplante Features (Phase 7)
- [ ] Audit-Log-Tabelle `file_permission_history` mit Trigger
- [ ] History-Tab in FileDetailDrawer
- [ ] Export/Import von Berechtigungen
- [ ] Zeitbasierte Zugriffe mit Ablaufdatum

## Testing-Checkliste

### Szenario 1: Einzelberechtigungs-Zuweisung
1. Als Admin einloggen
2. Datei hochladen
3. FileDetailDrawer öffnen
4. Rolle "mitglied" zuweisen
5. Als Mitglied einloggen → Datei sichtbar
6. Als Kranführer einloggen → Datei NICHT sichtbar

**Erwartetes Ergebnis:** Nur Benutzer mit zugewiesener Rolle können die Datei sehen.

### Szenario 2: Bulk-Berechtigungen
1. Als Admin einloggen
2. Mehrere Dateien auswählen (Multi-Select)
3. Bulk-Berechtigungen öffnen
4. Rollen "mitglied" + "vorstand" zuweisen
5. Als Mitglied einloggen → Alle Dateien sichtbar
6. Als Vorstand einloggen → Alle Dateien sichtbar

**Erwartetes Ergebnis:** Bulk-Änderung funktioniert für mehrere Dateien gleichzeitig.

### Szenario 3: Storage-URL-Schutz
1. Als Admin Datei hochladen mit Rolle "admin"
2. Storage-URL aus Netzwerk-Tab kopieren
3. In neuem Inkognito-Tab als normales Mitglied einloggen
4. Direkten Zugriff auf Storage-URL versuchen
5. **Erwartung:** 403 Forbidden oder kein Zugriff

**Erwartetes Ergebnis:** RLS verhindert direkten Storage-Zugriff ohne Berechtigung.

### Szenario 4: Tooltip-Anzeige
1. Als Admin Datei hochladen
2. Rollen "mitglied" und "kranfuehrer" zuweisen
3. FileCard im Grid- und List-View anzeigen
4. Mit Maus über Shield-Badge hovern
5. **Erwartung:** Tooltip zeigt "Zugriff für: Mitglied, Kranführer"

**Erwartetes Ergebnis:** Tooltip zeigt spezifische Rollennamen, nicht nur Anzahl.

### Szenario 5: Permissions-Übersicht
1. Als Admin zu `/file-permissions` navigieren
2. Filter nach Kategorie "user_document" testen
3. Filter nach Rolle "vorstand" testen
4. Sortierung nach Dateiname testen
5. Such-Filter mit Dateinamen testen

**Erwartetes Ergebnis:** Alle Filter funktionieren korrekt und Tabelle zeigt gefilterte Ergebnisse.

### Szenario 6: Öffentliche Dateien
1. Als Admin Datei hochladen
2. "Öffentlich" aktivieren (is_public = true)
3. Als nicht-eingeloggter Benutzer zugreifen
4. **Erwartung:** Datei ist sichtbar und downloadbar

**Erwartetes Ergebnis:** Öffentliche Dateien sind für alle zugänglich.

## Troubleshooting

### Problem: Dateien nicht sichtbar trotz Rolle
**Lösung:**
1. Cache leeren: `clearCache(fileId)`
2. RLS Policy prüfen: Ist Rolle in `allowed_roles`?
3. User-Rollen prüfen: Hat User die Rolle in `user_roles`?

### Problem: Storage-Zugriff verweigert
**Lösung:**
1. `can_access_file()` Funktion prüfen
2. Storage RLS Policy auf korrekte Verwendung prüfen
3. `file_metadata` mit Storage-Path synchronisieren

### Problem: Batch-Update schlägt fehl
**Lösung:**
1. Console-Logs für Fehlerdetails prüfen
2. Einzelne Updates testen
3. Berechtigungen für Update prüfen

### Problem: Tooltip wird nicht angezeigt
**Lösung:**
1. Prüfen ob TooltipProvider importiert ist
2. Badge muss `cursor-help` Klasse haben
3. Browser-Cache leeren und neu laden

## Technische Details

### Verfügbare Rollen im System
```typescript
enum AppRole {
  admin = 'admin',
  kranfuehrer = 'kranfuehrer',
  mitglied = 'mitglied',
  gastmitglied = 'gastmitglied',
  vorstand = 'vorstand'
}
```

### File-Kategorien
- `general` - Allgemeine Dateien (alle User)
- `user_document` - Mitglieder-Dokumente (Admin)
- `login_media` - Login-Hintergrundbilder (Admin)
- `shared` - Geteilte Dateien (Admin)

### Type Definitions
```typescript
interface FileMetadata {
  id: string;
  filename: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  category: string;
  owner_id: string | null;
  linked_user_id: string | null;
  is_public: boolean;
  allowed_roles: string[] | null; // RBAC
  storage_path: string;
  created_at: string;
  updated_at: string;
}
```

## Wartung & Support

### Regelmäßige Aufgaben
- [ ] Cache-Performance überwachen
- [ ] RLS-Policy-Logs prüfen
- [ ] Berechtigungen auditieren
- [ ] Tote Berechtigungen bereinigen

### Support-Kontakt
Bei Fragen oder Problemen siehe Hauptdokumentation oder Troubleshooting-Docs.

---

**Version:** 1.0  
**Letzte Aktualisierung:** 2025-11-18  
**Autor:** System
