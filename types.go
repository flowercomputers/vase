package vase

const (
	width              = 17
	height             = 9
	ruler              = "0123456789abcdefg"
	minContrastDefault = 4.5
	maxPatternContrast = 2.2
)

// Pattern names the paint field used to swap between the two colors inside a
// layer. It intentionally mirrors the terminal CLI values.
type Pattern string

const (
	PatternSolid          Pattern = "solid"
	PatternGradient       Pattern = "gradient"
	PatternRowGradient    Pattern = "row-gradient"
	PatternColumnGradient Pattern = "column-gradient"
	PatternRadial         Pattern = "radial"
	PatternSpeckle        Pattern = "speckle"
	PatternSparkle        Pattern = "sparkle"
	PatternRipple         Pattern = "ripple"
	PatternBands          Pattern = "bands"
	PatternChecker        Pattern = "checker"
	PatternMixed          Pattern = "mixed"
)

var paintPatterns = map[Pattern]bool{
	PatternSolid: true, PatternGradient: true, PatternRowGradient: true, PatternColumnGradient: true,
	PatternRadial: true, PatternSpeckle: true, PatternSparkle: true, PatternRipple: true,
	PatternBands: true, PatternChecker: true, PatternMixed: true,
}

type Color struct {
	Name   string
	Code   int
	RGB    [3]float64
	Tone   string
	Family string
	Weight float64
}

type Layer [2]Color

type Cell struct {
	Background rune
	Foreground rune
}

type Colorway struct {
	Background Layer
	Foreground Layer
	Contrast   float64
}

type PatternOptions struct {
	Background    Pattern
	Foreground    Pattern
	Strength      float64
	Scale         float64
	Seed          int
	LooseFamilies bool
}

type Options struct {
	// Background and Foreground are 1-based template selectors, matching the CLI.
	// A nil value lets Generate choose randomly from the available templates.
	Background         *int
	Foreground         *int
	BackgroundOnly     bool
	ForegroundOnly     bool
	MinContrast        float64
	DarkBackgroundRate float64
	Families           []string
	BackgroundFamilies []string
	ForegroundFamilies []string
	FamilyWeights      map[string]float64
	BackgroundColors   *Layer
	ForegroundColors   *Layer
	MaxPatternContrast *float64
	Pattern            PatternOptions
}

type Model struct {
	Cells           [][]Cell
	BackgroundIndex int
	ForegroundIndex int
	Colorway        Colorway
	Pattern         PatternOptions
}

type RenderOptions struct {
	// Color defaults to false in the zero value. Use DefaultRenderOptions,
	// RenderANSI, or set Color explicitly when ANSI output is desired.
	Color           bool
	Ruler           bool
	MutedBackground bool
}

func DefaultOptions() Options {
	return Options{
		MinContrast: minContrastDefault,
		Pattern: PatternOptions{
			Background: PatternSolid,
			Foreground: PatternSolid,
			Strength:   0.35,
			Scale:      1,
			Seed:       -1,
		},
	}
}

func DefaultRenderOptions() RenderOptions {
	return RenderOptions{Color: true}
}

func ListColors() []Color {
	out := make([]Color, len(colors))
	copy(out, colors)
	return out
}

func BackgroundCount() int {
	return len(backgrounds)
}

func ForegroundCount() int {
	return len(foregrounds)
}
