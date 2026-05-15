<script lang="ts">
  import { Copy, Dice5, RefreshCw } from 'lucide-svelte';
  import { exportAnsi, generateTerminalFrame, type ColorMode, type Composition, type TerminalFrame } from './terminal-art';

  const compositions: Composition[] = ['ditherfield', 'sigil', 'circuit', 'weave', 'poster'];
  const colorModes: ColorMode[] = ['ansi16', 'ansi256', 'truecolor'];

  let seed = $state('terminal-styled-art-001');
  let cols = $state(80);
  let rows = $state(28);
  let fontSize = $state(14);
  let composition: Composition = $state('sigil');
  let colorMode: ColorMode = $state('ansi256');
  let density = $state(0.72);
  let contrast = $state(0.78);
  let noise = $state(0.26);
  let showGrid = $state(false);

  let frame: TerminalFrame = $derived(
    generateTerminalFrame({
      seed,
      cols,
      rows,
      composition,
      colorMode,
      density,
      contrast,
      noise
    })
  );

  let ansi = $derived(exportAnsi(frame));

  function randomize(): void {
    seed = crypto.randomUUID();
  }

  function nudge(): void {
    seed = `${seed.split(':')[0]}:${Math.random().toString(16).slice(2, 8)}`;
  }

  async function copyAnsi(): Promise<void> {
    await navigator.clipboard.writeText(ansi);
  }
</script>

<svelte:head>
  <title>Terminal Canvas</title>
</svelte:head>

<main class="app">
  <aside class="controls" aria-label="Terminal canvas controls">
    <header>
      <h1>Terminal Canvas</h1>
      <p>One glyph, foreground, background, and style per cell.</p>
    </header>

    <label>
      <span>Seed</span>
      <input bind:value={seed} spellcheck="false" />
    </label>

    <div class="button-row">
      <button onclick={randomize}><Dice5 size={16} /> Random</button>
      <button onclick={nudge}><RefreshCw size={16} /> Nudge</button>
    </div>

    <label>
      <span>Composition</span>
      <select bind:value={composition}>
        {#each compositions as option (option)}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>Color mode</span>
      <div class="segmented">
        {#each colorModes as option (option)}
          <button class={{ active: colorMode === option }} onclick={() => (colorMode = option)}>{option}</button>
        {/each}
      </div>
    </label>

    <div class="two-up">
      <label>
        <span>Cols</span>
        <input type="number" min="24" max="160" bind:value={cols} />
      </label>
      <label>
        <span>Rows</span>
        <input type="number" min="12" max="60" bind:value={rows} />
      </label>
    </div>

    <label>
      <span>Font size</span>
      <input type="range" min="7" max="18" step="1" bind:value={fontSize} />
    </label>

    <label>
      <span>Density</span>
      <input type="range" min="0.1" max="1" step="0.01" bind:value={density} />
    </label>

    <label>
      <span>Contrast bias</span>
      <input type="range" min="0" max="1" step="0.01" bind:value={contrast} />
    </label>

    <label>
      <span>Signal noise</span>
      <input type="range" min="0" max="1" step="0.01" bind:value={noise} />
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={showGrid} />
      <span>show cell grid</span>
    </label>

    <button class="copy" onclick={copyAnsi}><Copy size={16} /> Copy ANSI frame</button>
  </aside>

  <section class="stage" aria-label="Styled terminal viewport">
    <div class="terminal-chrome">
      <div class="dots"><span></span><span></span><span></span></div>
      <div>{cols}x{rows} · {composition} · {colorMode}</div>
      <div>fg/bg/glyph cells</div>
    </div>

    <div
      class={{ viewport: true, grid: showGrid }}
      style={`--cols:${frame.cols}; --rows:${frame.rows}; --font:${fontSize}px`}
      aria-label="Terminal art preview"
    >
      {#each frame.cells as cell, index (index)}
        <span
          class={{ bold: cell.bold, dim: cell.dim }}
          style={`color:${cell.fg}; background:${cell.bg}`}
          title={`cell ${index}: ${cell.char}`}
        >
          {cell.char}
        </span>
      {/each}
    </div>
  </section>

  <aside class="readout" aria-label="Terminal constraints readout">
    <h2>Cell Model</h2>
    <pre>{`cell = {
  char: "░",
  foreground: "#ffffff",
  background: "#00afd7",
  attrs: ["bold", "dim"]
}`}</pre>

    <h2>Export Shape</h2>
    <pre>{ansi.slice(0, 1800)}{ansi.length > 1800 ? '\n…' : ''}</pre>
  </aside>
</main>
