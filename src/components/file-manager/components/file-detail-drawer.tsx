import { useState, useEffect } from "react";
import { useFileManager } from "@/hooks/use-file-manager";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Brain,
  RefreshCw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FilePreview } from "./file-preview";
import { FileDetailDrawerProps, FileMetadata } from "../types/file-manager.types";

/**
 * File Detail Drawer
 * Consistent drawer for all screen sizes with improved preview
 */
export function FileDetailDrawer({
  fileId,
  open,
  onOpenChange,
}: FileDetailDrawerProps) {
  const isMobile = useIsMobile();
  const { files, deleteFile, downloadFile, updateFileMetadata, getFileUrl, toggleAISearchable, indexDocument } = useFileManager();
  const { canEdit, canDelete, isAdmin } = useFilePermissions();

  const [file, setFile] = useState<FileMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [canEditFile, setCanEditFile] = useState(false);
  const [canDeleteFile, setCanDeleteFile] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    if (fileId) {
      const foundFile = files.find((f) => f.id === fileId);
      setFile(foundFile || null);
      if (foundFile) {
        setEditedDescription(foundFile.description || '');
        setEditedTags([...foundFile.tags]);
        setAllowedRoles(foundFile.allowed_roles || []);
        loadFileUrl(foundFile);
        checkPermissions(fileId);
      }
    } else {
      setFile(null);
    }
  }, [fileId, files]);

  const loadFileUrl = async (file: FileMetadata) => {
    setLoadingUrl(true);
    try {
      const url = await getFileUrl(file.storage_path, file.category);
      setFileUrl(url);
    } catch (error) {
      console.error('Error loading file URL:', error);
      setFileUrl(null);
    } finally {
      setLoadingUrl(false);
    }
  };

  const checkPermissions = async (id: string) => {
    const [editPerm, deletePerm] = await Promise.all([
      canEdit(id),
      canDelete(id),
    ]);
    setCanEditFile(editPerm);
    setCanDeleteFile(deletePerm);
  };

  const handleSave = async () => {
    if (!file) return;

    await updateFileMetadata(file.id, {
      description: editedDescription || null,
      tags: editedTags,
      allowed_roles: allowedRoles,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!file) return;
    if (window.confirm(`"${file.filename}" wirklich löschen?`)) {
      await deleteFile(file.id);
      onOpenChange(false);
    }
  };

  const handleDownload = () => {
    if (!file) return;
    downloadFile(file.id);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !editedTags.includes(tagInput.trim())) {
      setEditedTags([...editedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag));
  };

  const handleToggleAISearchable = async (checked: boolean) => {
    if (!file) return;
    
    try {
      await toggleAISearchable(file.id, checked);
      
      // Wenn aktiviert, automatisch indexieren
      if (checked) {
        await handleIndexDocument();
      }
      
      toast.success(checked ? 'AI-Durchsuchbarkeit aktiviert' : 'AI-Durchsuchbarkeit deaktiviert');
    } catch (error) {
      console.error('Error toggling AI searchable:', error);
      toast.error('Fehler beim Ändern der AI-Durchsuchbarkeit');
    }
  };

  const handleIndexDocument = async () => {
    if (!file) return;
    
    setIsIndexing(true);
    try {
      await indexDocument(file.id);
      toast.success('Indexierung gestartet');
    } catch (error) {
      console.error('Error indexing document:', error);
      toast.error('Fehler beim Indexieren');
    } finally {
      setIsIndexing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!file) return null;

  const content = (
    <div className="space-y-6 p-4">
      {/* Large Preview */}
      <div className="bg-muted rounded-lg overflow-hidden">
        {loadingUrl ? (
          <div className="w-full h-96 flex items-center justify-center">
            <div className="h-full w-full animate-pulse bg-muted-foreground/20" />
          </div>
        ) : file.file_type === 'pdf' && fileUrl ? (
          <iframe src={fileUrl} className="w-full h-96" title={file.filename} />
        ) : file.file_type === 'video' && fileUrl ? (
          <video src={fileUrl} controls className="w-full h-auto" />
        ) : (
          <div className="flex justify-center py-12">
            <FilePreview file={file} size="large" showFileName={false} />
          </div>
        )}
      </div>

      {/* File Info */}
      <div>
        <h3 className="font-semibold mb-2 break-words">{file.filename}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Größe:</div>
          <div>{formatSize(file.file_size)}</div>
          
          <div className="text-muted-foreground">Typ:</div>
          <div>{file.file_type.toUpperCase()}</div>
          
          <div className="text-muted-foreground">Kategorie:</div>
          <div>
            <Badge variant="secondary">{file.category}</Badge>
          </div>
          
          <div className="text-muted-foreground">Hochgeladen:</div>
          <div>{new Date(file.created_at).toLocaleDateString('de-DE')}</div>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Beschreibung</Label>
          {canEditFile && !isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-3 w-3 mr-1" />
              Bearbeiten
            </Button>
          )}
        </div>
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Beschreibung eingeben..."
            rows={4}
            maxLength={500}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {file.description || 'Keine Beschreibung vorhanden'}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <Label className="mb-2 block">Tags</Label>
        {isEditing ? (
          <>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Tag hinzufügen..."
              />
              <Button variant="outline" onClick={handleAddTag}>
                +
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>×</button>
                </Badge>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {file.tags.length > 0 ? (
              file.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Keine Tags</p>
            )}
          </div>
        )}
      </div>

      {/* Rollenbasierte Zugriffskontrolle - Nur für Admins */}
      {canEditFile && !isEditing && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Zugriff für Rollen</Label>
          <div className="space-y-2">
            {[
              { value: 'mitglied', label: 'Mitglieder' },
              { value: 'kranfuehrer', label: 'Kranführer' },
              { value: 'vorstand', label: 'Vorstand' },
              { value: 'admin', label: 'Administratoren' },
            ].map((role) => (
              <div key={role.value} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role.value}`}
                  checked={allowedRoles.includes(role.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAllowedRoles([...allowedRoles, role.value]);
                    } else {
                      setAllowedRoles(allowedRoles.filter(r => r !== role.value));
                    }
                  }}
                />
                <Label htmlFor={`role-${role.value}`} className="cursor-pointer font-normal">
                  {role.label}
                </Label>
              </div>
            ))}
          </div>
          {(allowedRoles.length !== (file?.allowed_roles || []).length || 
           !allowedRoles.every(r => file?.allowed_roles?.includes(r))) && (
            <Button 
              size="sm" 
              onClick={handleSave}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Rollenrechte speichern
            </Button>
          )}
        </div>
      )}

      {/* AI-Durchsuchbarkeit - Nur für Admins */}
      {isAdmin && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <Label htmlFor="ai-searchable" className="font-medium">
                AI-durchsuchbar
              </Label>
            </div>
            <Checkbox
              id="ai-searchable"
              checked={file.ai_searchable || false}
              onCheckedChange={handleToggleAISearchable}
              disabled={isIndexing}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Dokument für semantische Suche im Harbor Chat verfügbar machen
          </p>
          
          {/* Indexierungs-Status */}
          {file.ai_searchable && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                {file.indexing_status === 'not_indexed' && (
                  <Badge variant="secondary" className="text-xs">
                    Nicht indexiert
                  </Badge>
                )}
                {file.indexing_status === 'indexing' && (
                  <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Wird indexiert...
                  </Badge>
                )}
                {file.indexing_status === 'indexed' && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    ✓ Indexiert
                  </Badge>
                )}
                {file.indexing_status === 'failed' && (
                  <Badge variant="destructive" className="text-xs">
                    ⚠ Fehler
                  </Badge>
                )}
              </div>
              
              {/* Indexierungs-Button */}
              {(file.indexing_status === 'not_indexed' || file.indexing_status === 'failed') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleIndexDocument}
                  disabled={isIndexing}
                  className="w-full"
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${isIndexing ? 'animate-spin' : ''}`} />
                  {isIndexing ? 'Indexiere...' : 'Jetzt indexieren'}
                </Button>
              )}
              
              {/* Letzte Indexierung */}
              {file.indexed_at && file.indexing_status === 'indexed' && (
                <p className="text-xs text-muted-foreground">
                  Indexiert am: {new Date(file.indexed_at).toLocaleString('de-DE')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
        </div>
      )}

      {/* Main Actions */}
      {!isEditing && (
        <div className="space-y-2">
          <Button onClick={handleDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Herunterladen
          </Button>
          {canDeleteFile && (
            <Button variant="destructive" onClick={handleDelete} className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Datei-Details</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
