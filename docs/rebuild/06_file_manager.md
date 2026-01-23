# KSVL Slot Manager - Dateimanager

## 1. Übersicht

Der Dateimanager bietet rollenbasiertes Datei-Management mit Kategorien für Login-Medien, Mitglieder-Dokumente und allgemeine Dateien.

## 2. Storage Buckets

| Bucket | Public | Verwendung |
|--------|--------|------------|
| `login-media` | Ja | Login-Hintergrundbilder/-Videos |
| `documents` | Nein | Allgemeine Dokumente |
| `member-documents` | Nein | BFA, Versicherung, Liegeplatzvertrag |

## 3. Kategorien

- `login_media`: Login-Hintergrund-Medien
- `user_document`: Mitglieder-Dokumente (BFA, Versicherung, etc.)
- `general`: Allgemeine Dateien
- `shared`: Geteilte Dateien

## 4. useFileManager Hook

```typescript
export function useFileManager() {
  const [filters, setFilters] = useState<FileFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ['files', filters, searchQuery],
    queryFn: () => fetchFilesFromDB(filters, searchQuery),
  });

  const uploadFile = async (file: File, metadata: UploadMetadata) => {
    // 1. Upload to storage
    const path = `${metadata.category}/${Date.now()}_${file.name}`;
    await supabase.storage.from(getBucketName(metadata.category)).upload(path, file);
    
    // 2. Create metadata entry
    await supabase.from('file_metadata').insert({ ...metadata, storage_path: path });
  };

  return { files, isLoading, uploadFile, deleteFile, updateMetadata, getFileUrl };
}
```

## 5. Berechtigungs-System

```typescript
export function useFilePermissions() {
  const { currentRole } = useRole();
  const isAdmin = currentRole === 'admin';

  const canUpload = (category?: string) => {
    if (isAdmin) return true;
    if (category === 'login_media') return false;
    return true;
  };

  const canView = async (fileId: string) => {
    // Check: is_public, owner_id, linked_user_id, allowed_roles
  };

  return { canUpload, canView, canEdit, canDelete, isAdmin };
}
```

---

**Letzte Aktualisierung**: 2026-01-23
