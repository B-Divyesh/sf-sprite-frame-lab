import { describe, expect, it } from 'vitest';
import { genericAtlas, makeGridFrames, parseAtlas, shaderSnippet, uvFor } from '../src/atlas';

describe('grid frame math', () => {
  it('covers a non-divisible sheet without gaps at the far edge', () => {
    const frames = makeGridFrames(101, 67, 4, 2);
    expect(frames).toHaveLength(8);
    expect(frames[0]).toMatchObject({ x: 0, y: 0, w: 25, h: 34 });
    expect(frames[7].x + frames[7].w).toBe(101);
    expect(frames[7].y + frames[7].h).toBe(67);
  });

  it('returns exact normalized bounds', () => {
    expect(uvFor({ name: 'walk', x: 64, y: 32, w: 32, h: 32 }, 128, 64)).toEqual({ u0: .5, v0: .5, u1: .75, v1: 1 });
  });

  it('rejects grids that would create zero-area frames', () => {
    expect(() => makeGridFrames(1, 1, 64, 4)).toThrow(/cannot exceed.*1 pixel columns by 1 pixel rows/i);
    expect(makeGridFrames(1, 1, 1, 1)).toEqual([{ name: 'frame_00', x: 0, y: 0, w: 1, h: 1 }]);
  });
});

describe('atlas import and export', () => {
  it('accepts TexturePacker object frames', () => {
    const frames = parseAtlas('{"frames":{"idle":{"frame":{"x":0,"y":1,"w":16,"h":15}}}}', 32, 32);
    expect(frames[0]).toEqual({ name: 'idle', x: 0, y: 1, w: 16, h: 15 });
  });

  it('accepts generic frame arrays and preserves names', () => {
    const frames = parseAtlas('[{"name":"hit","x":4,"y":5,"width":10,"height":11}]', 32, 32);
    expect(frames[0].name).toBe('hit');
  });

  it('rejects frames outside the source sheet', () => {
    expect(() => parseAtlas('[{"x":30,"y":0,"w":4,"h":4}]', 32, 32)).toThrow(/outside/);
  });

  it('rejects duplicate imported names instead of silently overwriting them', () => {
    const duplicateMap = '[{"name":"idle","x":0,"y":0,"w":16,"h":16},{"name":"idle","x":16,"y":0,"w":16,"h":16}]';
    expect(() => parseAtlas(duplicateMap, 32, 16)).toThrow(/“idle” is duplicated.*unique name/i);
  });

  it('refuses to export duplicate names even if callers bypass import validation', () => {
    const duplicates = [{ name: 'idle', x: 0, y: 0, w: 16, h: 16 }, { name: 'idle', x: 16, y: 0, w: 16, h: 16 }];
    expect(() => genericAtlas('sheet.png', 32, 16, duplicates)).toThrow(/duplicated/);
  });

  it('exports a re-importable generic atlas', () => {
    const frames = makeGridFrames(64, 64, 2, 2);
    expect(parseAtlas(genericAtlas('sheet.png', 64, 64, frames), 64, 64)).toHaveLength(4);
  });
});

describe('shader output', () => {
  it('annotates the frame and emits compile-shaped constants', () => {
    const code = shaderSnippet({ name: 'idle', x: 0, y: 0, w: 16, h: 16 }, 32, 32, 'tint', .5, '#55dde0');
    expect(code).toContain('validate syntax');
    expect(code).toContain('FRAME_UV_MAX = vec2(0.50000000, 0.50000000)');
    expect(code).toContain('mix(color.rgb');
  });

  it('implements the outline with frame-clipped neighboring atlas samples', () => {
    const code = shaderSnippet({ name: 'idle', x: 0, y: 0, w: 16, h: 16 }, 32, 32, 'outline', .5, '#55dde0');
    expect(code).toContain('float frame_alpha');
    expect(code.match(/frame_alpha\(atlas, atlas_uv \+/g)).toHaveLength(8);
    expect(code).toContain('(1.0 - color.a) * neighbor_alpha');
    expect(code).not.toContain('Outline needs neighboring atlas texels');
  });
});
