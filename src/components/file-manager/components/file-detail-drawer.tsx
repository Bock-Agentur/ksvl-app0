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
} from "lucide-react";
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
  const { files, deleteFile, downloadFile, updateFileMetadata, getFileUrl } = useFileManager();
  const { canEdit, canDelete } = useFilePermissions();

  const [file, setFile] = useState<FileMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [canEditFile, setCanEditFile] = useState(false);
  const [canDeleteFile, setCanDeleteFile] = useState(false);

  useEffect(() => {
    if (fileId) {
      const foundFile = files.find((f) => f.id === fileId);
      setFile(foundFile || null);
      if (foundFile) {
        setEditedDescription(foundFile.description || '');
        setEditedTags([...foundFile.tags]);
        loadFileUrl(foundFile);
        checkPermissions(fileId);
      }
    } else {
      setFile(null);
    }
  }, [fileId, files]);

  const loadFileUrl = async (file: FileMetadata) => {
    const url = await getFileUrl(file.storage_path, file.category);
    setFileUrl(url);
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!file) return null;

  const content = (
    <div className="space-y-6 p-4">
      {/* Large Preview */}
      <div className="bg-muted rounded-lg overflow-hidden">
        {file.file_type === 'image' && fileUrl ? (
          <img src={fileUrl} alt={file.filename} className="w-full h-auto max-h-96 object-contain" />
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
