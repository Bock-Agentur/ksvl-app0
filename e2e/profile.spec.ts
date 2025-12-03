/**
 * E2E Tests: Profil-Bearbeitung Flow
 * 
 * Tests kritische Profil-Flows:
 * - Profil anzeigen
 * - Profil bearbeiten
 * - Änderungen speichern
 * - Passwort ändern
 * 
 * Ausführung: npx playwright test e2e/profile.spec.ts
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123',
};

test.describe('Profil-Bearbeitung', () => {
  test.beforeEach(async ({ page }) => {
    // Login vor jedem Test
    await page.goto('/auth');
    await page.getByLabel(/e-mail/i).fill(TEST_USER.email);
    await page.getByLabel(/passwort/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /anmelden/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('sollte Profil-Seite laden', async ({ page }) => {
    await page.goto('/profil');
    
    // Prüfe ob Profil-Header sichtbar
    await expect(page.getByText(/profil/i)).toBeVisible();
    
    // Prüfe ob Bearbeiten-Button vorhanden
    await expect(page.getByRole('button', { name: /bearbeiten/i })).toBeVisible();
  });

  test('sollte Profil-Daten anzeigen', async ({ page }) => {
    await page.goto('/profil');
    
    // Prüfe ob wichtige Profil-Felder sichtbar
    await expect(page.getByText(/e-mail/i)).toBeVisible();
    await expect(page.getByText(/vorname|name/i)).toBeVisible();
  });

  test('sollte Edit-Modus aktivieren können', async ({ page }) => {
    await page.goto('/profil');
    
    // Klick auf Bearbeiten-Button
    await page.getByRole('button', { name: /bearbeiten/i }).click();
    
    // Prüfe ob Speichern-Button erscheint
    await expect(page.getByRole('button', { name: /speichern/i })).toBeVisible();
    
    // Prüfe ob Abbrechen-Button erscheint
    await expect(page.getByRole('button', { name: /abbrechen/i })).toBeVisible();
  });

  test('sollte Profil-Änderungen speichern können', async ({ page }) => {
    await page.goto('/profil');
    
    // Edit-Modus aktivieren
    await page.getByRole('button', { name: /bearbeiten/i }).click();
    
    // Finde ein editierbares Feld (z.B. Telefon)
    const phoneInput = page.getByLabel(/telefon|phone/i);
    if (await phoneInput.isVisible()) {
      // Aktuellen Wert merken
      const currentValue = await phoneInput.inputValue();
      
      // Neuen Wert setzen
      await phoneInput.fill('+43 123 456789');
      
      // Speichern
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Erwarte Erfolgs-Toast
      await expect(page.getByText(/gespeichert|erfolg/i)).toBeVisible({ timeout: 5000 });
      
      // Zurücksetzen für nächsten Test
      await page.getByRole('button', { name: /bearbeiten/i }).click();
      await phoneInput.fill(currentValue || '');
      await page.getByRole('button', { name: /speichern/i }).click();
    }
  });

  test('sollte Edit-Modus abbrechen können', async ({ page }) => {
    await page.goto('/profil');
    
    // Edit-Modus aktivieren
    await page.getByRole('button', { name: /bearbeiten/i }).click();
    
    // Ändere etwas
    const phoneInput = page.getByLabel(/telefon|phone/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('CHANGED_VALUE');
    }
    
    // Abbrechen klicken
    await page.getByRole('button', { name: /abbrechen/i }).click();
    
    // Prüfe ob Bearbeiten-Button wieder da ist
    await expect(page.getByRole('button', { name: /bearbeiten/i })).toBeVisible();
    
    // Änderung sollte nicht gespeichert sein
    if (await phoneInput.isVisible()) {
      await expect(phoneInput).not.toHaveValue('CHANGED_VALUE');
    }
  });

  test('sollte Passwort-Ändern Dialog öffnen können', async ({ page }) => {
    await page.goto('/profil');
    
    // Suche nach Passwort-Ändern Button
    const passwordButton = page.getByRole('button', { name: /passwort.*ändern/i });
    
    if (await passwordButton.isVisible()) {
      await passwordButton.click();
      
      // Prüfe ob Dialog geöffnet
      await expect(page.getByText(/neues passwort/i)).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel(/aktuelles passwort|altes passwort/i)).toBeVisible();
    }
  });

  test('sollte Rollen-Badges anzeigen', async ({ page }) => {
    await page.goto('/profil');
    
    // Prüfe ob Rollen-Anzeige vorhanden
    await expect(page.getByText(/rolle|rollen/i)).toBeVisible();
    
    // Mindestens eine Rolle sollte sichtbar sein
    const roleTexts = ['Admin', 'Mitglied', 'Kranführer', 'Vorstand', 'Gastmitglied'];
    let foundRole = false;
    
    for (const role of roleTexts) {
      const roleElement = page.getByText(new RegExp(role, 'i'));
      if (await roleElement.isVisible().catch(() => false)) {
        foundRole = true;
        break;
      }
    }
    
    expect(foundRole).toBe(true);
  });
});
