import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLoginBackground, LoginBackground } from "@/hooks/use-login-background";
import { useIsMobile } from "@/hooks/use-mobile";
import { z } from "zod";

function Countdown({ endDate, text, showDays, fontSize, fontWeight }: { endDate: string; text: string; showDays?: boolean; fontSize?: number; fontWeight?: number }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, tenths: 0, hundredths: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const ms = difference % 1000;
        const totalHours = Math.floor(difference / (1000 * 60 * 60));
        const hours = showDays !== false 
          ? Math.floor((difference / (1000 * 60 * 60)) % 24)
          : totalHours;
        
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          tenths: Math.floor(ms / 100),
          hundredths: Math.floor((ms % 100) / 10)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 10);

    return () => clearInterval(timer);
  }, [endDate, showDays]);

  const actualShowDays = showDays !== false;
  const baseFontSize = fontSize || 80;
  const mobileFontSize = Math.max(baseFontSize * 0.625, 24);
  const tabletFontSize = Math.max(baseFontSize * 0.75, 32);
  const weight = fontWeight || 100;

  return (
    <div className="w-full flex flex-col items-center justify-center mb-8">
      <div className="flex justify-center items-start gap-0.5 md:gap-1">
        {actualShowDays && (
          <>
            <div className="flex flex-col items-center">
              <span 
                className="text-white tabular-nums" 
                style={{ 
                  fontSize: `${mobileFontSize}px`,
                  fontWeight: weight
                }}
              >
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-xs md:text-sm text-white/70 mt-1">Tage</span>
            </div>
            <span 
              className="text-white" 
              style={{ 
                fontSize: `${mobileFontSize}px`,
                fontWeight: weight
              }}
            >
              :
            </span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span 
            className="text-white tabular-nums" 
            style={{ 
              fontSize: `${mobileFontSize}px`,
              fontWeight: weight
            }}
          >
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-xs md:text-sm text-white/70 mt-1">Stunden</span>
        </div>
        <span 
          className="text-white" 
          style={{ 
            fontSize: `${mobileFontSize}px`,
            fontWeight: weight
          }}
        >
          :
        </span>
        <div className="flex flex-col items-center">
          <span 
            className="text-white tabular-nums" 
            style={{ 
              fontSize: `${mobileFontSize}px`,
              fontWeight: weight
            }}
          >
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-xs md:text-sm text-white/70 mt-1">Minuten</span>
        </div>
        <span 
          className="text-white" 
          style={{ 
            fontSize: `${mobileFontSize}px`,
            fontWeight: weight
          }}
        >
          :
        </span>
        <div className="flex flex-col items-center">
          <span 
            className="text-white tabular-nums" 
            style={{ 
              fontSize: `${mobileFontSize}px`,
              fontWeight: weight
            }}
          >
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-xs md:text-sm text-white/70 mt-1">Sekunden</span>
        </div>
        <span 
          className="text-white" 
          style={{ 
            fontSize: `${mobileFontSize}px`,
            fontWeight: weight
          }}
        >
          :
        </span>
        <div className="flex flex-col items-center">
          <span 
            className="text-white tabular-nums" 
            style={{ 
              fontSize: `${mobileFontSize}px`,
              fontWeight: weight
            }}
          >
            {String(timeLeft.tenths)}{String(timeLeft.hundredths)}
          </span>
          <span className="text-xs md:text-sm text-white/70 mt-1">1/100 Sek</span>
        </div>
      </div>
      {text && (
        <p className="text-white/90 text-sm md:text-base mt-4">{text}</p>
      )}
    </div>
  );
}

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { background, isLoading } = useLoginBackground();
  const isMobile = useIsMobile();

  const getMediaUrl = (background: LoginBackground): string | null => {
    if (!background.storagePath || !background.bucket) {
      return null;
    }
    
    const { data } = supabase.storage
      .from(background.bucket)
      .getPublicUrl(background.storagePath);
    
    return data.publicUrl;
  };

  // Determine countdown position based on screen size
  const getCountdownPosition = () => {
    if (typeof window === 'undefined') return background.countdownVerticalPositionDesktop;
    
    const width = window.innerWidth;
    if (width < 768) {
      return background.countdownVerticalPositionMobile;
    } else if (width < 1024) {
      return background.countdownVerticalPositionTablet;
    } else {
      return background.countdownVerticalPositionDesktop;
    }
  };

  // Determine login block position based on screen size
  const getLoginBlockPosition = () => {
    if (typeof window === 'undefined') return background.loginBlockVerticalPositionDesktop || 50;
    
    const width = window.innerWidth;
    if (width < 768) {
      return background.loginBlockVerticalPositionMobile || 50;
    } else if (width < 1024) {
      return background.loginBlockVerticalPositionTablet || 50;
    } else {
      return background.loginBlockVerticalPositionDesktop || 50;
    }
  };

  // Determine login block width based on screen size
  const getLoginBlockWidth = () => {
    if (typeof window === 'undefined') return background.loginBlockWidthDesktop || 400;
    
    const width = window.innerWidth;
    if (width < 768) {
      return background.loginBlockWidthMobile || 340;
    } else if (width < 1024) {
      return background.loginBlockWidthTablet || 380;
    } else {
      return background.loginBlockWidthDesktop || 400;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation schemas
      const emailSchema = z.string().trim().email().max(255);
      const usernameSchema = z.string().trim().min(2).max(50)
        .regex(/^[a-zA-Z0-9_\-äöüÄÖÜß]+$/, 'Nur Buchstaben, Zahlen, Bindestrich und Unterstrich erlaubt');
      const passwordSchema = z.string().min(6).max(128);

      // Validate password
      const validatedPassword = passwordSchema.parse(password);
      
      let loginEmail = email.trim();
      
      // Prüfen ob es eine E-Mail ist (enthält @)
      if (!email.includes('@')) {
        // Validate as username
        const validatedUsername = usernameSchema.parse(email);
        
        // Username → E-Mail über sichere Funktion holen
        const { data, error } = await supabase.rpc('get_email_for_login', {
          username_input: validatedUsername
        });
        
        if (error || !data) {
          throw new Error('Benutzername oder Passwort falsch');
        }
        
        loginEmail = data;
      } else {
        // Validate as email
        loginEmail = emailSchema.parse(email);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: validatedPassword,
      });

      if (error) {
        throw new Error('Benutzername oder Passwort falsch');
      }

      toast({
        title: "Erfolgreich angemeldet",
        description: "Sie werden weitergeleitet...",
      });

      // Immer zum Dashboard (Startseite) navigieren nach Login
      navigate("/", { replace: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Eingabefehler",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Anmeldefehler",
          description: error.message || "Benutzername oder Passwort falsch",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailSchema = z.string().trim().email().max(255);
      const usernameSchema = z.string().trim().min(2).max(50)
        .regex(/^[a-zA-Z0-9_\-äöüÄÖÜß]+$/, 'Nur Buchstaben, Zahlen, Bindestrich und Unterstrich erlaubt');

      let resetEmail = email.trim();

      if (!email.includes('@')) {
        const validatedUsername = usernameSchema.parse(email);
        
        const { data, error } = await supabase.rpc('get_email_for_login', {
          username_input: validatedUsername
        });
        
        if (error || !data) {
          throw new Error('Benutzername nicht gefunden');
        }
        
        resetEmail = data;
      } else {
        resetEmail = emailSchema.parse(email);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "E-Mail gesendet",
        description: "Bitte überprüfe dein E-Mail-Postfach und folge den Anweisungen zum Zurücksetzen deines Passworts.",
      });
      
      setShowResetPassword(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Eingabefehler",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler",
          description: error.message || "Fehler beim Zurücksetzen des Passworts",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderBackground = () => {
    const overlayStyle = {
      backgroundColor: `${background.overlayColor}${Math.round((background.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`
    };

    if (background.type === 'image') {
      const mediaUrl = getMediaUrl(background);
      
      if (mediaUrl) {
        return (
          <>
            <img 
              src={mediaUrl}
              alt="Login background"
              className="absolute w-full h-full object-cover"
              style={{ 
                filter: `blur(${background.mediaBlur}px)`,
                transform: 'scale(1.1)',
                inset: '-5%',
                zIndex: 0
              }}
            />
            {background.overlayOpacity > 0 && (
              <div className="absolute inset-0" style={{ ...overlayStyle, zIndex: 1 }} />
            )}
          </>
        );
      }
    }
    
    if (background.type === 'video') {
      const mediaUrl = getMediaUrl(background);
      const shouldShowVideo = !isMobile || background.videoOnMobile;
      
      return (
        <>
          {shouldShowVideo && mediaUrl ? (
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="absolute w-full h-full object-cover"
              style={{ 
                filter: `blur(${background.mediaBlur}px)`,
                transform: 'scale(1.1)',
                inset: '-5%',
                zIndex: 0
              }}
            >
              <source src={mediaUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-background to-muted" style={{ zIndex: 0 }} />
          )}
          {background.overlayOpacity > 0 && (
            <div className="absolute inset-0" style={{ ...overlayStyle, zIndex: 1 }} />
          )}
        </>
      );
    }
    
    // For gradient type, only render overlay if opacity > 0
    if (background.type === 'gradient' && background.overlayOpacity > 0) {
      return <div className="absolute inset-0" style={{ ...overlayStyle, zIndex: 1 }} />;
    }
    
    return null;
  };

  const hasMedia = background.storagePath || background.url;
  const cardOpacity = background.type !== 'gradient' && hasMedia
    ? background.cardOpacity 
    : 95;
  
  const cardBorderBlur = background.cardBorderBlur || 8;
  const cardBorderRadius = background.cardBorderRadius || 8;

  // Show gradient background during loading
  const effectiveBackground = isLoading ? { ...background, type: 'gradient' as const, storagePath: null } : background;

  const effectiveHasMedia = effectiveBackground.storagePath || effectiveBackground.url;

  return (
    <div 
      className={`min-h-screen flex flex-col items-center p-4 relative ${
        effectiveBackground.type === 'gradient' && !effectiveHasMedia
          ? 'bg-gradient-to-br from-background to-muted' 
          : ''
      }`}
      style={{
        paddingTop: `${getLoginBlockPosition()}vh`,
        background: effectiveBackground.type === 'gradient' && effectiveBackground.url ? effectiveBackground.url : undefined
      }}
    >
      {renderBackground()}
      
      {/* Countdown Layer */}
      {background.countdownEnabled && background.countdownEndDate && (
        <div 
          className="absolute inset-0 flex items-start justify-center pointer-events-none" 
          style={{ paddingTop: `${getCountdownPosition()}%`, zIndex: 2 }}
        >
          <Countdown 
            endDate={background.countdownEndDate} 
            text={background.countdownText}
            showDays={background.countdownShowDays}
            fontSize={background.countdownFontSize}
            fontWeight={background.countdownFontWeight}
          />
        </div>
      )}
      
      {/* Login Form */}
      <div 
        className="w-full relative"
        style={{
          maxWidth: `${getLoginBlockWidth()}px`,
          zIndex: 3
        }}
      >
        <form onSubmit={showResetPassword ? handleResetPassword : handleLogin} className="w-full space-y-4 mb-8 pointer-events-auto" autoComplete="on">
          {/* Email Input with Glass Effect */}
          <div 
            className="relative overflow-hidden transition-all duration-300 h-12"
            style={{ 
              borderRadius: `${cardBorderRadius}px`,
              backgroundColor: `${background.inputBgColor}${Math.round(background.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
            }}
          >
            <div className="relative flex items-center gap-3 px-4 h-full">
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                style={{ color: '#000000' }}
                className="flex-1 bg-transparent border-none outline-none placeholder:text-black/50"
              />
            </div>
          </div>

          {/* Password Input with Glass Effect - nur bei Login anzeigen */}
          {!showResetPassword && (
            <div 
              className="relative overflow-hidden transition-all duration-300 h-12"
              style={{ 
                borderRadius: `${cardBorderRadius}px`,
                backgroundColor: `${background.inputBgColor}${Math.round(background.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
              }}
            >
              <div className="relative flex items-center gap-3 px-4 h-full">
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  style={{ color: '#000000' }}
                  className="flex-1 bg-transparent border-none outline-none placeholder:text-black/50"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg transition-all duration-300 h-12"
            disabled={loading}
            style={{ borderRadius: `${cardBorderRadius}px` }}
          >
            {loading ? "Wird geladen..." : showResetPassword ? "Passwort zurücksetzen" : "Anmelden"}
          </Button>
        </form>
        {/* Bottom Links */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <button 
            type="button"
            onClick={() => setShowResetPassword(false)}
            className="text-white hover:text-white/80 transition-colors font-medium"
          >
            Registrieren
          </button>
          <div className="h-4 w-px bg-white/30" />
          <button 
            type="button"
            onClick={() => setShowResetPassword(!showResetPassword)}
            className="text-white hover:text-white/80 transition-colors"
          >
            {showResetPassword ? "Zurück zum Login" : "Passwort vergessen?"}
          </button>
        </div>
      </div>
    </div>
  );
}
