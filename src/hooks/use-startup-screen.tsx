import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

export interface StartupScreenSettings {
  enabled: boolean;
  duration: number; // in milliseconds
  text: string;
  backgroundType: 'gradient' | 'solid';
  backgroundGradient: string;
  backgroundColor: string;
  
  // Screen Animations
  enterAnimation: string;
  exitAnimation: string;
  mainPageAnimation: string;
  
  // Element Animations
  iconAnimation: string;
  textAnimation: string;
  containerAnimation: string;
  backgroundAnimation: string;
  
  // Advanced Timing
  animationSpeed: number; // 0.2x to 5x
  animationEasing: string;
  enterDuration: number; // in milliseconds
  exitDuration: number; // in milliseconds
  mainPageDuration: number; // in milliseconds
  
  // Element Timing
  iconDelay: number;
  textDelay: number;
  elementStagger: number;
  
  // Advanced Effects
  parallaxEffect: boolean;
  blurEffect: boolean;
  glowEffect: boolean;
  shadowIntensity: number;
  rotationEffect: boolean;
  scaleEffect: boolean;
  
  // Transition Options
  smoothTransitions: boolean;
  hardwareAcceleration: boolean;
  reducedMotion: boolean;
}

const defaultSettings: StartupScreenSettings = {
  enabled: true,
  duration: 3000, // 3 seconds
  text: 'KSVL App',
  backgroundType: 'solid',
  backgroundGradient: 'navy-pink',
  backgroundColor: 'trendy-pink',
  
  // Screen Animations
  enterAnimation: 'slide-up',
  exitAnimation: 'slide-down',
  mainPageAnimation: 'startup-fade-in',
  
  // Element Animations
  iconAnimation: 'float',
  textAnimation: 'slide-up',
  containerAnimation: 'elastic',
  backgroundAnimation: 'fade-in',
  
  // Advanced Timing
  animationSpeed: 1,
  animationEasing: 'ease-out',
  enterDuration: 600,
  exitDuration: 600,
  mainPageDuration: 800,
  
  // Element Timing
  iconDelay: 200,
  textDelay: 200,
  elementStagger: 150,
  
  // Advanced Effects
  parallaxEffect: false,
  blurEffect: false,
  glowEffect: false,
  shadowIntensity: 0,
  rotationEffect: false,
  scaleEffect: false,
  
  // Transition Options
  smoothTransitions: true,
  hardwareAcceleration: true,
  reducedMotion: false
} as const; // Als const markiert für unveränderliche Standardwerte

export function useStartupScreen() {
  const [settings, setSettings] = useState<StartupScreenSettings>(() => {
    const saved = storage.getItem('startupScreenSettings');
    return saved && typeof saved === 'object' ? { ...defaultSettings, ...saved } : defaultSettings;
  });

  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Only show startup screen once per session and if enabled
    if (settings.enabled && !hasShown) {
      setIsVisible(true);
      setHasShown(true);
    }
  }, [settings.enabled, hasShown]);

  const updateSettings = (newSettings: Partial<StartupScreenSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    storage.setItem('startupScreenSettings', updatedSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    storage.setItem('startupScreenSettings', defaultSettings);
  };

  const saveAsDefault = () => {
    storage.setItem('startupScreenDefaults', settings);
  };

  const loadDefaultSettings = () => {
    const savedDefaults = storage.getItem('startupScreenDefaults');
    if (savedDefaults && typeof savedDefaults === 'object') {
      const newSettings = { ...defaultSettings, ...savedDefaults };
      setSettings(newSettings);
      storage.setItem('startupScreenSettings', newSettings);
      return true;
    }
    return false;
  };

  const hideStartupScreen = () => {
    setIsVisible(false);
  };

  const showStartupScreen = () => {
    setIsVisible(true);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    saveAsDefault,
    loadDefaultSettings,
    isVisible,
    hideStartupScreen,
    showStartupScreen
  };
}