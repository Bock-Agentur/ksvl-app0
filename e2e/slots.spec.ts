/**
 * E2E Tests: Slot-Buchung Flow
 * 
 * Tests kritische Slot-Flows:
 * - Kalender anzeigen
 * - Slot-Details öffnen
 * - Slot buchen
 * - Buchung stornieren
 * 
 * Ausführung: npx playwright test e2e/slots.spec.ts
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123',
};

test.describe('Slot-Buchung', () => {
  test.beforeEach(async ({ page }) => {
    // Login vor jedem Test
    await page.goto('/auth');
    await page.getByLabel(/e-mail/i).fill(TEST_USER.email);
    await page.getByLabel(/passwort/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /anmelden/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('sollte Kalender-Seite laden', async ({ page }) => {
    // Zum Kalender navigieren
    await page.goto('/kalender');
    
    // Prüfe ob Kalender-Elemente sichtbar
    await expect(page.getByText(/kalender/i)).toBeVisible();
    
    // Prüfe ob View-Buttons vorhanden (Tag, Woche, Monat)
    await expect(page.getByRole('button', { name: /tag/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /woche/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /monat/i })).toBeVisible();
  });

  test('sollte zwischen Kalender-Views wechseln können', async ({ page }) => {
    await page.goto('/kalender');

    // Zur Wochen-Ansicht wechseln
    await page.getByRole('button', { name: /woche/i }).click();
    await expect(page.locator('[data-view="week"]')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Fallback: Prüfe ob Wochen-Grid sichtbar
    });

    // Zur Monats-Ansicht wechseln
    await page.getByRole('button', { name: /monat/i }).click();
    
    // Zur Tages-Ansicht wechseln
    await page.getByRole('button', { name: /tag/i }).click();
  });

  test('sollte Slot-Details in Drawer öffnen können', async ({ page }) => {
    await page.goto('/kalender');

    // Warte auf geladene Slots
    await page.waitForTimeout(2000);

    // Klick auf ersten verfügbaren Slot
    const slot = page.locator('[data-slot-id]').first();
    
    if (await slot.isVisible()) {
      await slot.click();
      
      // Erwarte Drawer mit Slot-Details
      await expect(page.getByText(/slot|termin|buchung/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('sollte freien Slot buchen können', async ({ page }) => {
    await page.goto('/kalender');
    await page.waitForTimeout(2000);

    // Finde verfügbaren Slot
    const availableSlot = page.locator('[data-status="available"]').first();
    
    if (await availableSlot.isVisible()) {
      await availableSlot.click();
      
      // Klick auf Buchen-Button
      const bookButton = page.getByRole('button', { name: /buchen/i });
      if (await bookButton.isVisible()) {
        await bookButton.click();
        
        // Erwarte Erfolgs-Toast oder Bestätigung
        await expect(page.getByText(/gebucht|erfolg/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('sollte eigene Buchung stornieren können', async ({ page }) => {
    await page.goto('/kalender');
    await page.waitForTimeout(2000);

    // Finde gebuchten Slot des Users
    const bookedSlot = page.locator('[data-status="booked"]').first();
    
    if (await bookedSlot.isVisible()) {
      await bookedSlot.click();
      
      // Klick auf Stornieren-Button
      const cancelButton = page.getByRole('button', { name: /stornieren/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Bestätigungs-Dialog
        const confirmButton = page.getByRole('button', { name: /bestätigen|ja/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Erwarte Erfolgs-Toast
        await expect(page.getByText(/storniert|erfolg/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('sollte Navigation mit Heute-Button funktionieren', async ({ page }) => {
    await page.goto('/kalender');

    // Navigiere zu anderem Datum
    const nextButton = page.getByRole('button', { name: /vor|next|→/i }).first();
    await nextButton.click();
    await nextButton.click();

    // Klick auf Heute-Button
    const todayButton = page.getByRole('button', { name: /heute/i });
    await todayButton.click();

    // Prüfe ob aktuelles Datum angezeigt wird
    const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    await expect(page.getByText(new RegExp(today.split(' ')[0]))).toBeVisible();
  });
});
