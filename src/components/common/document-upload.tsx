import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  userId: string;
  documentType: 'bfa' | 'insurance' | 'berth_contract' | 'member_photo';
  label: string;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function DocumentUpload({
  userId,
  documentType,
  label,
  currentUrl,
  onUploadComplete,
  disabled = false
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${documentType}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('member-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('member-documents')
        .getPublicUrl(filePath);

      onUploadComplete(filePath);

      toast({
        title: "Dokument hochgeladen",
        description: `${label} wurde erfolgreich hochgeladen.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;

    try {
      const { error } = await supabase.storage
        .from('member-documents')
        .remove([currentUrl]);

      if (error) throw error;

      onUploadComplete('');

      toast({
        title: "Dokument gelöscht",
        description: `${label} wurde gelöscht.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!currentUrl) return;

    try {
      const { data, error } = await supabase.storage
        .from('member-documents')
        .download(currentUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentUrl.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Fehler beim Download",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = async () => {
    if (!currentUrl) return;

    try {
      const { data } = supabase.storage
        .from('member-documents')
        .getPublicUrl(currentUrl);

      window.open(data.publicUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Fehler beim Öffnen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {currentUrl ? (
          <>
            <div className="flex items-center gap-2 flex-1 p-2 border rounded-md bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {currentUrl.split('/').pop()}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleView}
              disabled={disabled}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={disabled}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={disabled || uploading}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={true}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
