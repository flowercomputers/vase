export type ColorMode = 'mono' | 'ansi16' | 'ansi256' | 'truecolor';
export type Composition = 'btl-dr' | 'dense' | 'poster' | 'quiet';

export type TerminalCell = {
  char: string;
  fg: string;
  bg: string;
  bold: boolean;
  title: string;
};

export type TerminalFrame = {
  cells: TerminalCell[];
  cols: number;
  rows: number;
  seed: string;
  stats: {
    gridPeriodX: number;
    gridPeriodY: number;
    visited: number;
    white: number;
    blue: number;
    red: number;
    green: number;
  };
};

export type TerminalOptions = {
  seed: string;
  rows: number;
  composition: Composition;
  colorMode: ColorMode;
  density: number;
  patternBias: number;
  waveSpeed: number;
  mirror: boolean;
};

type ColorName = 'black' | 'white' | 'blue' | 'red' | 'green';
type PatternName =
  | 'none'
  | 'circle'
  | 'diamond'
  | 'rectangle'
  | 'triangle'
  | 'small-tri'
  | 'diag'
  | 'diag-cross'
  | 'orth'
  | 'orth-cross';

type PatternConfig = {
  pattern: PatternName;
  shapeColor: string;
  useStroke: boolean;
  outline: number;
};

type WorkItem = {
  id: number;
  color: ColorName;
};

const OP = {
  top: 1,
  right: 2,
  bottom: 4,
  left: 8
} as const;

const palettes: Record<ColorMode, Record<ColorName, string>> = {
  mono: {
    black: '#050606',
    white: '#f7f7f2',
    blue: '#aeb7b8',
    red: '#d8dedc',
    green: '#ffffff'
  },
  ansi16: {
    black: '#000000',
    white: '#ffffff',
    blue: '#0000ff',
    red: '#ff0000',
    green: '#00ff00'
  },
  ansi256: {
    black: '#080909',
    white: '#eeeeee',
    blue: '#005fff',
    red: '#ff005f',
    green: '#5fff87'
  },
  truecolor: {
    black: '#090b10',
    white: '#fffaf1',
    blue: '#466cff',
    red: '#ff3f57',
    green: '#42f08d'
  }
};

const patternNames: PatternName[] = [
  'none',
  'circle',
  'diamond',
  'rectangle',
  'triangle',
  'small-tri',
  'diag',
  'diag-cross',
  'orth',
  'orth-cross'
];

export function generateTerminalFrame(options: TerminalOptions): TerminalFrame {
  const rng = seeded(
    `${options.seed}:${options.rows}:${options.composition}:${options.colorMode}:${options.patternBias}`
  );
  const rows = options.rows;
  const cols = rows * 2;
  const total = rows * cols;
  const lineTop = new Array<boolean>(total).fill(false);
  const lineRight = new Array<boolean>(total).fill(false);
  const lineBottom = new Array<boolean>(total).fill(false);
  const lineLeft = new Array<boolean>(total).fill(false);
  const colors = new Array<ColorName>(total).fill('black');
  const visited = new Set<number>();
  const queue: WorkItem[] = [];
  const periodX = Math.floor(16 + rng() * 28);
  const periodY = Math.floor(18 + rng() * 36);
  const rowSignals = Array.from({ length: periodY }, () => Math.floor(rng() * 2));
  const colSignals = Array.from({ length: periodX }, () => Math.floor(rng() * 2));
  const patterns = createPatterns(rng, options);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const id = getId(x, y, cols, rows);
      const rowSignal = rowSignals[y % periodY];
      const colSignal = colSignals[x % periodX];

      const lineChance = 0.35 + options.waveSpeed * 0.6;

      if ((rowSignal === 0 ? x % 2 === 1 : x % 2 === 0) && rng() < lineChance) {
        lineTop[id] = true;
        if (y > 0) lineBottom[id - cols] = true;
      }

      if ((colSignal === 0 ? y % 2 === 1 : y % 2 === 0) && rng() < lineChance) {
        lineLeft[id] = true;
        if (x > 0) lineRight[id - 1] = true;
      }
    }
  }

  const origin = getId(Math.floor(rng() * cols), Math.floor(rng() * rows), cols, rows);
  queue.push({ id: origin, color: 'white' });

  while (queue.length > 0 && visited.size < Math.floor(total * options.density)) {
    const item = queue.shift();
    if (!item || visited.has(item.id)) continue;

    visited.add(item.id);
    colors[item.id] = visited.size > total * 0.5 ? (item.color === 'white' ? 'red' : 'green') : item.color;

    const x = item.id % cols;
    const y = Math.floor(item.id / cols);
    const nextColor: ColorName = item.color === 'white' ? 'blue' : 'white';
    const neighbors = [
      getId(x, y - 1, cols, rows),
      getId(x - 1, y, cols, rows),
      getId(x + 1, y, cols, rows),
      getId(x, y + 1, cols, rows)
    ].filter((id) => id !== -1 && !visited.has(id));

    for (const neighbor of neighbors) {
      const crossesLine = hasLine(item.id, neighbor, cols, lineTop, lineRight, lineBottom, lineLeft);
      const work = { id: neighbor, color: crossesLine ? nextColor : item.color };
      if (crossesLine) queue.splice(Math.floor(rng() * (queue.length + 1)), 0, work);
      else queue.unshift(work);
    }
  }

  const cells = colors.map((color, id) =>
    renderCell({
      color,
      id,
      cols,
      rows,
      colors,
      patterns,
      palette: palettes[options.colorMode],
      mirror: options.mirror
    })
  );

  return { cells, cols, rows, seed: options.seed, stats: countStats(colors, visited.size, periodX, periodY) };
}

export function exportPlainText(frame: TerminalFrame): string {
  const lines: string[] = [];

  for (let y = 0; y < frame.rows; y += 1) {
    let line = '';
    for (let x = 0; x < frame.cols; x += 1) {
      line += frame.cells[y * frame.cols + x].char;
    }
    lines.push(line.trimEnd());
  }

  return lines.join('\n');
}

function createPatterns(rng: () => number, options: TerminalOptions): Record<ColorName, PatternConfig> {
  const result = {} as Record<ColorName, PatternConfig>;

  for (const color of ['white', 'blue', 'red', 'green'] as ColorName[]) {
    const index = Math.floor(Math.pow(rng(), Math.max(0.18, 1.4 - options.patternBias)) * patternNames.length);
    const outline =
      (rng() < 0.5 ? OP.top : 0) |
      (rng() < 0.5 ? OP.right : 0) |
      (rng() < 0.5 ? OP.bottom : 0) |
      (rng() < 0.5 ? OP.left : 0);

    result[color] = {
      pattern: patternNames[Math.min(patternNames.length - 1, index)],
      shapeColor: rng() < 0.35 ? '#ffffff' : rng() < 0.5 ? '#000000' : '',
      useStroke: rng() < 0.3,
      outline
    };
  }

  result.black = {
    pattern: 'none',
    shapeColor: '#000000',
    useStroke: false,
    outline: 0
  };

  if (options.composition === 'poster') {
    result.white.pattern = 'diag-cross';
    result.blue.pattern = 'rectangle';
  }

  if (options.composition === 'quiet') {
    result.red.pattern = 'none';
    result.green.pattern = 'circle';
  }

  return result;
}

function renderCell(input: {
  color: ColorName;
  id: number;
  cols: number;
  rows: number;
  colors: ColorName[];
  patterns: Record<ColorName, PatternConfig>;
  palette: Record<ColorName, string>;
  mirror: boolean;
}): TerminalCell {
  const { color, id, cols, rows, colors, patterns, palette, mirror } = input;
  const x = id % cols;
  const y = Math.floor(id / cols);
  const config = patterns[color];
  const nx = mirror ? Math.min(x, cols - 1 - x) : x;
  const phase = (nx * 13 + y * 17 + id * 3) % 11;
  let char = glyphFor(config.pattern, phase);
  let bold = color === 'white' || config.useStroke;

  const top = outlineVisible(config.outline, OP.top, x, y - 1, color, cols, rows, colors);
  const right = outlineVisible(config.outline, OP.right, x + 1, y, color, cols, rows, colors);
  const bottom = outlineVisible(config.outline, OP.bottom, x, y + 1, color, cols, rows, colors);
  const left = outlineVisible(config.outline, OP.left, x - 1, y, color, cols, rows, colors);

  if (top && bottom && left && right) char = '╬';
  else if (top && bottom) char = '║';
  else if (left && right) char = '═';
  else if (top && right) char = '╚';
  else if (top && left) char = '╝';
  else if (bottom && right) char = '╔';
  else if (bottom && left) char = '╗';
  else if (top || bottom) char = '│';
  else if (left || right) char = '─';

  if (color === 'black') {
    char = phase > 8 ? '.' : ' ';
    bold = false;
  }

  return {
    char,
    fg: color === 'black' ? '#303638' : palette[color],
    bg: color === 'black' ? palette.black : tint(palette.black, palette[color], color === 'white' ? 0.1 : 0.16),
    bold,
    title: `${x},${y} ${color} ${config.pattern}`
  };
}

function glyphFor(pattern: PatternName, phase: number): string {
  if (pattern === 'circle') return phase > 6 ? '●' : phase > 3 ? '○' : '·';
  if (pattern === 'diamond') return phase > 5 ? '◆' : '◇';
  if (pattern === 'rectangle') return phase > 6 ? '█' : phase > 3 ? '▓' : '▒';
  if (pattern === 'triangle') return ['◢', '◣', '◤', '◥'][phase % 4];
  if (pattern === 'small-tri') return ['▴', '▸', '▾', '◂'][phase % 4];
  if (pattern === 'diag') return phase % 2 === 0 ? '╱' : '╲';
  if (pattern === 'diag-cross') return phase % 3 === 0 ? '╳' : phase % 2 === 0 ? '╱' : '╲';
  if (pattern === 'orth') return phase % 2 === 0 ? '│' : '─';
  if (pattern === 'orth-cross') return phase % 3 === 0 ? '┼' : phase % 2 === 0 ? '│' : '─';
  return phase > 7 ? '+' : phase > 4 ? ':' : ' ';
}

function outlineVisible(
  outline: number,
  flag: number,
  x: number,
  y: number,
  color: ColorName,
  cols: number,
  rows: number,
  colors: ColorName[]
): boolean {
  if ((outline & flag) === 0) return false;
  const neighbor = getId(x, y, cols, rows);
  return neighbor === -1 || colors[neighbor] !== color;
}

function hasLine(
  from: number,
  to: number,
  cols: number,
  lineTop: boolean[],
  lineRight: boolean[],
  lineBottom: boolean[],
  lineLeft: boolean[]
): boolean {
  const fx = from % cols;
  const fy = Math.floor(from / cols);
  const tx = to % cols;
  const ty = Math.floor(to / cols);

  if (ty < fy) return lineTop[from];
  if (ty > fy) return lineBottom[from];
  if (tx < fx) return lineLeft[from];
  if (tx > fx) return lineRight[from];
  return false;
}

function getId(x: number, y: number, cols: number, rows: number): number {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return -1;
  return y * cols + x;
}

function countStats(
  colors: ColorName[],
  visited: number,
  gridPeriodX: number,
  gridPeriodY: number
): TerminalFrame['stats'] {
  return {
    gridPeriodX,
    gridPeriodY,
    visited,
    white: colors.filter((color) => color === 'white').length,
    blue: colors.filter((color) => color === 'blue').length,
    red: colors.filter((color) => color === 'red').length,
    green: colors.filter((color) => color === 'green').length
  };
}

function tint(base: string, color: string, amount: number): string {
  const a = hex(base);
  const b = hex(color);
  const r = Math.round(a[0] * (1 - amount) + b[0] * amount);
  const g = Math.round(a[1] * (1 - amount) + b[1] * amount);
  const bl = Math.round(a[2] * (1 - amount) + b[2] * amount);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hex(value: string): [number, number, number] {
  const normalized = value.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

function seeded(seed: string): () => number {
  return mulberry32(fnv1a(seed.trim().toLowerCase() || 'terminal'));
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
