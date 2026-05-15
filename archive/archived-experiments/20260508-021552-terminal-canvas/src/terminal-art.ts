export type ColorMode = 'ansi16' | 'ansi256' | 'truecolor';
export type Composition = 'ditherfield' | 'sigil' | 'circuit' | 'weave' | 'poster';

export type TerminalCell = {
  char: string;
  fg: string;
  bg: string;
  bold: boolean;
  dim: boolean;
};

export type TerminalFrame = {
  cols: number;
  rows: number;
  cells: TerminalCell[];
};

export type TerminalOptions = {
  seed: string;
  cols: number;
  rows: number;
  composition: Composition;
  colorMode: ColorMode;
  density: number;
  contrast: number;
  noise: number;
};

const glyphSets = {
  shade: [' ', '░', '▒', '▓', '█'],
  block: [' ', '▄', '▀', '▌', '▐', '█'],
  line: ['─', '│', '┌', '┐', '└', '┘', '┼', '╱', '╲'],
  ascii: ['.', ':', ';', '+', '*', '#', '@']
};

const ansi16 = ['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0', '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'];

const ansi256 = [
  '#1c1c1c',
  '#262626',
  '#303030',
  '#5f5f5f',
  '#eeeeee',
  '#ffffff',
  '#00d7ff',
  '#00afd7',
  '#ffaf00',
  '#ffd75f',
  '#ff5fd7',
  '#d75fff',
  '#5fff87',
  '#87ffaf',
  '#ff5f5f',
  '#5f87ff'
];

const truecolor = ['#090b0d', '#11161a', '#23313a', '#ecf4ef', '#ffffff', '#78f3ff', '#17c9e8', '#ffbf3f', '#ffef9a', '#ff6bd6', '#a982ff', '#78ff9d', '#2ad36f', '#ff7066', '#8aa4ff', '#33424a'];

export function generateTerminalFrame(options: TerminalOptions): TerminalFrame {
  const rng = mulberry32(fnv1a(JSON.stringify(options)));
  const palette = paletteFor(options.colorMode);
  const cells: TerminalCell[] = [];

  for (let y = 0; y < options.rows; y += 1) {
    for (let x = 0; x < options.cols; x += 1) {
      const signal = compositionSignal(options.composition, x, y, options.cols, options.rows, rng);
      const texture = signal + (rng() - 0.5) * options.noise;
      const active = texture > 1 - options.density;
      const fg = pickColor(palette, texture, options.contrast, rng, false);
      const bg = pickColor(palette, 1 - texture, options.contrast, rng, true);

      cells.push({
        char: active ? glyphFor(options.composition, texture, rng) : ' ',
        fg,
        bg,
        bold: active && texture > 0.78,
        dim: !active || texture < 0.3
      });
    }
  }

  return { cols: options.cols, rows: options.rows, cells };
}

export function exportAnsi(frame: TerminalFrame): string {
  const lines: string[] = [];

  for (let y = 0; y < frame.rows; y += 1) {
    const parts: string[] = [];
    for (let x = 0; x < frame.cols; x += 1) {
      const cell = frame.cells[y * frame.cols + x];
      parts.push(`\\x1b[38;2;${hexToRgb(cell.fg).join(';')}m\\x1b[48;2;${hexToRgb(cell.bg).join(';')}m${cell.char}`);
    }
    lines.push(`${parts.join('')}\\x1b[0m`);
  }

  return lines.join('\n');
}

function compositionSignal(composition: Composition, x: number, y: number, cols: number, rows: number, rng: () => number): number {
  const cx = (x - cols / 2) / (cols / 2);
  const cy = (y - rows / 2) / (rows / 2);
  const radial = 1 - Math.sqrt(cx * cx + cy * cy);
  const mirrorX = 1 - Math.abs(cx);
  const wave = (Math.sin(x * 0.47) + Math.cos(y * 0.62) + 2) / 4;

  if (composition === 'sigil') return radial * 0.72 + mirrorX * 0.24 + (((x + y) % 7 === 0) ? 0.24 : 0);
  if (composition === 'circuit') return ((x % 6 === 0 || y % 4 === 0) ? 0.72 : 0.18) + (((x * y) % 17 === 0) ? 0.24 : 0);
  if (composition === 'weave') return (((x + y) % 2 === 0) ? 0.64 : 0.28) + (((x - y) % 9 === 0) ? 0.2 : 0);
  if (composition === 'poster') return radial * 0.44 + wave * 0.36 + (Math.abs(cx) < 0.14 ? 0.34 : 0);

  return wave * 0.45 + radial * 0.32 + rng() * 0.2;
}

function glyphFor(composition: Composition, signal: number, rng: () => number): string {
  if (composition === 'circuit' && rng() > 0.42) return pick(glyphSets.line, rng);
  if (composition === 'poster' && rng() > 0.62) return pick(glyphSets.ascii, rng);
  if (composition === 'weave' && rng() > 0.5) return pick(glyphSets.block, rng);
  const index = Math.max(1, Math.min(4, Math.floor(signal * 5)));
  return glyphSets.shade[index];
}

function pickColor(palette: string[], signal: number, contrast: number, rng: () => number, background: boolean): string {
  if (background) {
    const darkBand = signal > 0.72 && contrast < 0.55 ? [0, 1, 2, 3, 15] : [0, 1, 2];
    return palette[pick(darkBand, rng) % palette.length];
  }

  const brightBand = [4, 5, 6, 8, 9, 10, 12, 14];
  const accentBand = [6, 8, 10, 12, 14, 15];
  const band = contrast > 0.62 || signal > 0.55 ? accentBand : brightBand;
  return palette[pick(band, rng) % palette.length];
}

function paletteFor(mode: ColorMode): string[] {
  if (mode === 'ansi16') return ansi16;
  if (mode === 'ansi256') return ansi256;
  return truecolor;
}

function pick<T>(values: T[], rng: () => number): T {
  return values[Math.floor(rng() * values.length)];
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.slice(1);
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16)) as [number, number, number];
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
