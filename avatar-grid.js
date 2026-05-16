#!/usr/bin/env node

const WIDTH = 17;
const HEIGHT = 9;
const RULER = '0123456789abcdefg';
const ANSI = {
  reset: '\x1b[0m',
};
const MUTED_BACKGROUND_COLOR = { code: 8 };
const MIN_CONTRAST = 4.5;
const MAX_PATTERN_CONTRAST = 2.2;
const PAINT_PATTERNS = new Set([
  'solid',
  'gradient',
  'row-gradient',
  'column-gradient',
  'radial',
  'speckle',
  'sparkle',
  'ripple',
  'bands',
  'checker',
  'mixed',
]);
const ANALOGOUS_FAMILIES = {
  green: new Set(['green', 'yellow']),
  yellow: new Set(['yellow', 'green']),
  red: new Set(['red', 'pink']),
  pink: new Set(['pink', 'red', 'purple']),
  purple: new Set(['purple', 'pink', 'indigo']),
  indigo: new Set(['indigo', 'purple', 'blue']),
  blue: new Set(['blue', 'indigo']),
};
const BACKGROUND_GUTTER_FIXES = new Set([1, 2, 3, 4, 6, 7, 8, 9, 10]);
const FOREGROUND_GUTTER_FIXES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const colors = [
  { name: 'deep moss', code: 22, rgb: [0, 95, 0], tone: 'dark', family: 'green', weight: 0.35 },
  { name: 'ivy green', code: 28, rgb: [0, 135, 0], tone: 'dark', family: 'green', weight: 0.3 },
  { name: 'mulch olive', code: 58, rgb: [95, 95, 0], tone: 'dark', family: 'green', weight: 0.45 },
  { name: 'leaf shadow', code: 64, rgb: [95, 135, 0], tone: 'dark', family: 'green', weight: 0.35 },
  { name: 'black violet', code: 53, rgb: [95, 0, 95], tone: 'dark', family: 'purple', weight: 1.25 },
  { name: 'wild plum', code: 54, rgb: [95, 0, 135], tone: 'dark', family: 'purple', weight: 1.2 },
  { name: 'iris purple', code: 90, rgb: [135, 0, 135], tone: 'dark', family: 'purple', weight: 1.15 },
  { name: 'crocus', code: 91, rgb: [135, 0, 175], tone: 'dark', family: 'purple', weight: 1.05 },
  { name: 'nightshade', code: 17, rgb: [0, 0, 95], tone: 'dark', family: 'blue', weight: 0.75 },
  { name: 'gentian', code: 18, rgb: [0, 0, 135], tone: 'dark', family: 'blue', weight: 0.7 },
  { name: 'delphinium', code: 19, rgb: [0, 0, 175], tone: 'dark', family: 'blue', weight: 0.65 },
  { name: 'ink iris', code: 55, rgb: [95, 0, 175], tone: 'dark', family: 'indigo', weight: 0.9 },
  { name: 'violet night', code: 57, rgb: [95, 0, 255], tone: 'dark', family: 'indigo', weight: 0.72 },
  { name: 'bluebell shadow', code: 60, rgb: [95, 95, 135], tone: 'dark', family: 'indigo', weight: 0.62 },
  { name: 'black cherry', code: 52, rgb: [95, 0, 0], tone: 'dark', family: 'red', weight: 1.45 },
  { name: 'burgundy', code: 88, rgb: [135, 0, 0], tone: 'dark', family: 'red', weight: 1.35 },
  { name: 'rosewood', code: 89, rgb: [135, 0, 95], tone: 'dark', family: 'pink', weight: 1.35 },
  { name: 'wineberry', code: 125, rgb: [175, 0, 95], tone: 'dark', family: 'pink', weight: 1.15 },
  { name: 'new leaf', code: 118, rgb: [135, 255, 0], tone: 'light', family: 'green', weight: 0.28 },
  { name: 'chartreuse', code: 154, rgb: [175, 255, 0], tone: 'light', family: 'green', weight: 0.35 },
  { name: 'pollen', code: 190, rgb: [215, 255, 0], tone: 'light', family: 'yellow', weight: 0.75 },
  { name: 'marigold', code: 220, rgb: [255, 215, 0], tone: 'light', family: 'yellow', weight: 0.85 },
  { name: 'sunflower', code: 226, rgb: [255, 255, 0], tone: 'light', family: 'yellow', weight: 0.75 },
  { name: 'lilac', code: 183, rgb: [215, 175, 255], tone: 'light', family: 'purple', weight: 1.1 },
  { name: 'periwinkle', code: 147, rgb: [175, 175, 255], tone: 'light', family: 'indigo', weight: 0.9 },
  { name: 'hydrangea', code: 153, rgb: [175, 215, 255], tone: 'light', family: 'blue', weight: 0.82 },
  { name: 'blue flax', code: 159, rgb: [215, 255, 255], tone: 'light', family: 'blue', weight: 0.65 },
  { name: 'pale iris', code: 189, rgb: [215, 215, 255], tone: 'light', family: 'indigo', weight: 0.82 },
  { name: 'forget me not', code: 111, rgb: [135, 175, 255], tone: 'light', family: 'blue', weight: 0.72 },
  { name: 'phlox', code: 219, rgb: [255, 175, 255], tone: 'light', family: 'pink', weight: 1.3 },
  { name: 'pink alyssum', code: 224, rgb: [255, 215, 215], tone: 'light', family: 'pink', weight: 1.35 },
  { name: 'peony', code: 217, rgb: [255, 175, 215], tone: 'light', family: 'pink', weight: 1.45 },
  { name: 'rose', code: 211, rgb: [255, 135, 175], tone: 'light', family: 'pink', weight: 1.25 },
  { name: 'salmon', code: 210, rgb: [255, 135, 135], tone: 'light', family: 'red', weight: 1.05 },
  { name: 'fuchsia', code: 201, rgb: [255, 0, 255], tone: 'light', family: 'pink', weight: 0.9 },
];

const backgrounds = [
  [
    '█░█░█░█░█░█░█░█░█',
    '░█░█░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
    '░█░█░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
    '░█░█░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
    '░█░█░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
  ],
  [
    '      ░█░█░█░',
    '   ░█░█░█░█░█░█░',
    ' █░█░█░█░█░█░█░█░█',
    ' ░█░█░█░█░█░█░█░█░',
    ' █░█░█░█░█░█░█░█░█',
    ' ░█░█░█░█░█░█░█░█░',
    ' █░█░█░█░█░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '      ░█░█░█░',
  ],
  [
    '█░█░█░█░█░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '     █░█░█░█░█',
    '        █░█',
    '         █',
    '        █░█',
    '     █░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
  ],
  [
    '     █░█░█░█░█',
    '     ░█░█░█░█░',
    '    ░█░█░█░█░█░',
    '    █░█░█░█░█░█',
    '   █░█░█░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '  ░█░█░█░█░█░█░█░',
    '  █░█░█░█░█░█░█░█',
    '█░█░█░█░█░█░█░█░█',
  ],
  [
    '█░█░█░█░█░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '     █░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '     █░█░█░█░█',
    '   ░█░█░█░█░█░█░',
    '█░█░█░█░█░█░█░█░█',
  ],
  [
    '█░█           █░█',
    '░█             █░',
    '█               █',
    '',
    '',
    '',
    '█               █',
    '░█             █░',
    '█░█           █░█',
  ],
  [
    '   █     █     █',
    '  █░█   █░█   █░█',
    '█░█░█░█░█░█░█░█░█',
    '   █     █     █',
    '  █░█   █░█   █░█',
    '█░█░█░█░█░█░█░█░█',
    '   █     █     █',
    '  █░█   █░█   █░█',
    '█░█░█░█░█░█░█░█░█',
  ],
  [
    '   █   █   █   █',
    '  █░█   █░█   █░█',
    '█░ ░█  ░█░  █░ ░█',
    '   █   █   █   █',
    '  █░█   █░█   █░█',
    '█░ ░█  ░█░  █░ ░█',
    '   █   █   █   █',
    '  █░█   █░█   █░█',
    '█░ ░█  ░█░  █░ ░█',
  ],
  [
    '      ░█░█░█░',
    '   ░█░█░█░█░█░█░',
    '  ░█░█░█░█░█░█░█░',
    '░█░█░█░█░█░█░█░█░',
    '',
    '',
    '',
    '   ░█░█░█░█░█░█░',
    '      ░█░█░█░',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '░█░█░█░█░█░█░█░█░',
    '  ░█░█░█░█░█░█░█░',
    '   ░█░█░█░█░█░█░',
    '      ░█░█░█░',
  ],
  [
    '   ╭─╭─╭───╮─╮─╮',
    '  ╭╯╭╯╭╯╭─╮╰╮╰╮╰╮',
    ' ╭╯╭╯╭╯╭╯ ╰╮╰╮╰╮╰╮',
    ' │ │ │ │╭─╮│ │ │ │',
    ' │ │ │ ││ ││ │ │ │',
    ' │ │ │ │╰─╯│ │ │ │',
    ' ╰╮╰╮╰╮╰╮ ╭╯╭╯╭╯╭╯',
    '  ╰╮╰╮╰╮╰─╯╭╯╭╯╭╯',
    '   ╰─╰─╰───╯─╯─╯',
  ],
  [
    '╭╮╭╮╭╮╭╭─╮╮╭╮╭╮╭╮',
    '│╭╯╭╯╭╯╭─╮╰╮╰╮╰╮│',
    '╭╯╭╯╭╯╭╯┬╰╮╰╮╰╮╰╮',
    '│││││││╭┴╮│││││││',
    '││││││││ ││││││││',
    '│││││││╰┬╯│││││││',
    '╰╮╰╮╰╮╰╮┴╭╯╭╯╭╯╭╯',
    '│╰╮╰╮╰╮╰─╯╭╯╭╯╭╯│',
    '╰╯╰╯╰╯╰╰─╯╯╰╯╰╯╰╯',
  ],
  [
    '╭╭╭╭╭╭╭╭─╮╮╮╮╮╮╮╮',
    '╭╭╭╭╭╭╭╭─╮╮╮╮╮╮╮╮',
    '╭╭╭╭╭╭╭╭─╮╮╮╮╮╮╮╮',
    '╭╭╭╭╭╭╭╭─╮╮╮╮╮╮╮╮',
    '││││││││ ││││││││',
    '╰╰╰╰╰╰╰╰─╯╯╯╯╯╯╯╯',
    '╰╰╰╰╰╰╰╰─╯╯╯╯╯╯╯╯',
    '╰╰╰╰╰╰╰╰─╯╯╯╯╯╯╯╯',
    '╰╰╰╰╰╰╰╰─╯╯╯╯╯╯╯╯',
  ],
  [
    '────────────────╮',
    '╭──────────────╮│',
    '│╭────────────╮││',
    '││╭──────────╮│││',
    '│││╭──────── ││││',
    '│││╰─────────╯│││',
    '││╰───────────╯││',
    '│╰─────────────╯│',
    '╰───────────────╯',
  ],
  [
    '╭╮             ╭╮',
    '╰┼─────────────┼╯',
    ' │             │',
    ' │             │',
    ' │             │',
    ' │             │',
    ' │             │',
    '╭┼─────────────┼╮',
    '╰╯             ╰╯',
  ],
];

const foregrounds = [
  [
    '█   █   █   █   █',
    ' ░       ░       ',
    '█   █   █   █   █',
    '     ░       ░   ',
    '█   █   █   █   █',
    ' ░       ░       ',
    '█   █   █   █   █',
    '     ░       ░   ',
    '█   █   █   █   █',
  ],
  [
    '',
    '  █   █   █   █',
    '   █   █   █   █',
    '    █   █   █   █',
    '',
    '  █   █   █   █',
    '   █   █   █   █',
    '    █   █   █   █',
    '',
  ],
  [
    '',
    '',
    '',
    '    █    █    █',
    '   █ █  █ █  █ █',
    '    █    █    █',
    '',
    '',
    '',
  ],
  [
    '      █     █',
    '     █ █   █ █',
    '      █     █',
    '   █     █     █',
    '  █ █   █ █   █ █',
    '   █     █     █',
    '      █     █',
    '     █ █   █ █',
    '      █     █',
  ],
  [
    '',
    '        ░▒░',
    '       ░▒░▒░',
    '      ░▒░▒░▒░',
    '     ░▒░▒░▒░▒░',
    '      ░▒░▒░▒░',
    '       ░▒░▒░',
    '        ░▒░',
    '',
  ],
  [
    '      █     █',
    '     █┼█   █┼█',
    '      █     █',
    '   █     █     █',
    '  █┼█   █┼█   █┼█',
    '   █     █     █',
    '      █     █',
    '     █┼█   █┼█',
    '      █     █',
  ],
  [
    '',
    '  ╳   ╳   ╳   ╳',
    '   ╳   ╳   ╳   ╳',
    '    ╳   ╳   ╳   ╳',
    '',
    '  ╳   ╳   ╳   ╳',
    '   ╳   ╳   ╳   ╳',
    '    ╳   ╳   ╳   ╳',
    '',
  ],
  [
    '',
    '         ◓',
    '        ◐╬◑',
    '         ◒',
    '',
    '    ◓         ◓',
    '   ◐╬◑       ◐╬◑',
    '    ◒         ◒',
    '',
  ],
  [
    '      ░█░█░█░',
    '     ░█░█░█░█░',
    '    ░█░█░█░█░█░',
    '   ░█░█░█░█░█░█░',
    '  ░█░█░█░█░█░█░█░',
    '   ░█░█░█░█░█░█░',
    '    ░█░█░█░█░█░',
    '     ░█░█░█░█░',
    '       █░█░█░',
  ],
  [
    '       █░█░█',
    '      █░█░█░█',
    '     █░█░█░█░█',
    '    █░█░█░█░█░█',
    '   █░█░█░█░█░█░█',
    '    █░█░█░█░█░█',
    '     █░█░█░█░█',
    '      █░█░█░█',
    '       █░█░█',
  ],
  [
    '         █',
    '       ░█░█░',
    '      ░█░█░█░',
    '     ░█░█░█░█░',
    '   █░█░█░█░█░█░█',
    '     ░█░█░█░█░',
    '      ░█░█░█░',
    '       ░█░█░',
    '         █',
  ],
  [
    '    █ █     █ █',
    '     █       █',
    '    █ █     █ █',
    '        █ █',
    '         █',
    '        █ █',
    '    █ █     █ █',
    '     █       █',
    '    █ █     █ █',
  ],
];
const emptyForeground = Array.from({ length: HEIGHT }, () => '');
const emptyBackground = Array.from({ length: HEIGHT }, () => '');

function row(line) {
  return Array.from(line.padEnd(WIDTH, ' ')).slice(0, WIDTH);
}

function normalize(template, { trimLeadingGutter = false } = {}) {
  return Array.from({ length: HEIGHT }, (_, y) => {
    const line = template[y] ?? '';

    // Some rows inherited a one-cell separator gutter from the source table.
    // Apply that correction only to template groups known to have picked it up.
    return row(trimLeadingGutter && line.startsWith(' ') ? line.slice(1) : line);
  });
}

function composite(
  background,
  foreground,
  { trimBackgroundGutter = false, trimForegroundGutter = false } = {},
) {
  const bg = normalize(background, { trimLeadingGutter: trimBackgroundGutter });
  const fg = normalize(foreground, { trimLeadingGutter: trimForegroundGutter });

  // The templates are already authored on the same 9x17 canvas. Keeping x/y
  // coordinates fixed is more important than trying to infer a center from
  // each motif's visible bounds.
  return Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => ({
      background: bg[y][x],
      foreground: fg[y][x],
    })),
  );
}

function paint(char, color, useColor) {
  if (!useColor || char === ' ') return char;
  return `\x1b[38;5;${color.code}m${char}${ANSI.reset}`;
}

function baseShadeIndex(char) {
  return char === '░' || char === '▒' ? 1 : 0;
}

function shadeFor({ char, layerColors, x, y, layer, patternOptions }) {
  const baseIndex = baseShadeIndex(char);
  const patternIndex = patternShadeIndex({ x, y, layer, baseIndex, patternOptions });
  return layerColors[patternIndex];
}

function renderCell(cell, useColor, colorway, context) {
  if (cell.foreground !== ' ') {
    return paint(
      cell.foreground,
      shadeFor({ char: cell.foreground, layerColors: colorway.foreground, layer: 'foreground', ...context }),
      useColor,
    );
  }
  if (cell.background !== ' ') {
    return paint(
      cell.background,
      context.mutedBackground
        ? MUTED_BACKGROUND_COLOR
        : shadeFor({ char: cell.background, layerColors: colorway.background, layer: 'background', ...context }),
      useColor,
    );
  }
  return ' ';
}

function renderAvatar(
  avatar,
  {
    color = true,
    ruler = false,
    mutedBackground = false,
    colorway = defaultColorway(MIN_CONTRAST),
    patternOptions = defaultPatternOptions(),
  } = {},
) {
  const lines = avatar.map((line, y) => {
    const body = line
      .map((cell, x) => renderCell(cell, color, colorway, { x, y, mutedBackground, patternOptions }))
      .join('');
    return ruler ? `${y + 1}  ${body}` : body;
  });

  if (ruler) lines.push(`   ${RULER}`);
  return lines.join('\n');
}

function defaultPatternOptions() {
  return {
    background: 'solid',
    foreground: 'solid',
    strength: 0.35,
    scale: 1,
    seed: Math.floor(Math.random() * 1_000_000),
  };
}

function patternShadeIndex({ x, y, layer, baseIndex, patternOptions }) {
  const pattern = resolvedPattern(patternOptions[layer], layer, patternOptions.seed);
  if (pattern === 'solid') return baseIndex;

  const strength = clamp(patternOptions.strength, 0, 1);
  const scale = Math.max(0.25, patternOptions.scale);
  const signal = patternSignal({ pattern, x, y, layer, scale, seed: patternOptions.seed });
  const threshold = pattern === 'sparkle' ? 1 - strength * 0.35 : 1 - strength;
  return signal > threshold ? 1 - baseIndex : baseIndex;
}

function resolvedPattern(pattern, layer, seed) {
  if (pattern !== 'mixed') return pattern;
  const choices = [
    'gradient',
    'row-gradient',
    'column-gradient',
    'radial',
    'speckle',
    'sparkle',
    'ripple',
    'bands',
    'checker',
  ];
  return choices[Math.floor(hash01(0, 0, layer, seed) * choices.length)];
}

function patternSignal({ pattern, x, y, layer, scale, seed }) {
  if (pattern === 'gradient') return gradientSignal(x, y, scale);
  if (pattern === 'row-gradient') return rowGradientSignal(y, scale);
  if (pattern === 'column-gradient') return columnGradientSignal(x, scale);
  if (pattern === 'radial') return radialSignal(x, y, scale);
  if (pattern === 'speckle') return hash01(x, y, layer, seed);
  if (pattern === 'sparkle') return sparkleSignal(x, y, layer, seed);
  if (pattern === 'ripple') return rippleSignal(x, y, layer, scale, seed);
  if (pattern === 'bands') return bandSignal(x, y, layer, scale, seed);
  if (pattern === 'checker') return checkerSignal(x, y, scale);
  return 0;
}

function gradientSignal(x, y, scale) {
  const nx = x / (WIDTH - 1);
  const ny = y / (HEIGHT - 1);
  return clamp((nx * 0.68 + ny * 0.32) * scale, 0, 1);
}

function rowGradientSignal(y, scale) {
  return clamp((y / (HEIGHT - 1)) * scale, 0, 1);
}

function columnGradientSignal(x, scale) {
  return clamp((x / (WIDTH - 1)) * scale, 0, 1);
}

function radialSignal(x, y, scale) {
  const cx = (WIDTH - 1) / 2;
  const cy = (HEIGHT - 1) / 2;
  const maxDistance = Math.hypot(cx, cy * 1.8);
  const distance = Math.hypot(x - cx, (y - cy) * 1.8);
  return clamp((distance / maxDistance) * scale, 0, 1);
}

function sparkleSignal(x, y, layer, seed) {
  const localNoise = hash01(x, y, layer, seed);
  if (localNoise < 0.82) return 0;

  // A tiny coordinate shimmer keeps sparkle sparse and point-like instead of
  // becoming ordinary speckle at the default pattern strength.
  return 0.9 + hash01(x + 17, y + 9, layer, seed) * 0.1;
}

function rippleSignal(x, y, layer, scale, seed) {
  const cx = (WIDTH - 1) / 2;
  const cy = (HEIGHT - 1) / 2;
  const distance = Math.hypot(x - cx, (y - cy) * 1.8);
  const phase = hash01(3, 7, layer, seed) * Math.PI * 2;
  return (Math.sin(distance * scale * 1.45 + phase) + 1) / 2;
}

function bandSignal(x, y, layer, scale, seed) {
  const phase = hash01(11, 5, layer, seed) * Math.PI * 2;
  return (Math.sin((x * 0.75 + y * 0.35) * scale + phase) + 1) / 2;
}

function checkerSignal(x, y, scale) {
  const size = Math.max(1, Math.round(2 / scale));
  return (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? 0.25 : 0.85;
}

function hash01(x, y, layer, seed) {
  let value = (x + 1) * 374761393 + (y + 1) * 668265263 + seed * 1442695041;
  value += layer === 'foreground' ? 2246822519 : 3266489917;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pick(list) {
  return Math.floor(Math.random() * list.length);
}

function chooseWeighted(list) {
  const total = list.reduce((sum, color) => sum + color.weight, 0);
  let cursor = Math.random() * total;

  for (const color of list) {
    cursor -= color.weight;
    if (cursor <= 0) return color;
  }

  return list[list.length - 1];
}

function linearChannel(value) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  const [red, green, blue] = color.rgb.map(linearChannel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(a, b) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

function minLayerContrast(background, foreground) {
  return Math.min(...background.flatMap((bg) => foreground.map((fg) => contrastRatio(bg, fg))));
}

function colorwayIsLegible(colorway, minContrast) {
  return minLayerContrast(colorway.background, colorway.foreground) >= minContrast;
}

function layerInternalContrast(layerColors) {
  return contrastRatio(layerColors[0], layerColors[1]);
}

function colorwayIsSubtle(colorway, maxPatternContrast) {
  if (maxPatternContrast == null) return true;
  return Math.max(
    layerInternalContrast(colorway.background),
    layerInternalContrast(colorway.foreground),
  ) <= maxPatternContrast;
}

function layerHasVariation(layerColors) {
  return layerColors[0].code !== layerColors[1].code;
}

function colorwayHasRequiredVariation(colorway, { background = false, foreground = false } = {}) {
  return (!background || layerHasVariation(colorway.background))
    && (!foreground || layerHasVariation(colorway.foreground));
}

function familiesAreAnalogous(layerColors) {
  const [primary, alternate] = layerColors;
  return primary.family === alternate.family || ANALOGOUS_FAMILIES[primary.family]?.has(alternate.family);
}

function colorwayHasLayerCoherence(colorway, { background = false, foreground = false } = {}) {
  return (!background || familiesAreAnalogous(colorway.background))
    && (!foreground || familiesAreAnalogous(colorway.foreground));
}

function defaultColorway() {
  const background = [colors[19], colors[20]];
  const foreground = [colors[8], colors[9]];
  return { background, foreground, contrast: minLayerContrast(background, foreground) };
}

function withFamilyWeights(color, familyWeights) {
  return { ...color, weight: color.weight * (familyWeights[color.family] ?? 1) };
}

function filteredColors({ families, familyWeights }) {
  const pool = colors
    .filter((color) => !families || families.has(color.family))
    .map((color) => withFamilyWeights(color, familyWeights))
    .filter((color) => color.weight > 0);

  if (pool.length === 0) throw new Error('No colors remain after applying family filters/weights');
  return pool;
}

function colorPool({ tone, families, familyWeights }) {
  const pool = filteredColors({ families, familyWeights }).filter((color) => color.tone === tone);
  if (pool.length === 0) throw new Error(`No ${tone} colors remain after applying family filters/weights`);
  return pool;
}

function randomColorway({
  minContrast = MIN_CONTRAST,
  families = null,
  backgroundFamilies = null,
  foregroundFamilies = null,
  familyWeights = {},
  darkBackgroundRate = 0,
  backgroundColors = null,
  foregroundColors = null,
  maxPatternContrast = null,
  requireBackgroundVariation = false,
  requireForegroundVariation = false,
  requireLayerCoherence = false,
} = {}) {
  if (backgroundColors && foregroundColors) {
    const colorway = {
      background: backgroundColors,
      foreground: foregroundColors,
      contrast: minLayerContrast(backgroundColors, foregroundColors),
    };
    if (!colorwayIsLegible(colorway, minContrast)) {
      throw new Error(`Explicit colors only reach ${colorway.contrast.toFixed(2)}:1 contrast; minimum is ${minContrast}:1`);
    }
    if (!colorwayIsSubtle(colorway, maxPatternContrast)) {
      throw new Error(`Explicit colors exceed ${maxPatternContrast}:1 intra-layer pattern contrast`);
    }
    if (!colorwayHasRequiredVariation(colorway, { background: requireBackgroundVariation, foreground: requireForegroundVariation })) {
      throw new Error('Explicit patterned layers need two distinct colors');
    }
    if (requireLayerCoherence && !colorwayHasLayerCoherence(colorway, { background: requireBackgroundVariation, foreground: requireForegroundVariation })) {
      throw new Error('Explicit patterned layer colors must stay in the same or adjacent color family');
    }
    return colorway;
  }

  const darkBackground = Math.random() < darkBackgroundRate;
  const explicitBackgroundTone = backgroundColors ? dominantTone(backgroundColors) : null;
  const explicitForegroundTone = foregroundColors ? dominantTone(foregroundColors) : null;
  const backgroundTone = explicitBackgroundTone
    ?? (explicitForegroundTone ? oppositeTone(explicitForegroundTone) : (darkBackground ? 'dark' : 'light'));
  const foregroundTone = explicitForegroundTone ?? oppositeTone(backgroundTone);
  const backgroundPool = backgroundColors
    ? null
    : colorPool({ tone: backgroundTone, families: backgroundFamilies ?? families, familyWeights });
  const foregroundPool = foregroundColors
    ? null
    : colorPool({ tone: foregroundTone, families: foregroundFamilies ?? families, familyWeights });

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const generatedBackground = backgroundColors
      ?? [chooseWeighted(backgroundPool), chooseWeighted(backgroundPool)];
    const generatedForeground = foregroundColors
      ?? [chooseWeighted(foregroundPool), chooseWeighted(foregroundPool)];
    const background = generatedBackground;
    const foreground = generatedForeground;
    const colorway = { background, foreground, contrast: minLayerContrast(background, foreground) };
    if (
      colorwayIsLegible(colorway, minContrast)
      && colorwayIsSubtle(colorway, maxPatternContrast)
      && colorwayHasRequiredVariation(colorway, {
        background: requireBackgroundVariation,
        foreground: requireForegroundVariation,
      })
      && (!requireLayerCoherence || colorwayHasLayerCoherence(colorway, {
        background: requireBackgroundVariation,
        foreground: requireForegroundVariation,
      }))
    ) {
      return colorway;
    }
  }

  const fallback = defaultColorway();
  if (colorwayIsLegible(fallback, minContrast) && colorwayIsSubtle(fallback, maxPatternContrast)) return fallback;
  throw new Error(`Could not find a colorway meeting ${minContrast}:1 contrast with the requested color constraints`);
}

function dominantTone(layerColors) {
  const average = layerColors.reduce((sum, color) => sum + luminance(color), 0) / layerColors.length;
  return average < 0.32 ? 'dark' : 'light';
}

function oppositeTone(tone) {
  return tone === 'dark' ? 'light' : 'dark';
}

function colorwayLabel(colorway) {
  const background = colorway.background.map((color) => color.name).join('/');
  const foreground = colorway.foreground.map((color) => color.name).join('/');
  const backgroundFamilies = colorway.background.map((color) => color.family).join('/');
  const foregroundFamilies = colorway.foreground.map((color) => color.family).join('/');
  return `colors background=${background}(${backgroundFamilies}) foreground=${foreground}(${foregroundFamilies}) min-contrast=${colorway.contrast.toFixed(2)}:1`;
}

function patternLabel(patternOptions) {
  if (patternOptions.background === 'solid' && patternOptions.foreground === 'solid') return null;
  return `paint background=${patternOptions.background} foreground=${patternOptions.foreground} strength=${patternOptions.strength.toFixed(2)} scale=${patternOptions.scale.toFixed(2)} seed=${patternOptions.seed}`;
}

function optionNumber(name) {
  const raw = optionValue(name);
  if (!raw) return null;

  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) ? value : null;
}

function optionFloat(name) {
  const raw = optionValue(name);
  if (!raw) return null;

  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function optionValue(name) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function selectedIndex(name, list) {
  const value = optionNumber(name);
  if (value == null) return null;
  if (value < 1 || value > list.length) {
    throw new Error(`${name} must be between 1 and ${list.length}`);
  }
  return value - 1;
}

function slug(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function parseFamilies(raw) {
  if (!raw) return null;
  const families = new Set(raw.split(',').map((family) => family.trim()).filter(Boolean));
  const known = new Set(colors.map((color) => color.family));
  for (const family of families) {
    if (!known.has(family)) throw new Error(`Unknown color family "${family}". Use one of: ${[...known].join(', ')}`);
  }
  return families;
}

function parseFamilyWeights(raw) {
  if (!raw) return {};

  return Object.fromEntries(
    raw.split(',').filter(Boolean).map((entry) => {
      const [family, value] = entry.split(':');
      const weight = Number.parseFloat(value);
      if (!family || !Number.isFinite(weight)) throw new Error(`Bad family weight "${entry}". Use family:number`);
      return [family.trim(), weight];
    }),
  );
}

function findColor(token) {
  const normalized = slug(token.trim());
  const numericCode = Number.parseInt(normalized, 10);
  const color = colors.find((candidate) =>
    candidate.code === numericCode
    || slug(candidate.name) === normalized
    || candidate.name.toLowerCase() === token.trim().toLowerCase(),
  );

  if (!color) throw new Error(`Unknown color "${token}". Run with --list-colors to inspect options`);
  return color;
}

function parseColorLayer(raw) {
  if (!raw) return null;
  const layer = raw.split(/[\/,]/).map((token) => token.trim()).filter(Boolean).map(findColor);
  if (layer.length === 0 || layer.length > 2) throw new Error(`Color layer "${raw}" must contain one or two colors`);
  return layer.length === 1 ? [layer[0], layer[0]] : layer;
}

function parsePattern(raw, fallback = 'solid') {
  const pattern = raw ?? fallback;
  if (!PAINT_PATTERNS.has(pattern)) {
    throw new Error(`Unknown paint pattern "${pattern}". Use one of: ${[...PAINT_PATTERNS].join(', ')}`);
  }
  return pattern;
}

function parsePatternOptions() {
  const sharedPattern = parsePattern(optionValue('--paint-pattern'), 'solid');
  const background = parsePattern(optionValue('--background-pattern') ?? optionValue('--bg-pattern'), sharedPattern);
  const foreground = parsePattern(optionValue('--foreground-pattern') ?? optionValue('--fg-pattern'), sharedPattern);
  const strength = optionFloat('--pattern-strength') ?? 0.35;
  const scale = optionFloat('--pattern-scale') ?? 1;
  const seed = optionNumber('--pattern-seed') ?? Math.floor(Math.random() * 1_000_000);
  const looseFamilies = hasFlag('--loose-pattern-families');

  if (strength < 0 || strength > 1) throw new Error('--pattern-strength must be between 0 and 1');
  if (scale <= 0) throw new Error('--pattern-scale must be greater than 0');
  return { background, foreground, strength, scale, seed, looseFamilies };
}

function patternIsActive(patternOptions) {
  return patternOptions.background !== 'solid' || patternOptions.foreground !== 'solid';
}

function cliOptions() {
  const minContrast = optionFloat('--min-contrast') ?? MIN_CONTRAST;
  const darkBackgroundRate = optionFloat('--dark-background-rate') ?? 0;
  const patternOptions = parsePatternOptions();
  const maxPatternContrast = patternIsActive(patternOptions)
    ? (optionFloat('--max-pattern-contrast') ?? MAX_PATTERN_CONTRAST)
    : optionFloat('--max-pattern-contrast');

  return {
    all: hasFlag('--all'),
    color: !hasFlag('--plain'),
    mutedBackground: hasFlag('--muted-background') || hasFlag('--dim-background'),
    ruler: hasFlag('--ruler') && !hasFlag('--no-ruler'),
    metadata: hasFlag('--info') || hasFlag('--metadata') || hasFlag('--debug'),
    background: selectedIndex('--background', backgrounds),
    foreground: selectedIndex('--foreground', foregrounds),
    backgroundOnly: hasFlag('--background-only'),
    foregroundOnly: hasFlag('--foreground-only'),
    patternOptions,
    colorwayOptions: {
      minContrast,
      darkBackgroundRate,
      families: parseFamilies(optionValue('--families')),
      backgroundFamilies: parseFamilies(optionValue('--background-families') ?? optionValue('--bg-families')),
      foregroundFamilies: parseFamilies(optionValue('--foreground-families') ?? optionValue('--fg-families')),
      familyWeights: parseFamilyWeights(optionValue('--family-weights') ?? optionValue('--weights')),
      backgroundColors: parseColorLayer(optionValue('--background-colors') ?? optionValue('--bg-colors')),
      foregroundColors: parseColorLayer(optionValue('--foreground-colors') ?? optionValue('--fg-colors')),
      maxPatternContrast,
      requireBackgroundVariation: patternOptions.background !== 'solid',
      requireForegroundVariation: patternOptions.foreground !== 'solid',
      requireLayerCoherence: patternIsActive(patternOptions) && !patternOptions.looseFamilies,
    },
  };
}

function printColors() {
  for (const color of colors) {
    console.log(`${color.code.toString().padStart(3, ' ')}  ${color.name.padEnd(16)} ${color.family.padEnd(6)} ${color.tone.padEnd(5)} weight=${color.weight}`);
  }
}

function printHelp() {
  console.log(`Usage: node avatar-grid.js [options]

Glyph levers:
  --background=N              Pick background glyph 1-${backgrounds.length}
  --foreground=N              Pick foreground glyph 1-${foregrounds.length}
  --background-only           Render only the background glyph
  --foreground-only           Render only the foreground glyph

Color levers:
  --background-colors=A/B     Pin background colors by name or ANSI-256 code
  --foreground-colors=A/B     Pin foreground colors by name or ANSI-256 code
  --families=red,pink,purple  Restrict both layer pools by color family
  --background-families=...   Restrict background pool only
  --foreground-families=...   Restrict foreground pool only
  --family-weights=green:0.1,pink:2
                              Tamp or boost color families during random choice
  --min-contrast=4.5          Contrast floor for bg/fg pairs
  --dark-background-rate=0    Probability that generated backgrounds use dark colors

Paint pattern levers:
  --paint-pattern=gradient    Apply a color pattern to both layers
                              solid, gradient, row-gradient, column-gradient,
                              radial, speckle, sparkle, ripple, bands, checker,
                              mixed
  --background-pattern=...    Override background paint pattern
  --foreground-pattern=...    Override foreground paint pattern
  --pattern-strength=0.35     How often/intensely the alternate layer color appears
  --pattern-scale=1           Spatial scale/frequency of the pattern
  --pattern-seed=N            Repeat a specific pattern field
  --max-pattern-contrast=2.2  Intra-layer contrast cap when patterning is active
  --loose-pattern-families    Allow cross-family pattern colors inside a layer

Output:
  --plain                     Disable ANSI color
  --muted-background          Render background cells in bright-black/gray
  --info, --metadata          Print selected glyph/color/pattern metadata
  --ruler                     Show row/column rulers
  --no-ruler                  Hide row/column rulers, kept for old commands
  --all                       Render every foreground on random backgrounds
  --list-colors               Print available color names/codes
`);
}

function render({
  all = false,
  color = true,
  ruler = false,
  mutedBackground = false,
  metadata = false,
  background = null,
  foreground = null,
  backgroundOnly = false,
  foregroundOnly = false,
  colorwayOptions = {},
  patternOptions = defaultPatternOptions(),
} = {}) {
  if (!all) {
    const backgroundIndex = background ?? pick(backgrounds);
    const foregroundIndex = foreground ?? pick(foregrounds);
    const selectedBackground = foregroundOnly ? emptyBackground : backgrounds[backgroundIndex];
    const selectedForeground = backgroundOnly ? emptyForeground : foregrounds[foregroundIndex];
    const avatar = composite(selectedBackground, selectedForeground, {
      trimBackgroundGutter: !foregroundOnly && BACKGROUND_GUTTER_FIXES.has(backgroundIndex),
      trimForegroundGutter: !backgroundOnly && FOREGROUND_GUTTER_FIXES.has(foregroundIndex),
    });
    const colorway = randomColorway(colorwayOptions);

    if (metadata) {
      console.log(
        backgroundOnly
          ? `background ${backgroundIndex + 1}`
          : foregroundOnly
            ? `foreground ${foregroundIndex + 1}`
          : `background ${backgroundIndex + 1} + foreground ${foregroundIndex + 1}`,
      );
      console.log(colorwayLabel(colorway));
      if (patternLabel(patternOptions)) console.log(patternLabel(patternOptions));
    }
    console.log(renderAvatar(avatar, { color, ruler, mutedBackground, colorway, patternOptions }));
    return;
  }

  foregrounds.forEach((foreground, foregroundIndex) => {
    const backgroundIndex = pick(backgrounds);
    const avatar = composite(backgrounds[backgroundIndex], foreground, {
      trimBackgroundGutter: BACKGROUND_GUTTER_FIXES.has(backgroundIndex),
      trimForegroundGutter: FOREGROUND_GUTTER_FIXES.has(foregroundIndex),
    });
    const colorway = randomColorway(colorwayOptions);
    if (foregroundIndex > 0) console.log('');
    if (metadata) {
      console.log(`foreground ${foregroundIndex + 1} on background ${backgroundIndex + 1}`);
      console.log(colorwayLabel(colorway));
      if (patternLabel(patternOptions)) console.log(patternLabel(patternOptions));
    }
    console.log(renderAvatar(avatar, { color, ruler, mutedBackground, colorway, patternOptions }));
  });
}

if (hasFlag('--help')) {
  printHelp();
} else if (hasFlag('--list-colors')) {
  printColors();
} else {
  try {
    render(cliOptions());
  } catch (error) {
    console.error(`avatar-grid: ${error.message}`);
    process.exitCode = 1;
  }
}
