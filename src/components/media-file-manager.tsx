import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Check, Image, Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface MediaFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface MediaFileManagerProps {
  onSelect: (url: string, filename: string, type: 'image' | 'video') => void;
  selectedFilename?: string | null;
}

export function MediaFileManager({ onSelect, selectedFilename }: MediaFileManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('login-media')
        .list();

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      toast({
        title: "Fehler beim Laden",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const { error } = await supabase.storage
        .from('login-media')
        .remove([filename]);

      if (error) throw error;

      toast({
        title: "Datei gelöscht",
        description: `${filename} wurde erfolgreich gelöscht`
      });

      loadFiles();
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSelect = (file: MediaFile) => {
    const { data: { publicUrl } } = supabase.storage
      .from('login-media')
      .getPublicUrl(file.name);

    const type = file.metadata.mimetype.startsWith('video/') ? 'video' : 'image';
    onSelect(publicUrl, file.name, type);

    toast({
      title: "Datei ausgewählt",
      description: `${file.name} wurde als Hintergrund ausgewählt`
    });

    // Close the dialog programmatically
    setTimeout(() => {
      const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    }, 100);
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const mimetype = file.metadata?.mimetype || '';
    const matchesType = filterType === 'all' || 
      (filterType === 'image' && mimetype.startsWith('image/')) ||
      (filterType === 'video' && mimetype.startsWith('video/'));
    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Dateimanager</span>
          <Badge variant="secondary">{files.length} Dateien</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suche & Filter */}
        <div className="flex gap-2">
          <Input
            placeholder="Datei suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              Alle
            </Button>
            <Button
              variant={filterType === 'image' ? 'default' : 'outline'}
              onClick={() => setFilterType('image')}
              size="sm"
            >
              <Image className="w-4 h-4" />
            </Button>
            <Button
              variant={filterType === 'video' ? 'default' : 'outline'}
              onClick={() => setFilterType('video')}
              size="sm"
            >
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Datei-Grid */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Lädt...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || filterType !== 'all' 
              ? 'Keine Dateien gefunden' 
              : 'Noch keine Dateien hochgeladen'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const { data: { publicUrl } } = supabase.storage
                .from('login-media')
                .getPublicUrl(file.name);
              
              const isVideo = file.metadata?.mimetype?.startsWith('video/') || false;
              const isSelected = selectedFilename === file.name;

              return (
                <Card key={file.name} className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                  <div className="relative aspect-video bg-muted">
                    {isVideo ? (
                      <video
                        src={publicUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={publicUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary">
                          <Check className="w-3 h-3 mr-1" />
                          Aktiv
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.metadata.size)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSelect(file)}
                      >
                        Auswählen
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          {isVideo ? (
                            <video
                              src={publicUrl}
                              className="w-full"
                              controls
                              autoPlay
                              loop
                            />
                          ) : (
                            <img
                              src={publicUrl}
                              alt={file.name}
                              className="w-full"
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Datei löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {file.name} wird permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(file.name)}>
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
