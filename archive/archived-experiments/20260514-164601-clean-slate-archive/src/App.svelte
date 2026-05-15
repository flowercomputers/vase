<script lang="ts">
  const MAX_CODE_POINT = 0x10ffff;
  const SURROGATE_START = 0xd800;
  const SURROGATE_END = 0xdfff;
  const SURROGATE_COUNT = SURROGATE_END - SURROGATE_START + 1;
  const GLYPH_COUNT = MAX_CODE_POINT + 1 - SURROGATE_COUNT;
  const CHUNK_SIZE = 1000;
  const LOAD_AHEAD_PX = 900;

  type Glyph = {
    char: string;
    codePoint: number;
    hex: string;
    isControl: boolean;
  };

  let foregroundLightness = $state(13);
  let foregroundChroma = $state(0.03);
  let foregroundHue = $state(219);
  let backgroundLightness = $state(80);
  let backgroundChroma = $state(0.16);
  let backgroundHue = $state(149);
  let fontSize = $state(34);
  let selected = $state<Glyph | null>(null);
  let glyphs = $state<Glyph[]>(buildGlyphChunk(0, CHUNK_SIZE));

  let foreground = $derived(oklch(foregroundLightness, foregroundChroma, foregroundHue));
  let background = $derived(oklch(backgroundLightness, backgroundChroma, backgroundHue));
  let selectedLabel = $derived(
    selected
      ? `U+${selected.hex} ${selected.isControl ? controlName(selected.codePoint) : selected.char}`
      : `${glyphs.length.toLocaleString()} loaded of ${GLYPH_COUNT.toLocaleString()} Unicode scalar values`
  );

  function oklch(lightness: number, chroma: number, hue: number): string {
    return `oklch(${lightness}% ${chroma.toFixed(3)} ${Math.round(hue)})`;
  }

  function toHex(codePoint: number): string {
    return codePoint.toString(16).toUpperCase().padStart(4, '0');
  }

  function isControl(codePoint: number): boolean {
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
  }

  function controlName(codePoint: number): string {
    return codePoint === 0x20 ? 'SPACE' : 'CONTROL';
  }

  function charFor(codePoint: number): string {
    if (codePoint === 0x20) return 'Space';
    if (isControl(codePoint)) return '·';

    return String.fromCodePoint(codePoint);
  }

  function scalarIndexToCodePoint(index: number): number {
    return index < SURROGATE_START ? index : index + SURROGATE_COUNT;
  }

  function glyphAt(index: number): Glyph {
    const codePoint = scalarIndexToCodePoint(index);

    return {
      char: charFor(codePoint),
      codePoint,
      hex: toHex(codePoint),
      isControl: isControl(codePoint)
    };
  }

  function buildGlyphChunk(startIndex: number, count: number): Glyph[] {
    const nextGlyphs: Glyph[] = [];
    const endIndex = Math.min(GLYPH_COUNT, startIndex + count);

    // Chunks are indexed over Unicode scalar values, not raw UTF-16 units, so
    // surrogate code points never appear in the visual test surface.
    for (let index = startIndex; index < endIndex; index += 1) {
      nextGlyphs.push(glyphAt(index));
    }

    return nextGlyphs;
  }

  function loadNextChunk(): void {
    if (glyphs.length >= GLYPH_COUNT) return;

    glyphs = glyphs.concat(buildGlyphChunk(glyphs.length, CHUNK_SIZE));
  }

  function maybeLoadMore(event: Event): void {
    const target = event.currentTarget as HTMLDivElement;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceToBottom < LOAD_AHEAD_PX) {
      loadNextChunk();
    }
  }

  function selectGlyph(glyph: Glyph): void {
    selected = glyph;
  }
</script>

<svelte:head>
  <title>Unicode Glyph Grid</title>
</svelte:head>

<main class="app" style:--glyph-fg={foreground} style:--glyph-bg={background} style:--glyph-size={`${fontSize}px`}>
  <section class="stage" aria-label="Unicode glyph preview">
    <header class="grid-meta">
      <strong>{selectedLabel}</strong>
      <div class="header-controls" aria-label="Unicode glyph grid controls">
        <fieldset class="oklch-control">
          <legend>Foreground</legend>
          <span class="swatch" style:background={foreground}></span>
          <label>
            <span>L</span>
            <input type="range" min="0" max="100" step="1" bind:value={foregroundLightness} />
          </label>
          <label>
            <span>C</span>
            <input type="range" min="0" max="0.4" step="0.005" bind:value={foregroundChroma} />
          </label>
          <label>
            <span>H</span>
            <input type="range" min="0" max="360" step="1" bind:value={foregroundHue} />
          </label>
        </fieldset>
        <fieldset class="oklch-control">
          <legend>Background</legend>
          <span class="swatch" style:background={background}></span>
          <label>
            <span>L</span>
            <input type="range" min="0" max="100" step="1" bind:value={backgroundLightness} />
          </label>
          <label>
            <span>C</span>
            <input type="range" min="0" max="0.4" step="0.005" bind:value={backgroundChroma} />
          </label>
          <label>
            <span>H</span>
            <input type="range" min="0" max="360" step="1" bind:value={backgroundHue} />
          </label>
        </fieldset>
        <label class="size-control">
          <span>Size</span>
          <input type="range" min="14" max="72" step="1" bind:value={fontSize} />
        </label>
      </div>
    </header>

    <div class="glyph-scroll" onscroll={maybeLoadMore}>
      <div class="glyph-grid">
        {#each glyphs as glyph (glyph.codePoint)}
          <button
            class:control={glyph.isControl}
            title={`U+${glyph.hex}`}
            aria-label={`U+${glyph.hex}`}
            onclick={() => selectGlyph(glyph)}
          >
            <span class="glyph">{glyph.char}</span>
          </button>
        {/each}
      </div>
    </div>
  </section>
</main>
