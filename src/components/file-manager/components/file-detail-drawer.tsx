import { useState, useEffect, useMemo } from "react";
import { useFileManager, useFilePermissions, useIsMobile, useRole } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Copy,
  FileText,
  Clock,
  User,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FilePreview } from "./file-preview";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { FileDetailDrawerProps, FileMetadata } from "../types/file-manager.types";

/**
 * File Detail Drawer
 * Extended with tabs, more metadata, and optimized permissions
 */
export function FileDetailDrawer({
  fileId,
  open,
  onOpenChange,
}: FileDetailDrawerProps) {
  const isMobile = useIsMobile();
  const { files, deleteFile, downloadFile, updateFileMetadata, getFileUrl } = useFileManager();
  const { isAdmin } = useFilePermissions();
  const { currentUser } = useRole();

  const [file, setFile] = useState<FileMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // ✅ Calculate permissions client-side (no async DB calls)
  const canEditFile = useMemo(() => {
    if (isAdmin) return true;
    if (!file || !currentUser?.id) return false;
    return file.owner_id === currentUser.id;
  }, [isAdmin, file, currentUser?.id]);

  const canDeleteFile = useMemo(() => {
    if (isAdmin) return true;
    if (!file || !currentUser?.id) return false;
    return file.owner_id === currentUser.id;
  }, [isAdmin, file, currentUser?.id]);

  useEffect(() => {
    if (fileId) {
      const foundFile = files.find((f) => f.id === fileId);
      setFile(foundFile || null);
      if (foundFile) {
        setEditedDescription(foundFile.description || '');
        setEditedTags([...foundFile.tags]);
        setAllowedRoles(foundFile.allowed_roles || []);
        loadFileUrl(foundFile);
      }
    } else {
      setFile(null);
      setActiveTab('details');
    }
  }, [fileId, files]);

  const loadFileUrl = async (file: FileMetadata) => {
    setLoadingUrl(true);
    try {
      const url = await getFileUrl(file.storage_path, file.category);
      setFileUrl(url);
    } catch {
      setFileUrl(null);
    } finally {
      setLoadingUrl(false);
    }
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
    await deleteFile(file.id);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!file) return;
    downloadFile(file.id);
  };

  const handleCopyLink = async () => {
    if (!fileUrl) return;
    try {
      await navigator.clipboard.writeText(fileUrl);
      setLinkCopied(true);
      toast.success("Link kopiert!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
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
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!file) return null;

  const content = (
    <div className="space-y-4 p-4">
      {/* Large Preview - Full Width */}
      <div className="bg-muted rounded-lg overflow-hidden">
        {loadingUrl ? (
          <div className="w-full aspect-video flex items-center justify-center">
            <div className="h-full w-full animate-pulse bg-muted-foreground/20" />
          </div>
        ) : file.file_type === 'pdf' && fileUrl ? (
          <iframe src={fileUrl} className="w-full h-64" title={file.filename} />
        ) : file.file_type === 'video' && fileUrl ? (
          <video src={fileUrl} controls className="w-full h-auto max-h-64" />
        ) : file.file_type === 'image' && fileUrl ? (
          <img 
            src={fileUrl} 
            alt={file.filename} 
            className="w-full h-auto object-contain max-h-80"
          />
        ) : (
          <div className="flex justify-center py-8">
            <FilePreview file={file} size="large" showFileName={false} />
          </div>
        )}
      </div>

      {/* Filename */}
      <div>
        <h3 className="font-semibold text-lg break-words">{file.filename}</h3>
        <p className="text-sm text-muted-foreground">{file.mime_type}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          {/* File Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              Größe
            </div>
            <div>{formatSize(file.file_size)}</div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              Kategorie
            </div>
            <div>
              <Badge variant="secondary">{file.category}</Badge>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Erstellt
            </div>
            <div className="text-xs">{formatDateTime(file.created_at)}</div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Geändert
            </div>
            <div className="text-xs">{formatDateTime(file.updated_at)}</div>

            {file.owner_id && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Besitzer
                </div>
                <div className="text-xs truncate">
                  {file.owner_id === currentUser?.id ? 'Du' : file.owner_id.substring(0, 8) + '...'}
                </div>
              </>
            )}

            {/* Admin-only: Storage Path */}
            {isAdmin && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  Pfad
                </div>
                <div className="text-xs truncate font-mono">{file.storage_path}</div>
              </>
            )}
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
                rows={3}
                maxLength={500}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {file.description || 'Keine Beschreibung'}
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
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTag}>
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>×</button>
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-1">
                {file.tags.length > 0 ? (
                  file.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
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
              <Button onClick={handleSave} className="flex-1" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4 mt-4">
          {/* Access Status */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Zugriffsstatus:</span>
            <Badge variant={file.is_public ? 'default' : 'secondary'}>
              {file.is_public ? 'Öffentlich' : 'Eingeschränkt'}
            </Badge>
          </div>

          {/* Role-based Access Control - Only for users who can edit */}
          {canEditFile && (
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
                    <Label htmlFor={`role-${role.value}`} className="cursor-pointer font-normal text-sm">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Save roles if changed */}
              {(allowedRoles.length !== (file?.allowed_roles || []).length || 
               !allowedRoles.every(r => file?.allowed_roles?.includes(r))) && (
                <Button size="sm" onClick={handleSave} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Rollenrechte speichern
                </Button>
              )}
            </div>
          )}

          {!canEditFile && (
            <div className="text-sm text-muted-foreground">
              {file.allowed_roles && file.allowed_roles.length > 0 ? (
                <p>Zugriff für: {file.allowed_roles.join(', ')}</p>
              ) : (
                <p>Nur für Besitzer zugänglich</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Main Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button onClick={handleDownload} className="flex-1" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Herunterladen
          </Button>
          {fileUrl && (
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {canDeleteFile && (
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        description={`"${file.filename}" wirklich löschen?`}
      />
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Datei-Details</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
