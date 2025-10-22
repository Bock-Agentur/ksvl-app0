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
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4" autoComplete="on">
          {/* Email Input with Glass Effect */}
          <div 
            className="relative overflow-hidden transition-all duration-300"
            style={{ 
              borderRadius: `${cardBorderRadius}px`
            }}
          >
            <div 
              className="absolute inset-0 -z-10"
              style={{
                backgroundColor: `hsl(var(--background) / ${cardOpacity / 100})`,
                backdropFilter: `blur(${cardBorderBlur}px)`,
                WebkitBackdropFilter: `blur(${cardBorderBlur}px)`,
              }}
            />
            <div className="relative flex items-center gap-3 px-4 py-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-Mail oder Benutzername"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Password Input with Glass Effect */}
          <div 
            className="relative overflow-hidden transition-all duration-300"
            style={{ 
              borderRadius: `${cardBorderRadius}px`
            }}
          >
            <div 
              className="absolute inset-0 -z-10"
              style={{
                backgroundColor: `hsl(var(--background) / ${cardOpacity / 100})`,
                backdropFilter: `blur(${cardBorderBlur}px)`,
                WebkitBackdropFilter: `blur(${cardBorderBlur}px)`,
              }}
            />
            <div className="relative flex items-center gap-3 px-4 py-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Passwort"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-medium py-6 text-lg shadow-lg transition-all duration-300"
            disabled={loading}
            style={{ borderRadius: `${cardBorderRadius}px` }}
          >
            {loading ? "Wird geladen..." : "Anmelden"}
          </Button>
        </form>

        {/* Bottom Links */}
        <div className="mt-6 w-full flex items-center justify-center gap-4 text-sm">
          <button className="text-primary hover:text-primary/80 transition-colors font-medium">
            Konto erstellen
          </button>
          <div className="h-4 w-px bg-border/50" />
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            Passwort vergessen?
          </button>
        </div>
      </div>
    </div>
  );
}
