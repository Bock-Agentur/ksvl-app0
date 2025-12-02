/**
 * LoginPreviewCard Component
 * 
 * Displays a live preview of the login background settings.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import type { LoginBackground } from "@/hooks";
import { CountdownPreview } from "./countdown-preview";

interface LoginPreviewCardProps {
  localSettings: LoginBackground;
  previewUrl: string | null;
}

export function LoginPreviewCard({ localSettings, previewUrl }: LoginPreviewCardProps) {
  if (!previewUrl) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Vorschau</Label>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-2" />
              Originalgröße
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md h-[80vh] p-0">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              {localSettings.type === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                  style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                />
              )}
              {/* Overlay Layer */}
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundColor: `${localSettings.overlayColor}${Math.round((localSettings.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
                  zIndex: 1
                }}
              />
              {/* Countdown Layer */}
              {localSettings.countdownEnabled && localSettings.countdownEndDate && (
                <div 
                  className="absolute inset-0 flex flex-col items-center"
                  style={{ 
                    paddingTop: `${localSettings.countdownVerticalPositionDesktop}%`,
                    zIndex: 2
                  }}
                >
                  <CountdownPreview 
                    endDate={localSettings.countdownEndDate}
                    text={localSettings.countdownText}
                    showDays={localSettings.countdownShowDays}
                    fontSize={localSettings.countdownFontSize}
                    fontWeight={localSettings.countdownFontWeight}
                  />
                </div>
              )}
              {/* Login Form Layer */}
              <div 
                className="absolute inset-0 flex flex-col items-center p-4"
                style={{ 
                  zIndex: 3,
                  paddingTop: `${localSettings.loginBlockVerticalPositionDesktop || 50}vh`
                }}
              >
                <div 
                  className="w-full space-y-3"
                  style={{ maxWidth: `${localSettings.loginBlockWidthDesktop || 400}px` }}
                >
                  <div 
                    className="flex items-center gap-3 px-4"
                    style={{
                      backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                      borderRadius: `${localSettings.cardBorderRadius}px`,
                      height: '48px'
                    }}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: 'rgba(0, 0, 0, 0.5)' }}>E-Mail oder Benutzername</span>
                  </div>
                  <div 
                    className="flex items-center gap-3 px-4"
                    style={{
                      backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                      borderRadius: `${localSettings.cardBorderRadius}px`,
                      height: '48px'
                    }}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span style={{ color: 'rgba(0, 0, 0, 0.5)' }}>Passwort</span>
                  </div>
                  <div 
                    className="w-full bg-primary text-primary-foreground font-medium text-center shadow-lg flex items-center justify-center"
                    style={{ 
                      borderRadius: `${localSettings.cardBorderRadius}px`,
                      height: '48px'
                    }}
                  >
                    Anmelden
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Mobile Preview */}
      <div className="relative w-full rounded-lg overflow-hidden border mx-auto" style={{ aspectRatio: '9/19.5', maxWidth: '280px' }}>
        {localSettings.type === 'video' ? (
          <video
            src={localSettings.url || previewUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
          />
        ) : (
          <img
            src={localSettings.url || previewUrl}
            alt="Background preview"
            className="w-full h-full object-cover"
            style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
          />
        )}
        {/* Overlay Layer */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: `${localSettings.overlayColor}${Math.round((localSettings.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
            zIndex: 1
          }}
        />
        {/* Countdown Layer */}
        {localSettings.countdownEnabled && localSettings.countdownEndDate && (
          <div 
            className="absolute inset-0 flex flex-col items-center"
            style={{ 
              paddingTop: `${localSettings.countdownVerticalPositionMobile}%`,
              zIndex: 2
            }}
          >
            <CountdownPreview 
              endDate={localSettings.countdownEndDate}
              text={localSettings.countdownText}
              small
              showDays={localSettings.countdownShowDays}
              fontSize={localSettings.countdownFontSize}
              fontWeight={localSettings.countdownFontWeight}
            />
          </div>
        )}
        {/* Login Form Layer */}
        <div 
          className="absolute inset-0 flex flex-col items-center p-4"
          style={{ 
            zIndex: 3,
            paddingTop: `${localSettings.loginBlockVerticalPositionMobile || 50}vh`
          }}
        >
          <div 
            className="w-full space-y-2"
            style={{ maxWidth: `${localSettings.loginBlockWidthMobile || 340}px` }}
          >
            <div 
              className="flex items-center gap-2 px-3 text-xs"
              style={{
                backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                borderRadius: `${localSettings.cardBorderRadius}px`,
                height: '36px',
                color: '#000000'
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>E-Mail</span>
            </div>
            <div 
              className="flex items-center gap-2 px-3 text-xs"
              style={{
                backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                borderRadius: `${localSettings.cardBorderRadius}px`,
                height: '36px',
                color: '#000000'
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>Passwort</span>
            </div>
            <div 
              className="w-full bg-primary text-primary-foreground text-xs font-medium text-center shadow-lg flex items-center justify-center"
              style={{ 
                borderRadius: `${localSettings.cardBorderRadius}px`,
                height: '36px'
              }}
            >
              Anmelden
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
