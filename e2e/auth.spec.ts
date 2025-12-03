/**
 * E2E Tests: Authentication Flow
 * 
 * Tests kritische Auth-Flows:
 * - Login mit gültigen Credentials
 * - Login mit ungültigen Credentials
 * - Logout
 * - Session-Persistenz
 * 
 * Ausführung: npx playwright test e2e/auth.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test-Credentials (aus .env oder Test-Fixtures)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123',
};

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start auf der Auth-Seite
    await page.goto('/auth');
  });

  test('sollte Login-Formular anzeigen', async ({ page }) => {
    // Prüfe ob Login-Formular sichtbar
    await expect(page.getByRole('heading', { name: /anmelden/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/passwort/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /anmelden/i })).toBeVisible();
  });

  test('sollte Fehler bei ungültigen Credentials anzeigen', async ({ page }) => {
    // Ungültige Credentials eingeben
    await page.getByLabel(/e-mail/i).fill('invalid@example.com');
    await page.getByLabel(/passwort/i).fill('wrongpassword');
    await page.getByRole('button', { name: /anmelden/i }).click();

    // Erwarte Fehlermeldung
    await expect(page.getByText(/ungültige|invalid|fehler/i)).toBeVisible({ timeout: 5000 });
  });

  test('sollte erfolgreich einloggen und zum Dashboard navigieren', async ({ page }) => {
    // Gültige Credentials eingeben
    await page.getByLabel(/e-mail/i).fill(TEST_USER.email);
    await page.getByLabel(/passwort/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /anmelden/i }).click();

    // Erwarte Navigation zum Dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Prüfe ob Dashboard-Elemente sichtbar
    await expect(page.getByText(/willkommen|dashboard/i)).toBeVisible();
  });

  test('sollte erfolgreich ausloggen', async ({ page }) => {
    // Erst einloggen
    await page.getByLabel(/e-mail/i).fill(TEST_USER.email);
    await page.getByLabel(/passwort/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /anmelden/i }).click();
    
    // Warten auf Dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Logout-Button im Footer/Drawer finden und klicken
    const logoutButton = page.getByRole('button', { name: /abmelden|logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Falls Logout im Drawer ist
      await page.getByRole('button', { name: /menü/i }).click();
      await page.getByRole('button', { name: /abmelden/i }).click();
    }

    // Erwarte Redirect zur Auth-Seite
    await expect(page).toHaveURL('/auth', { timeout: 5000 });
  });

  test('sollte Session nach Page-Refresh beibehalten', async ({ page }) => {
    // Einloggen
    await page.getByLabel(/e-mail/i).fill(TEST_USER.email);
    await page.getByLabel(/passwort/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /anmelden/i }).click();
    
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Page refresh
    await page.reload();

    // Sollte immer noch auf Dashboard sein (Session erhalten)
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/willkommen|dashboard/i)).toBeVisible();
  });
});
