import './style.css';
import { FrameRect, genericAtlas, makeGridFrames, parseAtlas, shaderSnippet, uvFor } from './atlas';
import { loadWorkspace, saveWorkspace } from './storage';
import { acceptReturnedLicense, checkoutUrl, licenseState, storeLicense, verifyLicense } from './license';

interface AppState {
  blob: Blob;
  name: string;
  width: number;
  height: number;
  columns: number;
  rows: number;
  frames: FrameRect[];
  customFrames: boolean;
  selected: number;
  effect: string;
  amount: number;
  color: string;
}

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: AppState | null = null;
let sourceImage: HTMLImageElement | null = null;
let proUnlocked = false;
let saveTimer = 0;

app.innerHTML = `
  <header class="app-header">
    <div class="brand">
      <img src="/icons/icon.svg" width="42" height="42" alt="" />
      <div class="brand-copy"><div class="eyebrow">Sprite coordinate workbench</div><h1>Frame UV Lab</h1></div>
    </div>
    <div class="header-meta"><span class="privacy-note">Your art stays on this device</span><span class="save-status" id="save-status">Local</span></div>
  </header>
  <p class="offline-banner" id="offline-banner" role="status" hidden>Offline mode — editing and exports still work on this device.</p>
  <main id="main" class="workspace" tabindex="-1"></main>
  <footer class="app-footer">
    <span>Local-first. Generated illustration disclosed. No analytics or uploads.</span>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
  </footer>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
`;

const main = document.querySelector<HTMLElement>('#main')!;
const saveStatus = document.querySelector<HTMLElement>('#save-status')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const offlineBanner = document.querySelector<HTMLElement>('#offline-banner')!;

function announce(message: string, action?: string): void {
  toast.innerHTML = action ? `${message}<button type="button" class="button-small">${action}</button>` : message;
  toast.hidden = false;
  window.setTimeout(() => { if (!action) toast.hidden = true; }, 3200);
}

function updateNetworkState(): void {
  offlineBanner.hidden = navigator.onLine;
}
window.addEventListener('online', updateNetworkState);
window.addEventListener('offline', updateNetworkState);
updateNetworkState();

function renderEmpty(): void {
  main.innerHTML = `
    <section class="empty-state" aria-labelledby="start-heading">
      <div class="empty-copy">
        <div class="eyebrow">Atlas coordinates, made visible</div>
        <h2 id="start-heading">Stop guessing where the frame begins.</h2>
        <p>Drop in a sprite sheet, pick a frame, and test UV-aware effects against the exact crop. Export normalized constants and a clean generic atlas without hand-deriving coordinates.</p>
        <div class="hero-actions">
          <label class="button button-primary file-button">Import sprite sheet<input id="hero-image-input" type="file" accept="image/png,image/jpeg,image/webp" /></label>
          <button id="sample-button" type="button">Load 16-frame sample <span aria-hidden="true">→</span></button>
        </div>
        <p class="hero-note">PNG, JPEG, or WebP · up to 20 MB · processed locally</p>
      </div>
      <figure class="plate-wrap">
        <picture><img src="/assets/uv-blueprint-plate.webp" width="1200" height="800" alt="Blueprint drawing connecting one enlarged robot pose to its cell in a four-by-four sprite sheet" fetchpriority="high" decoding="async" /></picture>
        <figcaption class="plate-caption">Generated concept plate · 16-frame method</figcaption>
      </figure>
    </section>`;
  document.querySelector<HTMLInputElement>('#hero-image-input')!.addEventListener('change', imageInputChanged);
  document.querySelector<HTMLButtonElement>('#sample-button')!.addEventListener('click', loadSample);
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The browser could not decode that image. Try a PNG, JPEG, or WebP file.')); };
    image.src = url;
  });
}

async function openSheet(blob: Blob, name: string, columns = 4, rows = 4, customFrames?: FrameRect[]): Promise<void> {
  const image = await loadImage(blob);
  if (image.naturalWidth * image.naturalHeight > 25_000_000) throw new Error('That sheet is over 25 megapixels. Resize it to keep previews responsive.');
  sourceImage = image;
  state = {
    blob, name, width: image.naturalWidth, height: image.naturalHeight, columns, rows,
    frames: customFrames ?? makeGridFrames(image.naturalWidth, image.naturalHeight, columns, rows),
    customFrames: Boolean(customFrames), selected: 0, effect: 'outline', amount: .55, color: '#55dde0',
  };
  renderEditor();
  scheduleSave();
}

async function imageInputChanged(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return announce('Use a PNG, JPEG, or WebP sprite sheet.');
  if (file.size > 20 * 1024 * 1024) return announce('That file is over 20 MB. Compress or resize it first.');
  try { await openSheet(file, file.name); } catch (error) { announce((error as Error).message); }
}

function createSampleBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i += 1) {
    const ox = (i % 4) * 64;
    const oy = Math.floor(i / 4) * 64;
    const bob = Math.round(Math.sin(i * .85) * 4);
    ctx.fillStyle = i % 2 ? '#5adbe0' : '#80ecce';
    ctx.fillRect(ox + 19, oy + 16 + bob, 26, 23);
    ctx.fillStyle = '#0b1e2a';
    ctx.fillRect(ox + 24, oy + 23 + bob, 5, 6);
    ctx.fillRect(ox + 35, oy + 23 + bob, 5, 6);
    ctx.fillStyle = '#ffc857';
    ctx.fillRect(ox + 29, oy + 8 + bob, 6, 8);
    ctx.fillStyle = '#f1f7f2';
    ctx.fillRect(ox + 21 + (i % 3), oy + 41 + bob, 8, 13);
    ctx.fillRect(ox + 35 - (i % 3), oy + 41 + bob, 8, 13);
    ctx.fillRect(ox + 10, oy + 26 + bob + (i % 2) * 5, 9, 6);
    ctx.fillRect(ox + 45, oy + 31 + bob - (i % 2) * 5, 9, 6);
  }
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the sample sheet.')), 'image/png'));
}

async function loadSample(): Promise<void> {
  try { await openSheet(await createSampleBlob(), 'frame-uv-sample.png'); announce('Sample loaded. Choose any frame to begin.'); }
  catch (error) { announce((error as Error).message); }
}

function renderEditor(): void {
  if (!state) return;
  const current = state.frames[state.selected] ?? state.frames[0];
  const proOption = (value: string, label: string) => `<option value="${value}" ${state!.effect === value ? 'selected' : ''} ${proUnlocked ? '' : 'disabled'}>${label}${proUnlocked ? '' : ' — Pro'}</option>`;
  main.innerHTML = `
    <div class="lab-layout">
      <aside class="source-panel" aria-label="Sprite source and frames">
        <section class="panel-section">
          <h2 class="panel-heading" data-index="01 / SOURCE">Sprite sheet</h2>
          <div class="button-row">
            <label class="button button-small file-button">Replace image<input id="image-input" type="file" accept="image/png,image/jpeg,image/webp" /></label>
            <button id="sample-button" class="button-small button-quiet" type="button">Use sample</button>
          </div>
          <div class="sheet-wrap"><canvas id="sheet-canvas" aria-label="Sprite sheet map; click a cell to select its frame"></canvas></div>
          <div class="sheet-meta"><span>${escapeHtml(state.name)}</span><span>${state.width} × ${state.height}</span></div>
        </section>
        <section class="panel-section">
          <h2 class="panel-heading" data-index="02 / MAP">Frame map</h2>
          <p class="section-copy">Use an even grid, or import TexturePacker/generic JSON.</p>
          <div class="grid-pair">
            <label>Columns<input id="columns" type="number" min="1" max="64" value="${state.columns}" ${state.customFrames ? 'disabled' : ''} /></label>
            <label>Rows<input id="rows" type="number" min="1" max="64" value="${state.rows}" ${state.customFrames ? 'disabled' : ''} /></label>
          </div>
          <div class="button-row" style="margin-top:10px">
            <label class="button button-small file-button">Import frame JSON<input id="map-input" type="file" accept="application/json,.json" /></label>
            ${state.customFrames ? '<button id="reset-grid" class="button-small button-quiet" type="button">Return to grid</button>' : ''}
          </div>
          <p id="map-error" class="error" role="alert"></p>
        </section>
        <section class="panel-section">
          <h2 class="panel-heading" data-index="03 / FRAME">Frames <span class="eyebrow">${state.frames.length}</span></h2>
          <div class="frame-list" role="listbox" aria-label="Frames" aria-activedescendant="frame-${state.selected}">
            ${state.frames.map((frame, index) => `<button id="frame-${index}" class="frame-button" type="button" role="option" aria-selected="${index === state!.selected}" data-frame="${index}" title="${escapeHtml(frame.name)}">${String(index + 1).padStart(2, '0')}<br>${frame.w}×${frame.h}</button>`).join('')}
          </div>
        </section>
      </aside>
      <section class="stage" aria-labelledby="preview-heading">
        <div class="stage-head"><div><div class="eyebrow">Live specimen</div><h2 id="preview-heading">${escapeHtml(current.name)}</h2></div><span class="zoom-mark">FRAME ${state.selected + 1} / ${state.frames.length}</span></div>
        <div class="preview-well"><canvas id="preview-canvas" width="512" height="512" role="img" aria-label="Effect preview for ${escapeHtml(current.name)}"></canvas></div>
        <p id="preview-description" class="preview-alt"></p>
        <div class="effect-bar">
          <label>Effect<select id="effect-select">
            <option value="outline" ${state.effect === 'outline' ? 'selected' : ''}>Pixel outline</option>
            <option value="tint" ${state.effect === 'tint' ? 'selected' : ''}>Color tint</option>
            <option value="dissolve" ${state.effect === 'dissolve' ? 'selected' : ''}>Dissolve mask</option>
            ${proOption('flash', 'Damage flash')}${proOption('scanline', 'CRT scanline')}
          </select></label>
          <label><span class="range-line">Amount <output id="amount-output" class="range-value">${Math.round(state.amount * 100)}%</output></span><input id="amount" type="range" min="0" max="1" step="0.01" value="${state.amount}" /></label>
          <label>Color<input id="effect-color" type="color" value="${state.color}" /></label>
        </div>
      </section>
      <aside class="inspector" aria-label="UV output and export">
        <section class="panel-section">
          <h2 class="panel-heading" data-index="04 / BOUNDS">Measured bounds</h2>
          <dl class="metrics" id="metrics"></dl>
        </section>
        <section class="panel-section">
          <h2 class="panel-heading" data-index="05 / SHADER">Shader example</h2>
          <p class="notice">Example GLSL only. Validate syntax, texture origin, filtering, and uniforms in your target engine.</p>
          <div class="code-wrap"><pre id="shader-code" tabindex="0"></pre></div>
          <div class="code-actions"><button id="copy-shader" type="button" class="button-small">Copy GLSL</button><button id="export-atlas" type="button" class="button-small">Export atlas JSON</button></div>
        </section>
        <section class="panel-section">
          <h2 class="panel-heading" data-index="06 / PACKS">Effect packs</h2>
          ${renderProBox()}
        </section>
      </aside>
    </div>`;
  bindEditorEvents();
  drawAll();
}

function renderProBox(): string {
  if (proUnlocked) return `<div class="pro-box"><div class="pro-title"><strong>Pro unlocked</strong><span class="badge">ACTIVE</span></div><p>Damage flash and CRT scanline templates are ready. Your license is stored only on this device.</p><button id="verify-license" class="button-small" type="button">Verify license</button></div>`;
  return `<div class="pro-box"><div class="pro-title"><strong>Frame UV Pro · $12</strong><span class="badge">ONE TIME</span></div><p>Add damage-flash and scanline templates plus future engine export targets. Free atlas and GLSL exports stay free.</p><a class="button button-primary button-small" href="${checkoutUrl}">Buy Pro securely</a><label style="margin-top:12px">Have a license?<span class="license-row"><input id="license-input" type="text" autocomplete="off" aria-label="License token" placeholder="Paste license token" /><button id="restore-license" class="button-small" type="button">Restore</button></span></label><p id="license-message" class="error" role="status"></p><p class="legal-mini">Checkout is hosted by Sociobot; Dodo is merchant of record. Refunds there revoke the license. See <a href="/terms/">terms</a>.</p></div>`;
}

function bindEditorEvents(): void {
  document.querySelector<HTMLInputElement>('#image-input')!.addEventListener('change', imageInputChanged);
  document.querySelector<HTMLButtonElement>('#sample-button')!.addEventListener('click', loadSample);
  document.querySelector<HTMLInputElement>('#columns')!.addEventListener('change', gridChanged);
  document.querySelector<HTMLInputElement>('#rows')!.addEventListener('change', gridChanged);
  document.querySelector<HTMLInputElement>('#map-input')!.addEventListener('change', mapInputChanged);
  document.querySelector<HTMLButtonElement>('#reset-grid')?.addEventListener('click', resetGrid);
  document.querySelector<HTMLCanvasElement>('#sheet-canvas')!.addEventListener('click', sheetClicked);
  document.querySelector<HTMLDivElement>('.frame-list')!.addEventListener('click', frameClicked);
  document.querySelector<HTMLDivElement>('.frame-list')!.addEventListener('keydown', frameKeydown);
  document.querySelector<HTMLSelectElement>('#effect-select')!.addEventListener('change', effectChanged);
  document.querySelector<HTMLInputElement>('#amount')!.addEventListener('input', effectChanged);
  document.querySelector<HTMLInputElement>('#effect-color')!.addEventListener('input', effectChanged);
  document.querySelector<HTMLButtonElement>('#copy-shader')!.addEventListener('click', copyShader);
  document.querySelector<HTMLButtonElement>('#export-atlas')!.addEventListener('click', exportAtlas);
  document.querySelector<HTMLButtonElement>('#restore-license')?.addEventListener('click', restoreLicense);
  document.querySelector<HTMLButtonElement>('#verify-license')?.addEventListener('click', () => checkLicense(true));
}

function gridChanged(): void {
  if (!state) return;
  const columns = Math.max(1, Math.min(64, Number(document.querySelector<HTMLInputElement>('#columns')!.value)));
  const rows = Math.max(1, Math.min(64, Number(document.querySelector<HTMLInputElement>('#rows')!.value)));
  state.columns = columns; state.rows = rows; state.frames = makeGridFrames(state.width, state.height, columns, rows); state.selected = 0; state.customFrames = false;
  renderEditor(); scheduleSave();
}

async function mapInputChanged(event: Event): Promise<void> {
  if (!state) return;
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    state.frames = parseAtlas(await file.text(), state.width, state.height);
    state.customFrames = true; state.selected = 0;
    renderEditor(); scheduleSave(); announce(`Imported ${state.frames.length} frames from ${file.name}.`);
  } catch (error) {
    const target = document.querySelector<HTMLElement>('#map-error');
    if (target) target.textContent = (error as Error).message;
  }
}

function resetGrid(): void {
  if (!state) return;
  state.frames = makeGridFrames(state.width, state.height, state.columns, state.rows); state.customFrames = false; state.selected = 0;
  renderEditor(); scheduleSave();
}

function selectFrame(index: number, focus = false): void {
  if (!state) return;
  state.selected = Math.max(0, Math.min(state.frames.length - 1, index));
  renderEditor(); scheduleSave();
  if (focus) document.querySelector<HTMLButtonElement>(`#frame-${state.selected}`)?.focus();
}

function frameClicked(event: Event): void {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-frame]');
  if (button) selectFrame(Number(button.dataset.frame), true);
}

function frameKeydown(event: KeyboardEvent): void {
  if (!state || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? state.columns : event.key === 'ArrowUp' ? -state.columns : 0;
  selectFrame(event.key === 'Home' ? 0 : event.key === 'End' ? state.frames.length - 1 : state.selected + delta, true);
}

function sheetClicked(event: MouseEvent): void {
  if (!state) return;
  const canvas = event.currentTarget as HTMLCanvasElement;
  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width * state.width;
  const y = (event.clientY - bounds.top) / bounds.height * state.height;
  const index = state.frames.findIndex((frame) => x >= frame.x && x < frame.x + frame.w && y >= frame.y && y < frame.y + frame.h);
  if (index >= 0) selectFrame(index);
}

function effectChanged(): void {
  if (!state) return;
  state.effect = document.querySelector<HTMLSelectElement>('#effect-select')!.value;
  state.amount = Number(document.querySelector<HTMLInputElement>('#amount')!.value);
  state.color = document.querySelector<HTMLInputElement>('#effect-color')!.value;
  document.querySelector<HTMLOutputElement>('#amount-output')!.value = `${Math.round(state.amount * 100)}%`;
  drawPreview(); updateOutputs(); scheduleSave();
}

function drawAll(): void { drawSheet(); drawPreview(); updateOutputs(); }

function drawSheet(): void {
  if (!state || !sourceImage) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#sheet-canvas')!;
  const scale = Math.min(1, 800 / state.width, 420 / state.height);
  canvas.width = Math.max(1, Math.round(state.width * scale)); canvas.height = Math.max(1, Math.round(state.height * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false; ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
  state.frames.forEach((frame, index) => {
    ctx.strokeStyle = index === state!.selected ? '#55dde0' : 'rgba(241,247,242,.48)';
    ctx.lineWidth = index === state!.selected ? 3 : 1;
    ctx.strokeRect(frame.x * scale + .5, frame.y * scale + .5, frame.w * scale - 1, frame.h * scale - 1);
    if (index === state!.selected) { ctx.fillStyle = 'rgba(85,221,224,.16)'; ctx.fillRect(frame.x * scale, frame.y * scale, frame.w * scale, frame.h * scale); }
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawPreview(): void {
  if (!state || !sourceImage) return;
  const frame = state.frames[state.selected];
  const canvas = document.querySelector<HTMLCanvasElement>('#preview-canvas')!;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(7, 430 / Math.max(frame.w, frame.h));
  const dw = Math.max(1, Math.round(frame.w * scale)), dh = Math.max(1, Math.round(frame.h * scale));
  const dx = Math.round((canvas.width - dw) / 2), dy = Math.round((canvas.height - dh) / 2);
  ctx.imageSmoothingEnabled = false;
  if (state.effect === 'outline') {
    const thickness = Math.max(2, Math.round(3 + state.amount * 8));
    ctx.filter = `drop-shadow(${thickness}px 0 0 ${state.color}) drop-shadow(-${thickness}px 0 0 ${state.color}) drop-shadow(0 ${thickness}px 0 ${state.color}) drop-shadow(0 -${thickness}px 0 ${state.color})`;
  }
  ctx.drawImage(sourceImage, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
  ctx.filter = 'none';
  if (state.effect === 'tint' || state.effect === 'flash') {
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = state.effect === 'flash' ? `rgba(255,255,255,${state.amount})` : hexToRgba(state.color, state.amount); ctx.fillRect(dx, dy, dw, dh); ctx.globalCompositeOperation = 'source-over';
  }
  if (state.effect === 'scanline') {
    ctx.fillStyle = `rgba(3,12,18,${.2 + state.amount * .55})`;
    for (let y = dy; y < dy + dh; y += 6) ctx.fillRect(dx, y, dw, 3);
  }
  if (state.effect === 'dissolve' && state.amount > 0) {
    const data = ctx.getImageData(dx, dy, dw, dh);
    for (let y = 0; y < dh; y += 1) for (let x = 0; x < dw; x += 1) {
      const noise = Math.abs(Math.sin((x * 12.9898 + y * 78.233 + state.selected * 4.21)) * 43758.5453) % 1;
      if (noise < state.amount) data.data[(y * dw + x) * 4 + 3] = 0;
    }
    ctx.putImageData(data, dx, dy);
  }
  canvas.setAttribute('aria-label', `${frame.name} preview with ${state.effect} effect at ${Math.round(state.amount * 100)} percent`);
}

function updateOutputs(): void {
  if (!state) return;
  const frame = state.frames[state.selected];
  const uv = uvFor(frame, state.width, state.height);
  document.querySelector<HTMLElement>('#metrics')!.innerHTML = `
    <div class="metric"><dt>Pixel origin</dt><dd>${frame.x}, ${frame.y}</dd></div><div class="metric"><dt>Pixel size</dt><dd>${frame.w} × ${frame.h}</dd></div>
    <div class="metric"><dt>UV min</dt><dd>${uv.u0.toFixed(6)}, ${uv.v0.toFixed(6)}</dd></div><div class="metric"><dt>UV max</dt><dd>${uv.u1.toFixed(6)}, ${uv.v1.toFixed(6)}</dd></div>`;
  document.querySelector<HTMLElement>('#shader-code')!.textContent = shaderSnippet(frame, state.width, state.height, state.effect, state.amount, state.color);
  document.querySelector<HTMLElement>('#preview-description')!.textContent = `${frame.name}: ${frame.w} by ${frame.h} pixels at sheet position ${frame.x}, ${frame.y}. UV range ${uv.u0.toFixed(4)}, ${uv.v0.toFixed(4)} to ${uv.u1.toFixed(4)}, ${uv.v1.toFixed(4)}. ${state.effect} preview at ${Math.round(state.amount * 100)} percent.`;
}

async function copyShader(): Promise<void> {
  const code = document.querySelector<HTMLElement>('#shader-code')!.textContent ?? '';
  try { await navigator.clipboard.writeText(code); announce('GLSL example copied with this frame’s UV constants.'); }
  catch { announce('Clipboard access was blocked. Select the code and copy it manually.'); }
}

function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

function exportAtlas(): void {
  if (!state) return;
  download(`${state.name.replace(/\.[^.]+$/, '')}.atlas.json`, genericAtlas(state.name, state.width, state.height, state.frames), 'application/json');
  announce(`Atlas JSON exported with ${state.frames.length} frame${state.frames.length === 1 ? '' : 's'}.`);
}

async function restoreLicense(): Promise<void> {
  const field = document.querySelector<HTMLInputElement>('#license-input')!;
  const message = document.querySelector<HTMLElement>('#license-message')!;
  if (!field.value.trim()) { message.textContent = 'Paste the license token from your receipt.'; return; }
  storeLicense(field.value);
  proUnlocked = true; renderEditor(); announce('License saved. Verifying in the background…'); await checkLicense(true);
}

async function checkLicense(force = false): Promise<void> {
  try {
    const verdict = await verifyLicense(force);
    if (!verdict) return;
    proUnlocked = verdict.valid;
    if (!verdict.valid && state && ['flash', 'scanline'].includes(state.effect)) state.effect = 'outline';
    renderEditor();
    announce(verdict.valid ? 'Pro license verified.' : 'License no longer active. Free tools remain available.');
  } catch { announce('Could not reach license verification. Cached access is unchanged.'); }
}

function scheduleSave(): void {
  if (!state) return;
  saveStatus.textContent = 'Saving…';
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    if (!state) return;
    try {
      await saveWorkspace({ image: state.blob, name: state.name, width: state.width, height: state.height, columns: state.columns, rows: state.rows, frames: state.customFrames ? state.frames : null, selected: state.selected, effect: state.effect, amount: state.amount, color: state.color, savedAt: Date.now() });
      saveStatus.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch { saveStatus.textContent = 'Save failed'; announce('Local save failed. Your current tab still works; export before closing.'); }
  }, 350);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
}

async function restoreWorkspace(): Promise<void> {
  try {
    const saved = await loadWorkspace();
    if (!saved) { renderEmpty(); return; }
    const image = await loadImage(saved.image);
    sourceImage = image;
    const frames = saved.frames as FrameRect[] | null;
    state = { blob: saved.image, name: saved.name, width: saved.width, height: saved.height, columns: saved.columns, rows: saved.rows, frames: frames ?? makeGridFrames(saved.width, saved.height, saved.columns, saved.rows), customFrames: Boolean(frames), selected: saved.selected, effect: saved.effect, amount: saved.amount, color: saved.color };
    renderEditor(); saveStatus.textContent = `Restored ${new Date(saved.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch { renderEmpty(); announce('The saved workspace could not be restored. Start with a new sheet.'); }
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          announce('A new lab build is ready.', 'Reload');
          toast.querySelector('button')?.addEventListener('click', () => location.reload());
        }
      });
    });
  } catch { /* The lab still works when service workers are unavailable. */ }
}

async function init(): Promise<void> {
  const returned = acceptReturnedLicense();
  const license = licenseState(); proUnlocked = license.unlocked;
  await restoreWorkspace();
  if (returned) { announce('License received. Pro is available while verification completes.'); void checkLicense(true); }
  else if (license.token) void checkLicense();
  void registerServiceWorker();
}

void init();
