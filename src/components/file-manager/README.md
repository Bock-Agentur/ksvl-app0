# Dateimanager-System

## Übersicht
Einheitliches Dateimanager-System für die gesamte Anwendung. Alle Komponenten verwenden dieselbe Datenquelle (`file_metadata` Tabelle) und denselben Storage-Mechanismus.

## Architektur

### Core Hook: `useFileManager`
**Datei**: `src/hooks/use-file-manager.tsx`

Zentraler Hook für alle Dateioperationen:
- ✅ Dateien hochladen (Upload)
- ✅ Dateien löschen (Delete)
- ✅ Metadaten aktualisieren
- ✅ Suchen & Filtern
- ✅ Sortierung
- ✅ Paginierung (Infinite Scroll)
- ✅ Preview-URLs generieren (`getFilePreviewUrl`)

**Wichtig**: Die Methode `getFilePreviewUrl(file: FileMetadata)` ist die zentrale Stelle für Bild-Vorschauen. Sie erkennt automatisch, ob die Datei aus einem öffentlichen Bucket (`login-media`) oder privaten Bucket (`documents`) kommt und generiert die entsprechende URL.

### Komponenten

#### 1. EnhancedFileManager
**Datei**: `src/components/file-manager/enhanced-file-manager.tsx`

Vollständiger Dateimanager mit:
- Mobile-first Design
- Such- und Filterfunktionen
- Upload-Dialog
- Bulk-Operationen
- Kategorien-Filter

**Verwendung**: Hauptseite `/file-manager`

#### 2. FileSelectorDialog
**Datei**: `src/components/file-manager/file-selector-dialog.tsx`

Wiederverwendbarer Dialog zum Auswählen von Dateien:
- Responsive (Dialog auf Desktop, Drawer auf Mobile)
- Filterbar nach Kategorie, Dateityp, MIME-Types
- Grid/List Ansicht
- Single/Multiple Selection Support

**Verwendung**:
```tsx
import { FileSelectorDialog } from "@/components/file-manager/file-selector-dialog";

<FileSelectorDialog
  open={open}
  onOpenChange={setOpen}
  onSelect={(file) => {
    // Handle selected file
  }}
  filters={{
    category: 'login_media',
    file_type: 'image',
  }}
/>
```

#### 3. FileCard
**Datei**: `src/components/file-manager/file-card.tsx`

Einzelne Datei-Karte mit:
- Thumbnail-Vorschau für Bilder
- Icon-Fallback für andere Dateitypen
- Grid & List Layout
- Fehlerbehandlung für fehlende Bilder
- Permission-basierte Aktionen

### Storage-Struktur

#### Buckets
1. **`login-media`** (öffentlich)
   - Kategorie: `login_media`
   - Verwendung: Login-Hintergründe, öffentliche Medien
   - Zugriff: Öffentlich über Public URLs

2. **`documents`** (privat)
   - Kategorien: `user_document`, `general`, `shared`
   - Verwendung: Benutzerdokumente, allgemeine Dateien
   - Zugriff: Signed URLs mit RLS

#### file_metadata Tabelle
Alle Dateien werden in der `file_metadata` Tabelle erfasst:

```sql
- id (uuid)
- filename (text)
- storage_path (text)
- file_type (image|pdf|video|other)
- mime_type (text)
- file_size (bigint)
- category (login_media|user_document|general|shared)
- owner_id (uuid)
- linked_user_id (uuid, nullable)
- is_public (boolean)
- tags (text[])
- description (text, nullable)
- document_type (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Permissions Hook: `useFilePermissions`
**Datei**: `src/hooks/use-file-permissions.tsx`

Zentrale Permission-Prüfung:
- `canUpload(category?, linkedUserId?)`: Upload-Berechtigung
- `canView(fileId)`: View-Berechtigung
- `canEdit(fileId)`: Edit-Berechtigung
- `canDelete(fileId)`: Delete-Berechtigung
- `isAdmin`: Admin-Status

## Migration vom alten System

### ✅ Entfernt
- ❌ `src/components/media-file-manager.tsx` - Alter MediaFileManager gelöscht
- ❌ Direkte Storage-Zugriffe ohne Metadaten

### ✅ Ersetzt durch
- ✅ `FileSelectorDialog` - Einheitlicher Dialog für alle Auswahl-Szenarien
- ✅ `useFileManager` Hook - Zentrale Datenquelle
- ✅ `file_metadata` Tabelle - Einheitliche Metadaten-Verwaltung

## Best Practices

### 1. Immer den useFileManager Hook verwenden
```tsx
const { files, uploadFile, deleteFile, getFilePreviewUrl } = useFileManager();
```

### 2. Für Bildvorschauen getFilePreviewUrl verwenden
```tsx
const url = await getFilePreviewUrl(file);
```
Diese Methode:
- ✅ Erkennt automatisch den richtigen Bucket
- ✅ Generiert Public URLs für öffentliche Buckets
- ✅ Generiert Signed URLs für private Buckets
- ✅ Fehlerbehandlung inklusive

### 3. Kategorien richtig setzen
- `login_media`: Login-Hintergründe und öffentliche Medien → `login-media` Bucket
- `user_document`: Benutzerdokumente → `documents` Bucket
- `general`: Allgemeine Dateien → `documents` Bucket
- `shared`: Geteilte Dateien → `documents` Bucket

### 4. Permissions immer prüfen
```tsx
const { canEdit, canDelete, isAdmin } = useFilePermissions();
const canEditFile = await canEdit(fileId);
```

## Troubleshooting

### Bilder werden nicht angezeigt
1. ✅ Prüfe ob `file_metadata` Eintrag existiert
2. ✅ Prüfe ob `storage_path` korrekt ist
3. ✅ Prüfe ob Bucket öffentlich ist (für `login-media`)
4. ✅ Prüfe RLS Policies (für `documents`)
5. ✅ Verwende `getFilePreviewUrl` statt direkter URLs

### Upload schlägt fehl
1. ✅ Prüfe Dateigröße (20MB für Bilder/Videos, 10MB für PDFs)
2. ✅ Prüfe MIME-Type
3. ✅ Prüfe Upload-Berechtigung mit `canUpload`
4. ✅ Prüfe Storage-Bucket-Konfiguration

### RLS Fehler
1. ✅ Prüfe ob User eingeloggt ist
2. ✅ Prüfe Policies in Supabase
3. ✅ Verwende `useFilePermissions` für Permission-Checks

## Wartung

### Neue Dateikategorie hinzufügen
1. Enum in `file_metadata` Tabelle erweitern
2. TypeScript Type in `use-file-manager.tsx` aktualisieren
3. Upload-Logik in `uploadFile` anpassen
4. Filter in `FileSelectorDialog` erweitern

### Neuen Bucket erstellen
1. SQL Migration erstellen
2. RLS Policies definieren
3. `getFilePreviewUrl` Logik erweitern
4. Upload-Logik in `uploadFile` anpassen
