import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaFileManager } from "@/components/media-file-manager";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FileManager() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dateimanager</h1>
            <p className="text-muted-foreground">
              Verwalte deine hochgeladenen Dateien
            </p>
          </div>
        </div>

        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardHeader>
            <CardTitle>Gespeicherte Dateien</CardTitle>
            <CardDescription>
              Alle Bilder und Videos die für Login-Hintergründe hochgeladen wurden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MediaFileManager
              onSelect={(url, filename, type) => {
                // Optional: Hier könntest du weitere Aktionen durchführen
                console.log('Datei ausgewählt:', { url, filename, type });
              }}
              selectedFilename={null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
