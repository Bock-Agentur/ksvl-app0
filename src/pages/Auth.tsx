import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLoginBackground } from "@/hooks/use-login-background";
import { useIsMobile } from "@/hooks/use-mobile";

function Countdown({ endDate, text }: { endDate: string; text: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="text-center space-y-3 mb-6">
      <div className="flex justify-center gap-3 text-2xl md:text-3xl font-bold text-white">
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-4xl">{timeLeft.days.toString().padStart(2, '0')}</span>
          <span className="text-white/70 text-sm">Tage</span>
        </div>
        <span className="self-start mt-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-4xl">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-white/70 text-sm">Stunden</span>
        </div>
        <span className="self-start mt-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-4xl">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-white/70 text-sm">Minuten</span>
        </div>
        <span className="self-start mt-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-4xl">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-white/70 text-sm">Sekunden</span>
        </div>
      </div>
      {text && (
        <p className="text-white/90 text-base md:text-lg">{text}</p>
      )}
    </div>
  );
}

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
    const overlayStyle = {
      backgroundColor: `${background.overlayColor}${Math.round((background.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`
    };

    if (background.type === 'image' && background.url) {
      return (
        <>
          <img 
            src={background.url} 
            alt="Login background"
            className="fixed inset-0 w-full h-full object-cover -z-10"
            style={{ filter: `blur(${background.mediaBlur}px)` }}
          />
          <div className="fixed inset-0 -z-10" style={overlayStyle} />
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
              style={{ filter: `blur(${background.mediaBlur}px)` }}
            >
              <source src={background.url} type="video/mp4" />
            </video>
          ) : (
            <div className="fixed inset-0 bg-gradient-to-br from-background to-muted -z-10" />
          )}
          <div className="fixed inset-0 -z-10" style={overlayStyle} />
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
    <div className={`min-h-screen flex flex-col items-center p-4 relative ${
      background.type === 'gradient' || !background.url 
        ? 'bg-gradient-to-br from-background to-muted' 
        : ''
    } ${
      background.verticalPosition === 'top' ? 'justify-start pt-12' :
      background.verticalPosition === 'bottom' ? 'justify-end pb-12' :
      'justify-center'
    }`}>
      {renderBackground()}
      
      <div className="w-full max-w-md sm:max-w-[85%] md:max-w-md relative z-10 flex flex-col">
        {/* Countdown */}
        {background.countdownEnabled && background.countdownEndDate && (
          <Countdown 
            endDate={background.countdownEndDate} 
            text={background.countdownText}
          />
        )}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4 mb-8" autoComplete="on">
          {/* Email Input with Glass Effect */}
          <div 
            className="relative overflow-hidden transition-all duration-300 h-12"
            style={{ 
              borderRadius: `${cardBorderRadius}px`,
              backgroundColor: `${background.inputBgColor}${Math.round(background.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
            }}
          >
            <div className="relative flex items-center gap-3 px-4 h-full">
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/60"
              />
            </div>
          </div>

          {/* Password Input with Glass Effect */}
          <div 
            className="relative overflow-hidden transition-all duration-300 h-12"
            style={{ 
              borderRadius: `${cardBorderRadius}px`,
              backgroundColor: `${background.inputBgColor}${Math.round(background.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
            }}
          >
            <div className="relative flex items-center gap-3 px-4 h-full">
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/60"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg transition-all duration-300 h-12"
            disabled={loading}
            style={{ borderRadius: `${cardBorderRadius}px` }}
          >
            {loading ? "Wird geladen..." : "Anmelden"}
          </Button>
        </form>
        {/* Bottom Links */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <button className="text-white hover:text-white/80 transition-colors font-medium">
            Registrieren
          </button>
          <div className="h-4 w-px bg-white/30" />
          <button className="text-white hover:text-white/80 transition-colors">
            Passwort vergessen?
          </button>
        </div>
      </div>
    </div>
  );
}
