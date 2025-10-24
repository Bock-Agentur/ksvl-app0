import { UserRole } from "./user";

export type Tonality = 'formal' | 'funny' | 'witty' | 'sensitive' | 'motivating';
export type ResponseLength = 'short' | 'medium' | 'long';

export interface AIAssistantSettings {
  tonality: Record<UserRole, Tonality>;
  responseLength: ResponseLength;
  customSystemPrompt?: string;
  agentName?: string;
}

export interface AIWelcomeMessageSettings {
  enabled: boolean;
  message: string;
}

export const TONALITY_LABELS: Record<Tonality, string> = {
  formal: 'Formell',
  funny: 'Lustig',
  witty: 'Witzig',
  sensitive: 'Sensibel',
  motivating: 'Motivierend'
};

export const TONALITY_DESCRIPTIONS: Record<Tonality, string> = {
  formal: 'Höflich, professionell',
  funny: 'Locker, humorvoll',
  witty: 'Frech, unterhaltsam',
  sensitive: 'Einfühlsam, verständnisvoll',
  motivating: 'Ermutigend, enthusiastisch'
};

export const RESPONSE_LENGTH_LABELS: Record<ResponseLength, string> = {
  short: 'Kurz',
  medium: 'Mittel',
  long: 'Lang'
};

export const RESPONSE_LENGTH_DESCRIPTIONS: Record<ResponseLength, string> = {
  short: 'max. 500 Tokens',
  medium: 'max. 1000 Tokens',
  long: 'max. 2000 Tokens'
};
