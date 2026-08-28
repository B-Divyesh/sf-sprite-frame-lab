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
  const undersized = await page.locator('button, a[href], label.file-button').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map((element) => ({ label: (element.textContent ?? '').trim(), height: element.getBoundingClientRect().height }))
    .filter((target) => target.height < 44));
  expect(undersized).toEqual([]);
});

test('file imports expose visible keyboard focus', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('#hero-image-input');
  await input.focus();
  const focusStyle = await input.locator('..').evaluate((label) => {
    const style = getComputedStyle(label);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, borderColor: style.borderColor };
  });
  expect(focusStyle).toEqual({ outlineStyle: 'solid', outlineWidth: '3px', borderColor: 'rgb(85, 221, 224)' });
});

test('a one-pixel sheet cannot create degenerate grid frames', async ({ page }) => {
  await page.goto('/');
  await page.locator('#hero-image-input').setInputFiles({
    name: 'one-pixel.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByRole('heading', { name: 'frame_00' })).toBeVisible();
  await expect(page.locator('#columns')).toHaveAttribute('max', '1');
  await page.locator('#columns').fill('64');
  await page.locator('#columns').press('Enter');
  await expect(page.locator('#columns')).toHaveValue('1');
  await expect(page.locator('.frame-button')).toHaveCount(1);
  await expect(page.locator('#metrics').getByText('1 × 1', { exact: true })).toBeVisible();
});

test('duplicate frame names are rejected before export', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  await page.locator('#map-input').setInputFiles({
    name: 'duplicates.json',
    mimeType: 'application/json',
    buffer: Buffer.from('[{"name":"idle","x":0,"y":0,"w":32,"h":32},{"name":"idle","x":32,"y":0,"w":32,"h":32}]'),
  });
  await expect(page.getByRole('alert')).toContainText('Frame name “idle” is duplicated');
  await expect(page.locator('.frame-button')).toHaveCount(16);
});

test('outline GLSL samples neighbors and compiles in WebGL2', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Load 16-frame sample/ }).click();
  const snippet = await page.locator('#shader-code').textContent();
  expect(snippet).toContain('float neighbor_alpha');
  const result = await page.evaluate((code) => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { ok: false, log: 'WebGL2 unavailable' };
    const shader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(shader, `#version 300 es\nprecision highp float;\nuniform sampler2D u_atlas;\nin vec2 v_uv;\nout vec4 out_color;\n${code}\nvoid main() { out_color = apply_frame_effect(u_atlas, v_uv); }`);
    gl.compileShader(shader);
    return { ok: gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean, log: gl.getShaderInfoLog(shader) };
  }, snippet);
  expect(result).toEqual({ ok: true, log: '' });
});

test('privacy and terms remain accessible with usable targets', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    const shortLinks = await page.locator('a[href]').evaluateAll((links) => links
      .map((link) => ({ label: link.textContent, height: link.getBoundingClientRect().height }))
      .filter((link) => link.height < 44));
    expect(shortLinks).toEqual([]);
  }
});
