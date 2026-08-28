import { expect, test } from '@playwright/test';

test('sample workflow produces coordinates and survives offline reload', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  await expect(page.getByRole('heading', { name: 'frame_00' })).toBeVisible();
  await page.getByRole('option', { name: /06/ }).click();
  await expect(page.getByText('0.250000, 0.250000')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'frame_05' })).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/Offline mode/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'frame_05' })).toBeVisible();
});

test('keyboard arrows move frame selection', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button', { name: /Load 16-frame sample/ }).isVisible()) await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  const first = page.getByRole('option').first();
  await first.focus();
  await first.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'frame_01' })).toBeVisible();
});
