import { useState } from "react";
import { useFileManager, UploadMetadata } from "@/hooks/use-file-manager";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUsers } from "@/hooks/use-users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCategory?: 'login_media' | 'user_document' | 'general' | 'shared';
  preselectedUserId?: string;
}

/**
 * File Upload Dialog
 * Full-screen drawer on mobile, modal on desktop
 */
export function FileUploadDialog({
  open,
  onOpenChange,
  preselectedCategory,
  preselectedUserId,
}: FileUploadDialogProps) {
  const isMobile = useIsMobile();
  const { uploadFile, uploadMultipleFiles, uploading } = useFileManager();
  const { isAdmin } = useFilePermissions();
  const { users } = useUsers();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<UploadMetadata['category']>(
    preselectedCategory || 'general'
  );
  const [documentType, setDocumentType] = useState<UploadMetadata['document_type']>(null);
  const [linkedUserId, setLinkedUserId] = useState<string | undefined>(preselectedUserId);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Validate
    if (category === 'user_document' && !linkedUserId && isAdmin()) {
      alert('Bitte wählen Sie ein Mitglied aus');
      return;
    }

    const metadata: UploadMetadata = {
      category,
      document_type: documentType,
      linked_user_id: linkedUserId || null,
      tags,
      description: description || null,
      is_public: isPublic,
    };

    try {
      if (selectedFiles.length === 1) {
        await uploadFile(selectedFiles[0], metadata);
      } else {
        await uploadMultipleFiles(selectedFiles, metadata);
      }

      // Reset form
      setSelectedFiles([]);
      setTags([]);
      setDescription('');
      setDocumentType(null);
      setLinkedUserId(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type === 'application/pdf') return FileText;
    if (file.type.startsWith('video/')) return Video;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const content = (
    <div className="space-y-6">
      {/* File Input */}
      <div>
        <Label htmlFor="file-upload">Dateien auswählen</Label>
        <div className="mt-2">
          <label
            htmlFor="file-upload"
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
              "bg-muted/50 hover:bg-muted transition-colors",
              selectedFiles.length > 0 && "border-primary"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Dateien hier ablegen oder klicken
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max. 20MB pro Datei
            </p>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,video/*"
          />
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Ausgewählte Dateien ({selectedFiles.length})</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => {
              const Icon = getFileIcon(file);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <Label htmlFor="category">Kategorie</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as any)}>
          <SelectTrigger id="category" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">Allgemein</SelectItem>
            {isAdmin() && (
              <>
                <SelectItem value="user_document">Mitglieder-Dokument</SelectItem>
                <SelectItem value="login_media">Login-Medium</SelectItem>
                <SelectItem value="shared">Geteilt</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Document Type (if user_document) */}
      {category === 'user_document' && (
        <div>
          <Label htmlFor="document-type">Dokumenttyp</Label>
          <Select value={documentType || ''} onValueChange={(v) => setDocumentType(v as any || null)}>
            <SelectTrigger id="document-type" className="mt-2">
              <SelectValue placeholder="Typ auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bfa">BFA</SelectItem>
              <SelectItem value="insurance">Versicherung</SelectItem>
              <SelectItem value="berth_contract">Liegeplatzvertrag</SelectItem>
              <SelectItem value="member_photo">Mitgliederfoto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Linked User (if admin and user_document) */}
      {isAdmin() && category === 'user_document' && (
        <div>
          <Label htmlFor="linked-user">Verknüpftes Mitglied</Label>
          <Select value={linkedUserId} onValueChange={setLinkedUserId}>
            <SelectTrigger id="linked-user" className="mt-2">
              <SelectValue placeholder="Mitglied auswählen" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Tag eingeben..."
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            Hinzufügen
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)}>×</button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Beschreibung (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung eingeben..."
          className="mt-2"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {description.length}/500 Zeichen
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div>
          <Label>Upload läuft...</Label>
          <Progress value={uploadProgress} className="mt-2" />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
          Abbrechen
        </Button>
        <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading}>
          {uploading ? 'Hochladen...' : `${selectedFiles.length} Datei(en) hochladen`}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Dateien hochladen</DrawerTitle>
            <DrawerDescription>
              Laden Sie Bilder, PDFs oder Videos hoch
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dateien hochladen</DialogTitle>
          <DialogDescription>
            Laden Sie Bilder, PDFs oder Videos hoch
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
