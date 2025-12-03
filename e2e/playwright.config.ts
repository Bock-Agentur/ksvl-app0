/**
 * Playwright Configuration
 * 
 * Konfiguration für E2E-Tests der KSVL App.
 * 
 * Setup:
 * 1. npm install -D @playwright/test
 * 2. npx playwright install
 * 3. Erstelle .env mit TEST_USER_EMAIL und TEST_USER_PASSWORD
 * 
 * Ausführung:
 * - Alle Tests: npx playwright test
 * - Mit UI: npx playwright test --ui
 * - Bestimmte Datei: npx playwright test e2e/auth.spec.ts
 * - Debug-Modus: npx playwright test --debug
 */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Lade Umgebungsvariablen
dotenv.config();

export default defineConfig({
  // Test-Verzeichnis
  testDir: './e2e',
  
  // Timeout pro Test
  timeout: 30000,
  
  // Erwartungs-Timeout
  expect: {
    timeout: 5000,
  },
  
  // Parallele Ausführung
  fullyParallel: true,
  
  // Fehlgeschlagene Tests wiederholen
  retries: process.env.CI ? 2 : 0,
  
  // Worker-Anzahl
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Globale Einstellungen
  use: {
    // Base URL der App
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // Screenshots bei Fehlern
    screenshot: 'only-on-failure',
    
    // Videos bei Fehlern
    video: 'retain-on-failure',
    
    // Trace bei Fehlern
    trace: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
  },
  
  // Browser-Projekte
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile Tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Dev-Server automatisch starten
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
