package vase

import (
	"math/rand"
	"strings"
	"testing"
)

func TestGenerateWithFixedSeed(t *testing.T) {
	t.Parallel()

	model, err := Generate(rand.New(rand.NewSource(1)), DefaultOptions())
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}
	if model.BackgroundIndex != 11 {
		t.Fatalf("BackgroundIndex = %d, want 11", model.BackgroundIndex)
	}
	if model.ForegroundIndex != 3 {
		t.Fatalf("ForegroundIndex = %d, want 3", model.ForegroundIndex)
	}
	if len(model.Cells) != height {
		t.Fatalf("len(Cells) = %d, want %d", len(model.Cells), height)
	}
	for y, row := range model.Cells {
		if len(row) != width {
			t.Fatalf("len(Cells[%d]) = %d, want %d", y, len(row), width)
		}
	}
}

func TestGenerateRejectsLowContrastExplicitColors(t *testing.T) {
	t.Parallel()

	background := Layer{mustColor(t, "black cherry"), mustColor(t, "rosewood")}
	foreground := Layer{mustColor(t, "burgundy"), mustColor(t, "wineberry")}
	opts := DefaultOptions()
	opts.BackgroundColors = &background
	opts.ForegroundColors = &foreground

	_, err := Generate(rand.New(rand.NewSource(1)), opts)
	if err == nil {
		t.Fatal("Generate() error = nil, want low contrast error")
	}
	if !strings.Contains(err.Error(), "contrast") {
		t.Fatalf("Generate() error = %q, want contrast error", err)
	}
}

func TestGenerateRejectsCrossFamilyPatternUnlessLoose(t *testing.T) {
	t.Parallel()

	background := Layer{mustColor(t, "pollen"), mustColor(t, "lilac")}
	foreground := Layer{mustColor(t, "black cherry"), mustColor(t, "rosewood")}
	opts := DefaultOptions()
	opts.BackgroundColors = &background
	opts.ForegroundColors = &foreground
	opts.Pattern = PatternOptions{
		Background: PatternMixed,
		Foreground: PatternMixed,
		Strength:   0.35,
		Scale:      1,
		Seed:       42,
	}
	opts.MaxPatternContrast = nil

	_, err := Generate(rand.New(rand.NewSource(1)), opts)
	if err == nil {
		t.Fatal("Generate() error = nil, want layer coherence error")
	}
	if !strings.Contains(err.Error(), "same or adjacent color family") {
		t.Fatalf("Generate() error = %q, want layer coherence error", err)
	}

	opts.Pattern.LooseFamilies = true
	if _, err := Generate(rand.New(rand.NewSource(1)), opts); err != nil {
		t.Fatalf("Generate() with LooseFamilies error = %v", err)
	}
}

func TestRenderPlainEmitsNoANSI(t *testing.T) {
	t.Parallel()

	model, err := Generate(rand.New(rand.NewSource(1)), DefaultOptions())
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}
	out := Render(model, RenderOptions{Color: false})
	if strings.Contains(out, "\x1b[") {
		t.Fatalf("Render() contains ANSI escape: %q", out)
	}
}

func TestRenderMutedBackgroundUsesANSI8(t *testing.T) {
	t.Parallel()

	background := 1
	foreground := 1
	opts := DefaultOptions()
	opts.Background = &background
	opts.Foreground = &foreground
	model, err := Generate(rand.New(rand.NewSource(1)), opts)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}
	out := Render(model, RenderOptions{Color: true, MutedBackground: true})
	if !strings.Contains(out, "\x1b[38;5;8m") {
		t.Fatalf("Render() did not use muted background ANSI color 8: %q", out)
	}
}

func TestParsePattern(t *testing.T) {
	t.Parallel()

	pattern, err := ParsePattern("mixed")
	if err != nil {
		t.Fatalf("ParsePattern() error = %v", err)
	}
	if pattern != PatternMixed {
		t.Fatalf("ParsePattern() = %q, want %q", pattern, PatternMixed)
	}
	if _, err := ParsePattern("bad-pattern"); err == nil {
		t.Fatal("ParsePattern() error = nil, want error")
	}
}

func TestParseLayer(t *testing.T) {
	t.Parallel()

	layer, err := ParseLayer("pollen/lilac")
	if err != nil {
		t.Fatalf("ParseLayer() error = %v", err)
	}
	if layer[0].Name != "pollen" || layer[1].Name != "lilac" {
		t.Fatalf("ParseLayer() = %q/%q, want pollen/lilac", layer[0].Name, layer[1].Name)
	}
}

func mustColor(t *testing.T, name string) Color {
	t.Helper()
	for _, color := range ListColors() {
		if color.Name == name {
			return color
		}
	}
	t.Fatalf("missing color %q", name)
	return Color{}
}
