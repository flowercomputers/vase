package vase

import (
	"fmt"
	"math/rand"
)

var (
	backgroundGutterFixes = map[int]bool{1: true, 2: true, 3: true, 4: true, 6: true, 7: true, 8: true, 9: true, 10: true}
	foregroundGutterFixes = map[int]bool{1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true}
)

func Generate(rng *rand.Rand, opts Options) (Model, error) {
	if rng == nil {
		return Model{}, fmt.Errorf("nil random source")
	}

	opts = normalizeOptions(opts, rng)
	bgIdx, fgIdx := rng.Intn(len(backgrounds)), rng.Intn(len(foregrounds))
	if opts.Background != nil {
		idx, err := selectedIndex("background", *opts.Background, len(backgrounds))
		if err != nil {
			return Model{}, err
		}
		bgIdx = idx
	}
	if opts.Foreground != nil {
		idx, err := selectedIndex("foreground", *opts.Foreground, len(foregrounds))
		if err != nil {
			return Model{}, err
		}
		fgIdx = idx
	}

	bg, fg := backgrounds[bgIdx], foregrounds[fgIdx]
	if opts.ForegroundOnly {
		bg = emptyTemplate()
	}
	if opts.BackgroundOnly {
		fg = emptyTemplate()
	}

	colorway, err := randomColorway(rng, opts)
	if err != nil {
		return Model{}, err
	}

	return Model{
		Cells: composite(
			bg,
			fg,
			!opts.ForegroundOnly && backgroundGutterFixes[bgIdx],
			!opts.BackgroundOnly && foregroundGutterFixes[fgIdx],
		),
		BackgroundIndex: bgIdx,
		ForegroundIndex: fgIdx,
		Colorway:        colorway,
		Pattern:         opts.Pattern,
	}, nil
}

func normalizeOptions(opts Options, rng *rand.Rand) Options {
	defaults := DefaultOptions()
	if opts.MinContrast == 0 {
		opts.MinContrast = defaults.MinContrast
	}
	if opts.Pattern.Background == "" {
		opts.Pattern.Background = defaults.Pattern.Background
	}
	if opts.Pattern.Foreground == "" {
		opts.Pattern.Foreground = defaults.Pattern.Foreground
	}
	if opts.Pattern.Strength == 0 {
		opts.Pattern.Strength = defaults.Pattern.Strength
	}
	if opts.Pattern.Scale == 0 {
		opts.Pattern.Scale = defaults.Pattern.Scale
	}
	patternActive := opts.Pattern.Background != PatternSolid || opts.Pattern.Foreground != PatternSolid
	if opts.Pattern.Seed < 0 && patternActive {
		opts.Pattern.Seed = rng.Intn(1_000_000)
	}
	if opts.FamilyWeights == nil {
		opts.FamilyWeights = map[string]float64{}
	}
	return opts
}

func selectedIndex(name string, value, length int) (int, error) {
	if value < 1 || value > length {
		return 0, fmt.Errorf("%s must be between 1 and %d", name, length)
	}
	return value - 1, nil
}

func emptyTemplate() Template {
	return make(Template, height)
}

func composite(background, foreground Template, trimBackgroundGutter, trimForegroundGutter bool) [][]Cell {
	bg := normalize(background, trimBackgroundGutter)
	fg := normalize(foreground, trimForegroundGutter)
	avatar := make([][]Cell, height)
	for y := range height {
		avatar[y] = make([]Cell, width)
		for x := range width {
			avatar[y][x] = Cell{Background: bg[y][x], Foreground: fg[y][x]}
		}
	}
	return avatar
}

func normalize(template Template, trimLeadingGutter bool) [][]rune {
	out := make([][]rune, height)
	for y := range height {
		line := ""
		if y < len(template) {
			line = template[y]
		}
		runes := []rune(line)
		if trimLeadingGutter && len(runes) > 0 && runes[0] == ' ' {
			runes = runes[1:]
		}
		for len(runes) < width {
			runes = append(runes, ' ')
		}
		out[y] = runes[:width]
	}
	return out
}
