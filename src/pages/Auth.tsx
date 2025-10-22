import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLoginBackground } from "@/hooks/use-login-background";
import { useIsMobile } from "@/hooks/use-mobile";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { background } = useLoginBackground();
  const isMobile = useIsMobile();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let loginEmail = email;
      
      // Prüfen ob es eine E-Mail ist (enthält @)
      if (!email.includes('@')) {
        // Username → E-Mail aus profiles Tabelle holen (case-insensitive)
        const { data, error } = await supabase
          .from('profiles')
          .select('email, name')
          .ilike('name', email)
          .maybeSingle();
        
        console.log('Username search result:', { data, error, searchTerm: email });
        
        if (error || !data) {
          throw new Error('Benutzer nicht gefunden');
        }
        
        loginEmail = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      toast({
        title: "Erfolgreich angemeldet",
        description: "Sie werden weitergeleitet...",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Anmeldefehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBackground = () => {
    if (background.type === 'image' && background.url) {
      return (
        <>
          <img 
            src={background.url} 
            alt="Login background"
            className="fixed inset-0 w-full h-full object-cover -z-10"
          />
          <div className="fixed inset-0 bg-black/40 -z-10" />
        </>
      );
    }
    
    if (background.type === 'video' && background.url) {
      const shouldShowVideo = !isMobile || background.videoOnMobile;
      
      return (
        <>
          {shouldShowVideo ? (
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="fixed inset-0 w-full h-full object-cover -z-10"
            >
              <source src={background.url} type="video/mp4" />
            </video>
          ) : (
            <div className="fixed inset-0 bg-gradient-to-br from-background to-muted -z-10" />
          )}
          <div className="fixed inset-0 bg-black/40 -z-10" />
        </>
      );
    }
    
    return null;
  };

  const cardOpacity = background.type !== 'gradient' && background.url 
    ? background.cardOpacity 
    : 95;
  
  const cardBorderBlur = background.cardBorderBlur || 8;
  const cardBorderRadius = background.cardBorderRadius || 8;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${
      background.type === 'gradient' || !background.url 
        ? 'bg-gradient-to-br from-background to-muted' 
        : ''
    }`}>
      {renderBackground()}
      <Card 
        className="w-full max-w-md relative z-10 transition-all duration-300"
        style={{ 
          backgroundColor: `hsl(var(--background) / ${cardOpacity / 100})`,
          filter: `blur(${cardBorderBlur}px)`,
          WebkitFilter: `blur(${cardBorderBlur}px)`,
          borderRadius: `${cardBorderRadius}px`
        }}
      >
        <CardHeader>
          <CardTitle className="text-2xl text-center">Anmelden</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div className="space-y-2">
              <Label htmlFor="email">
                E-Mail oder Benutzername
              </Label>
              <Input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-Mail oder Benutzername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Passwort
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird geladen..." : "Anmelden"}
            </Button>
          </form>
          
          <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2">Test-Admin:</p>
            <p>E-Mail: h@jorgson.com</p>
            <p>Passwort: 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
