import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Shield,
  FileIcon,
  FileText,
  FileVideo,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ROLE_LABELS } from "@/lib/role-order";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FileWithOwner {
  id: string;
  filename: string;
  category: string;
  file_type: string;
  owner_id: string | null;
  is_public: boolean;
  allowed_roles: string[] | null;
  created_at: string;
  owner_name?: string;
}

export default function FilePermissionsOverview() {
  const navigate = useNavigate();
  const { isAdmin } = useFilePermissions();
  const isMobile = useIsMobile();
  const [files, setFiles] = useState<FileWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [showOnlyPrivate, setShowOnlyPrivate] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchFiles();
  }, [isAdmin, navigate]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("file_metadata")
        .select("id, filename, category, file_type, owner_id, is_public, allowed_roles, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch owner names
      const ownerIds = [...new Set(data?.map(f => f.owner_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", ownerIds);

      const filesWithOwners = data?.map(file => ({
        ...file,
        owner_name: profiles?.find(p => p.id === file.owner_id)?.name || "Unbekannt",
      })) || [];

      setFiles(filesWithOwners);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileIcon className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <FileVideo className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "login_media":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "user_document":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "general":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "shared":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getAccessBadge = (file: FileWithOwner) => {
    if (file.is_public) {
      return (
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Öffentlich
        </Badge>
      );
    }
    if (file.allowed_roles && file.allowed_roles.length > 0) {
      const roleNames = file.allowed_roles
        .map(role => ROLE_LABELS[role] || role)
        .join(", ");
      return (
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          {roleNames}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        Privat
      </Badge>
    );
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilters(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const filteredFiles = files.filter(file => {
    // Search filter
    if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all" && file.category !== categoryFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== "all" && file.file_type !== typeFilter) {
      return false;
    }

    // Public/Private filter
    if (showOnlyPublic && !file.is_public) {
      return false;
    }
    if (showOnlyPrivate && (file.is_public || (file.allowed_roles && file.allowed_roles.length > 0))) {
      return false;
    }

    // Role filter
    if (roleFilters.length > 0) {
      const hasMatchingRole = file.allowed_roles?.some(role => roleFilters.includes(role));
      if (!hasMatchingRole) return false;
    }

    return true;
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size={isMobile ? "icon" : "default"}
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Zurück</span>}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Berechtigungsübersicht</h1>
            <p className="text-muted-foreground">Verwaltung aller Dateiberechtigungen</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dateiname suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="login_media">Login Media</SelectItem>
                <SelectItem value="user_document">Benutzerdokument</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
                <SelectItem value="shared">Geteilt</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Dateityp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="image">Bilder</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="other">Andere</SelectItem>
              </SelectContent>
            </Select>

            {/* Public/Private Toggle */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={showOnlyPublic}
                  onCheckedChange={(checked) => {
                    setShowOnlyPublic(checked as boolean);
                    if (checked) setShowOnlyPrivate(false);
                  }}
                />
                <Label htmlFor="public" className="text-sm cursor-pointer">Öffentlich</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={showOnlyPrivate}
                  onCheckedChange={(checked) => {
                    setShowOnlyPrivate(checked as boolean);
                    if (checked) setShowOnlyPublic(false);
                  }}
                />
                <Label htmlFor="private" className="text-sm cursor-pointer">Privat</Label>
              </div>
            </div>
          </div>

          {/* Role Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Rollen:</span>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <Badge
                key={role}
                variant={roleFilters.includes(role) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleRoleFilter(role)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredFiles.length} {filteredFiles.length === 1 ? "Datei" : "Dateien"} gefunden
          </p>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Lädt...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Keine Dateien gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datei</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Besitzer</TableHead>
                    <TableHead>Zugriff</TableHead>
                    <TableHead>Erstellt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.file_type)}
                          <span className="font-medium truncate max-w-[200px]">
                            {file.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getCategoryBadgeColor(file.category)}
                        >
                          {file.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{file.file_type}</TableCell>
                      <TableCell>{file.owner_name}</TableCell>
                      <TableCell>{getAccessBadge(file)}</TableCell>
                      <TableCell>
                        {format(new Date(file.created_at), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
