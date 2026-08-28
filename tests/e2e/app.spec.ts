import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('sample workflow produces coordinates and survives offline reload', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  await expect(page.getByRole('heading', { name: 'frame_00' })).toBeVisible();
  await page.getByRole('option', { name: /06/ }).click();
  await expect(page.getByText('0.250000, 0.250000')).toBeVisible();
  await expect(page.getByText(/^Saved /)).toBeVisible();
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

test('empty and editor states have no serious accessibility violations', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  const emptyResults = await new AxeBuilder({ page }).analyze();
  expect(emptyResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  const editorResults = await new AxeBuilder({ page }).analyze();
  expect(editorResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('390px mobile path keeps primary controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Load 16-frame sample/ })).toBeVisible();
  await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  await expect(page.locator('#effect-select')).toBeVisible();
  await page.locator('#effect-select').selectOption('tint');
  await expect(page.getByText(/tint preview/)).toBeVisible();
});
