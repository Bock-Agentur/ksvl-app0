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
    <div className="space-y-4">
      {/* File Input - Larger on mobile */}
      <div>
        <Label htmlFor="file-upload" className="text-base font-semibold">Dateien auswählen</Label>
        <div className="mt-2">
          <label
            htmlFor="file-upload"
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer",
              "bg-muted/50 hover:bg-muted transition-colors",
              selectedFiles.length > 0 && "border-primary bg-primary/5",
              isMobile ? "h-48 p-6" : "h-32"
            )}
          >
            <Upload className={cn(
              "text-muted-foreground mb-3",
              isMobile ? "h-12 w-12" : "h-8 w-8"
            )} />
            <p className={cn(
              "text-muted-foreground font-medium",
              isMobile ? "text-base" : "text-sm"
            )}>
              {isMobile ? "Tippen zum Auswählen" : "Dateien hier ablegen oder klicken"}
            </p>
            <p className={cn(
              "text-muted-foreground mt-2",
              isMobile ? "text-sm" : "text-xs"
            )}>
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

      {/* Selected Files - Better mobile layout */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Ausgewählte Dateien ({selectedFiles.length})
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selectedFiles.map((file, index) => {
              const Icon = getFileIcon(file);
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg bg-muted border border-border",
                    isMobile && "min-h-[56px]"
                  )}
                >
                  <Icon className={cn(
                    "flex-shrink-0 text-primary",
                    isMobile ? "h-6 w-6" : "h-5 w-5"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "truncate font-medium",
                      isMobile ? "text-sm" : "text-sm"
                    )}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "flex-shrink-0",
                      isMobile ? "h-10 w-10" : "h-8 w-8"
                    )}
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
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

      {/* Tags - Simplified */}
      <div>
        <Label htmlFor="tags" className="text-sm">Tags (optional)</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Tag eingeben und Enter drücken..."
            className={cn(isMobile && "text-base h-11")}
          />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className={cn(
                  "gap-1",
                  isMobile && "text-sm py-1.5 px-3"
                )}
              >
                {tag}
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className={cn(isMobile && "text-lg leading-none")}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Description - Optimized */}
      <div>
        <Label htmlFor="description" className="text-sm">Beschreibung (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung eingeben..."
          className={cn(
            "mt-2",
            isMobile && "text-base min-h-[100px]"
          )}
          rows={isMobile ? 4 : 3}
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

      {/* Actions - Mobile optimized */}
      <div className={cn(
        "flex gap-3",
        isMobile ? "flex-col pt-2" : "justify-end"
      )}>
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)} 
          disabled={uploading}
          className={cn(isMobile && "h-12 text-base order-2")}
        >
          Abbrechen
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={selectedFiles.length === 0 || uploading}
          className={cn(isMobile && "h-12 text-base order-1")}
        >
          {uploading ? 'Hochladen...' : isMobile 
            ? 'Hochladen' 
            : `${selectedFiles.length} Datei(en) hochladen`}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl">Dateien hochladen</DrawerTitle>
            <DrawerDescription className="text-base">
              Bilder, PDFs oder Videos hochladen
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{content}</div>
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
