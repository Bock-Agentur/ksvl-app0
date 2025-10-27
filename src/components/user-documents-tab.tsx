import { useState, useEffect } from "react";
import { useFileManager, FileMetadata } from "@/hooks/use-file-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUploadDialog } from "@/components/file-manager/file-upload-dialog";
import { FileSelectorDialog } from "@/components/file-manager/file-selector-dialog";
import { FileCard } from "@/components/file-manager/file-card";
import { Upload, Eye, Download, Trash2, FolderOpen, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserDocumentsTabProps {
  userId: string;
  userName: string;
}

/**
 * User Documents Tab Component
 * Shows all documents linked to a specific user
 * Allows admins to upload new documents
 */
export function UserDocumentsTab({ userId, userName }: UserDocumentsTabProps) {
  const { toast } = useToast();
  const { files, loading, fetchFiles, deleteFile } = useFileManager();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectorDialogOpen, setSelectorDialogOpen] = useState(false);
  
  // Filter files for this user
  const userFiles = files.filter(
    file => file.linked_user_id === userId && file.category === 'user_document'
  );

  // Group by document type
  const groupedFiles = {
    bfa: userFiles.filter(f => f.document_type === 'bfa'),
    insurance: userFiles.filter(f => f.document_type === 'insurance'),
    berth_contract: userFiles.filter(f => f.document_type === 'berth_contract'),
    member_photo: userFiles.filter(f => f.document_type === 'member_photo'),
  };

  useEffect(() => {
    // Load user documents
    fetchFiles();
  }, [userId]);

  const handleDelete = async (fileId: string) => {
    if (window.confirm('Dokument wirklich löschen?')) {
      await deleteFile(fileId);
      toast({
        title: "Dokument gelöscht",
        description: "Das Dokument wurde erfolgreich entfernt.",
      });
    }
  };

  const documentTypeLabels = {
    bfa: 'BFA (Bootsführerausweis)',
    insurance: 'Versicherung',
    berth_contract: 'Liegeplatzvertrag',
    member_photo: 'Mitgliederfoto',
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dokumente von {userName}</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte alle Dokumente dieses Mitglieds
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSelectorDialogOpen(true)} variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            Aus Dateimanager
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Neues Dokument
          </Button>
        </div>
      </div>

      {/* Document Groups */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Lade Dokumente...
        </div>
      ) : userFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Noch keine Dokumente hochgeladen
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Erstes Dokument hochladen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedFiles).map(([type, docs]) => (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {documentTypeLabels[type as keyof typeof documentTypeLabels]}
                    </CardTitle>
                    <CardDescription>
                      {docs.length} Dokument{docs.length !== 1 ? 'e' : ''}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{docs.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Dokumente vorhanden
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {docs.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        viewMode="grid"
                        isSelected={false}
                        onSelect={() => {}}
                        onView={() => window.open(file.storage_path, '_blank')}
                        multiSelectActive={false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        preselectedCategory="user_document"
        preselectedUserId={userId}
      />

      {/* File Selector Dialog */}
      <FileSelectorDialog
        open={selectorDialogOpen}
        onOpenChange={setSelectorDialogOpen}
        onSelect={(file) => {
          // Link selected file to user
          toast({
            title: "Datei verknüpft",
            description: `${file.filename} wurde mit ${userName} verknüpft.`,
          });
          setSelectorDialogOpen(false);
        }}
        title="Dokument auswählen"
        description="Wählen Sie ein bestehendes Dokument aus"
        filters={{
          category: 'user_document',
        }}
      />
    </div>
  );
}
