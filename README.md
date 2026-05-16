# Avatar Grid Generator Notes

This repository contains `avatar-grid.js`, a small terminal avatar generator built from fixed 9x17 text templates. The script is intentionally plain Node, with no runtime dependencies, so it can be run directly while iterating on the visual grammar:

```sh
cd "/Users/edouard/Developer/Flower Computer Company/vase"
npm run avatar
npm run avatar -- --paint-pattern=mixed
node avatar-grid.js --background=15 --foreground=9 --plain
```

By default, the command prints only the 9x17 avatar. Use `--info` for generation metadata and `--ruler` for row/column rulers.

## Core Model

The generator has four primary variable categories:

- Foreground glyph template: `--foreground=N`
- Background glyph template: `--background=N`
- Foreground color layer: generated or pinned with `--foreground-colors=A/B`
- Background color layer: generated or pinned with `--background-colors=A/B`

Foreground and background templates are both authored on the same 9x17 canvas. The script preserves template coordinates rather than recentering by visible bounds. This matters because many motifs use intentional empty space around the centerline.

The visible ruler is:

```text
0123456789abcdefg
```

The center cell is column `8`, row `5` in human-facing 1-indexed coordinates, or `{ x: 8, y: 4 }` internally.

## Alignment Decisions

Earlier versions tried to center foregrounds by their non-space bounding boxes. That was wrong for this material because the source templates already carry their own alignment against the 9x17 grid.

The current rule is:

- Normalize every row to exactly 17 cells.
- Preserve x/y coordinates.
- Apply only known transcription-gutter fixes from the original tabular paste.
- Never infer centering from glyph density.

There are targeted gutter-fix sets in the script for backgrounds and foregrounds. Do not replace those with blanket trimming; some leading spaces are real canvas coordinates.

Useful probes:

```sh
node avatar-grid.js --background=15 --background-only --plain --ruler
node avatar-grid.js --foreground=1 --foreground-only --plain --ruler
```

## Terminal Color Assumptions

The script uses ANSI 256-color foreground sequences:

```text
ESC[38;5;Nm
```

It does not use truecolor. That is deliberate: truecolor does not reliably degrade to 256 colors, and ANSI 256 is a better default for terminal screenshots, tmux panes, logs, and unknown terminal environments.

`--plain` disables color entirely. To keep foreground colors while pushing the background back into terminal gray/bright-black, use:

```sh
npm run avatar -- --muted-background
```

## Color Direction

The current default polarity is stable:

- Backgrounds choose from light-tone colors.
- Foregrounds choose from dark-tone colors.

This replaced an earlier random light/dark flip because that made generations feel less coherent. You can intentionally reintroduce dark backgrounds with:

```sh
npm run avatar -- --dark-background-rate=0.25
```

The default palette is vaguely floral/wildflower:

- yellows/chartreuses/greens
- pinks/fuchsias/reds
- purples
- indigos/blues

Greens are intentionally weighted lower than pink/red/purple. Blue and indigo exist as neighboring floral colors, not as the dominant default identity.

Inspect current colors with:

```sh
node avatar-grid.js --list-colors
```

## Contrast Rules

The important contrast rule is between foreground and background, not just between named colors. Because each layer can have two colors, the script checks all four foreground/background pairings.

Default:

```text
--min-contrast=4.5
```

If explicit color selections cannot satisfy the floor, the script fails rather than quietly producing a muddy avatar.

Example:

```sh
node avatar-grid.js \
  --background-colors=black-cherry/rosewood \
  --foreground-colors=pink-alyssum/peony
```

## Paint Patterns

Paint patterns are a paint-stage layer over existing glyph/color choices. They do not change glyph placement.

Available patterns:

```text
solid
gradient
row-gradient
column-gradient
radial
speckle
sparkle
ripple
bands
checker
mixed
```

Examples:

```sh
npm run avatar -- --paint-pattern=mixed
npm run avatar -- --background-pattern=gradient --foreground-pattern=speckle
npm run avatar -- --paint-pattern=ripple --pattern-strength=0.25 --pattern-scale=1.5 --pattern-seed=42
npm run avatar -- --background-pattern=radial --foreground-pattern=sparkle
```

The pattern system only swaps between the two selected colors inside each layer. It has two guardrails:

- `--max-pattern-contrast=2.2` caps contrast inside a single patterned layer.
- Patterned layer colors must stay in the same or adjacent color family by default.

That second rule prevents muddy combinations such as a background alternating between yellow and lilac while the foreground is dark red. If you really want cross-family layer patterns, use:

```sh
npm run avatar -- --paint-pattern=mixed --loose-pattern-families
```

## Color Family Coherence

Patterned layers use an adjacency map:

```text
green   -> green, yellow
yellow  -> yellow, green
red     -> red, pink
pink    -> pink, red, purple
purple  -> purple, pink, indigo
indigo  -> indigo, purple, blue
blue    -> blue, indigo
```

This keeps paint texture within a legible color identity while still allowing gentle variation.

## Useful Levers

Specific glyphs:

```sh
node avatar-grid.js --background=15 --foreground=9
```

Restrict spectrum:

```sh
node avatar-grid.js --families=red,pink,purple,yellow
```

Separate background and foreground spectrum:

```sh
node avatar-grid.js \
  --background-families=blue,indigo \
  --foreground-families=blue,indigo,purple
```

Tamp or boost families:

```sh
node avatar-grid.js --family-weights=green:0.05,pink:2,red:2,purple:1.2
```

Raise contrast:

```sh
node avatar-grid.js --min-contrast=5.5
```

Mute background color:

```sh
node avatar-grid.js --muted-background
```

Show metadata or rulers:

```sh
node avatar-grid.js --info
node avatar-grid.js --ruler
```

## Notes For Future Agents

Keep the script data-oriented. Most changes should be new templates, new colors, new families, or new paint-pattern functions.

Avoid adding a visual recentering heuristic unless the source templates stop being authored on the shared 9x17 grid. The current hand-tuned alignment is part of the design system, not incidental formatting.

When adding colors, prefer ANSI 256 entries with known RGB approximations. Give each color:

- `name`
- `code`
- `rgb`
- `tone`: `light` or `dark`
- `family`
- `weight`

When adding a new color family, update `ANALOGOUS_FAMILIES`; otherwise patterned layers may reject it or pair it poorly.

When adding paint patterns, keep them subtle by default. Patterning should create texture within a layer, while the foreground/background silhouette remains sharply distinct.
