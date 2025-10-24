import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export function SuperAdminCreator() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    first_name: "",
    last_name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("E-Mail und Passwort sind erforderlich");
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: formData,
        headers: session.session?.access_token 
          ? { Authorization: `Bearer ${session.session.access_token}` }
          : {}
      });

      if (error) throw error;

      toast.success(data.message || "Super Admin erfolgreich angelegt");
      
      setFormData({
        email: "",
        password: "",
        name: "",
        first_name: "",
        last_name: ""
      });
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast.error(error.message || "Fehler beim Anlegen des Super Admins");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Super Admin anlegen
        </CardTitle>
        <CardDescription>
          Erster dauerhafter Administrator-Account. Wird nicht mit Test- oder Rollendaten gelöscht.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="admin@beispiel.de"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mindestens 6 Zeichen"
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Vorname</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Max"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nachname</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Mustermann"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Anzeigename</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Max Mustermann"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Wird angelegt..." : "Super Admin anlegen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
