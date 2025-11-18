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

### Geplante Features
- [ ] Audit-Log-Tabelle mit Trigger
- [ ] Admin-Übersichtsseite für alle Berechtigungen
- [ ] Tooltip mit Rollen-Details statt nur Anzahl
- [ ] Export/Import von Berechtigungen

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
