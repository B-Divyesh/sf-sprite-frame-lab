export interface FrameRect {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UVBounds {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export function makeGridFrames(width: number, height: number, columns: number, rows: number): FrameRect[] {
  if (![width, height, columns, rows].every(Number.isFinite) || width <= 0 || height <= 0 || columns < 1 || rows < 1) {
    throw new Error('Sheet size, columns, and rows must be positive numbers.');
  }
  const cellW = width / Math.floor(columns);
  const cellH = height / Math.floor(rows);
  return Array.from({ length: Math.floor(columns) * Math.floor(rows) }, (_, index) => {
    const column = index % Math.floor(columns);
    const row = Math.floor(index / Math.floor(columns));
    return {
      name: `frame_${String(index).padStart(2, '0')}`,
      x: Math.round(column * cellW),
      y: Math.round(row * cellH),
      w: Math.round((column + 1) * cellW) - Math.round(column * cellW),
      h: Math.round((row + 1) * cellH) - Math.round(row * cellH),
    };
  });
}

function rectFromUnknown(name: string, value: unknown): FrameRect | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const raw = candidate.frame && typeof candidate.frame === 'object' ? candidate.frame as Record<string, unknown> : candidate;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const w = Number(raw.w ?? raw.width);
  const h = Number(raw.h ?? raw.height);
  if (![x, y, w, h].every(Number.isFinite)) return null;
  return { name: String(candidate.name ?? candidate.filename ?? name), x, y, w, h };
}

export function parseAtlas(text: string, imageWidth: number, imageHeight: number): FrameRect[] {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error('That frame map is not valid JSON. Check commas and quotes, then try again.');
  }
  const root = input as Record<string, unknown>;
  const rawFrames = Array.isArray(input) ? input : root?.frames;
  const parsed: FrameRect[] = [];
  if (Array.isArray(rawFrames)) {
    rawFrames.forEach((frame, index) => {
      const value = rectFromUnknown(`frame_${index}`, frame);
      if (value) parsed.push(value);
    });
  } else if (rawFrames && typeof rawFrames === 'object') {
    Object.entries(rawFrames as Record<string, unknown>).forEach(([name, frame]) => {
      const value = rectFromUnknown(name, frame);
      if (value) parsed.push(value);
    });
  }
  if (!parsed.length) throw new Error('No frames found. Use an array or a TexturePacker-style “frames” object with x, y, w, and h.');
  const invalid = parsed.find((frame) => frame.x < 0 || frame.y < 0 || frame.w <= 0 || frame.h <= 0 || frame.x + frame.w > imageWidth || frame.y + frame.h > imageHeight);
  if (invalid) throw new Error(`Frame “${invalid.name}” falls outside the ${imageWidth} × ${imageHeight} sheet.`);
  return parsed;
}

export function uvFor(frame: FrameRect, imageWidth: number, imageHeight: number): UVBounds {
  return {
    u0: frame.x / imageWidth,
    v0: frame.y / imageHeight,
    u1: (frame.x + frame.w) / imageWidth,
    v1: (frame.y + frame.h) / imageHeight,
  };
}

export function genericAtlas(name: string, width: number, height: number, frames: FrameRect[]): string {
  return JSON.stringify({
    meta: { image: name, size: { w: width, h: height }, format: 'Frame UV Lab generic atlas v1' },
    frames: Object.fromEntries(frames.map((frame) => [frame.name, { frame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h } }])),
  }, null, 2);
}

export function shaderSnippet(frame: FrameRect, width: number, height: number, effect: string, amount: number, color: string): string {
  const uv = uvFor(frame, width, height);
  const f = (value: number) => value.toFixed(8);
  const rgb = color.match(/[a-f\d]{2}/gi)?.map((part) => parseInt(part, 16) / 255) ?? [0.33, 0.87, 0.88];
  const tint = rgb.map(f).join(', ');
  const effectLine = effect === 'tint'
    ? `color.rgb = mix(color.rgb, vec3(${tint}), ${f(amount)});`
    : effect === 'dissolve'
      ? `if (hash(floor(local_uv * frame_size)) < ${f(amount)}) discard;`
      : effect === 'flash'
        ? `color.rgb = mix(color.rgb, vec3(1.0), ${f(amount)});`
        : effect === 'scanline'
          ? `color.rgb *= 0.72 + 0.28 * step(0.5, fract(local_uv.y * frame_size.y * 0.5));`
          : '// Outline needs neighboring atlas texels; sample with pixel_size offsets.';
  return `// Frame UV Lab example — validate syntax and texture origin in your engine.\n// Frame: ${frame.name} (${frame.x}, ${frame.y}, ${frame.w}, ${frame.h})\nconst vec2 FRAME_UV_MIN = vec2(${f(uv.u0)}, ${f(uv.v0)});\nconst vec2 FRAME_UV_MAX = vec2(${f(uv.u1)}, ${f(uv.v1)});\nconst vec2 FRAME_PIXEL_SIZE = vec2(${f(1 / width)}, ${f(1 / height)});\n\nfloat hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n\nvec4 apply_frame_effect(sampler2D atlas, vec2 atlas_uv) {\n  vec2 local_uv = (atlas_uv - FRAME_UV_MIN) / (FRAME_UV_MAX - FRAME_UV_MIN);\n  vec2 frame_size = vec2(${f(frame.w)}, ${f(frame.h)});\n  vec4 color = texture(atlas, atlas_uv);\n  ${effectLine}\n  return color;\n}`;
}
