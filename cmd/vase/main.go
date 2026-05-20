package main

import (
	"flag"
	"fmt"
	"io"
	"math"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/flowercomputers/vase"
)

type cliOptions struct {
	all             bool
	metadata        bool
	listColors      bool
	help            bool
	generateOptions vase.Options
	renderOptions   vase.RenderOptions
}

type flagValues struct {
	background           *int
	foreground           *int
	backgroundOnly       *bool
	foregroundOnly       *bool
	plain                *bool
	muted                *bool
	dim                  *bool
	info                 *bool
	metadata             *bool
	debug                *bool
	showRuler            *bool
	noRuler              *bool
	all                  *bool
	listColors           *bool
	help                 *bool
	minContrast          *float64
	darkBackgroundRate   *float64
	families             *string
	backgroundFamilies   *string
	bgFamilies           *string
	foregroundFamilies   *string
	fgFamilies           *string
	familyWeights        *string
	weights              *string
	backgroundColors     *string
	bgColors             *string
	foregroundColors     *string
	fgColors             *string
	paintPattern         *string
	backgroundPattern    *string
	bgPattern            *string
	foregroundPattern    *string
	fgPattern            *string
	patternStrength      *float64
	patternScale         *float64
	patternSeed          *int
	maxPatternContrast   *float64
	loosePatternFamilies *bool
}

func main() {
	code := run(os.Args[1:], os.Stdout, os.Stderr)
	os.Exit(code)
}

func run(args []string, stdout, stderr io.Writer) int {
	opts, err := parseCLI(args, stderr)
	if err != nil {
		fmt.Fprintf(stderr, "avatar-grid-go: %v\n", err)
		return 1
	}
	if opts.help {
		printHelp(stdout)
		return 0
	}
	if opts.listColors {
		printColors(stdout)
		return 0
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	if err := renderAll(rng, stdout, opts); err != nil {
		fmt.Fprintf(stderr, "avatar-grid-go: %v\n", err)
		return 1
	}
	return 0
}

func parseCLI(args []string, stderr io.Writer) (cliOptions, error) {
	fs := flag.NewFlagSet("avatar-grid-go", flag.ContinueOnError)
	fs.SetOutput(stderr)
	values := bindFlags(fs)
	if err := fs.Parse(args); err != nil {
		return cliOptions{}, err
	}

	return values.cliOptions()
}

func bindFlags(fs *flag.FlagSet) flagValues {
	return flagValues{
		background:           fs.Int("background", 0, ""),
		foreground:           fs.Int("foreground", 0, ""),
		backgroundOnly:       fs.Bool("background-only", false, ""),
		foregroundOnly:       fs.Bool("foreground-only", false, ""),
		plain:                fs.Bool("plain", false, ""),
		muted:                fs.Bool("muted-background", false, ""),
		dim:                  fs.Bool("dim-background", false, ""),
		info:                 fs.Bool("info", false, ""),
		metadata:             fs.Bool("metadata", false, ""),
		debug:                fs.Bool("debug", false, ""),
		showRuler:            fs.Bool("ruler", false, ""),
		noRuler:              fs.Bool("no-ruler", false, ""),
		all:                  fs.Bool("all", false, ""),
		listColors:           fs.Bool("list-colors", false, ""),
		help:                 fs.Bool("help", false, ""),
		minContrast:          fs.Float64("min-contrast", 0, ""),
		darkBackgroundRate:   fs.Float64("dark-background-rate", 0, ""),
		families:             fs.String("families", "", ""),
		backgroundFamilies:   fs.String("background-families", "", ""),
		bgFamilies:           fs.String("bg-families", "", ""),
		foregroundFamilies:   fs.String("foreground-families", "", ""),
		fgFamilies:           fs.String("fg-families", "", ""),
		familyWeights:        fs.String("family-weights", "", ""),
		weights:              fs.String("weights", "", ""),
		backgroundColors:     fs.String("background-colors", "", ""),
		bgColors:             fs.String("bg-colors", "", ""),
		foregroundColors:     fs.String("foreground-colors", "", ""),
		fgColors:             fs.String("fg-colors", "", ""),
		paintPattern:         fs.String("paint-pattern", "", ""),
		backgroundPattern:    fs.String("background-pattern", "", ""),
		bgPattern:            fs.String("bg-pattern", "", ""),
		foregroundPattern:    fs.String("foreground-pattern", "", ""),
		fgPattern:            fs.String("fg-pattern", "", ""),
		patternStrength:      fs.Float64("pattern-strength", 0.35, ""),
		patternScale:         fs.Float64("pattern-scale", 1, ""),
		patternSeed:          fs.Int("pattern-seed", -1, ""),
		maxPatternContrast:   fs.Float64("max-pattern-contrast", math.NaN(), ""),
		loosePatternFamilies: fs.Bool("loose-pattern-families", false, ""),
	}
}

func (values flagValues) cliOptions() (cliOptions, error) {
	patternOptions, err := parsePatternOptions(
		*values.paintPattern,
		firstNonEmpty(*values.backgroundPattern, *values.bgPattern),
		firstNonEmpty(*values.foregroundPattern, *values.fgPattern),
		*values.patternStrength,
		*values.patternScale,
		*values.patternSeed,
		*values.loosePatternFamilies,
	)
	if err != nil {
		return cliOptions{}, err
	}

	options := vase.DefaultOptions()
	options.BackgroundOnly = *values.backgroundOnly
	options.ForegroundOnly = *values.foregroundOnly
	options.MinContrast = *values.minContrast
	options.DarkBackgroundRate = *values.darkBackgroundRate
	options.Pattern = patternOptions
	if *values.background != 0 {
		options.Background = values.background
	}
	if *values.foreground != 0 {
		options.Foreground = values.foreground
	}
	options.Families, err = parseFamilies(*values.families)
	if err != nil {
		return cliOptions{}, err
	}
	options.BackgroundFamilies, err = parseFamilies(firstNonEmpty(*values.backgroundFamilies, *values.bgFamilies))
	if err != nil {
		return cliOptions{}, err
	}
	options.ForegroundFamilies, err = parseFamilies(firstNonEmpty(*values.foregroundFamilies, *values.fgFamilies))
	if err != nil {
		return cliOptions{}, err
	}
	options.FamilyWeights, err = parseFamilyWeights(firstNonEmpty(*values.familyWeights, *values.weights))
	if err != nil {
		return cliOptions{}, err
	}
	options.BackgroundColors, err = parseColorLayer(firstNonEmpty(*values.backgroundColors, *values.bgColors))
	if err != nil {
		return cliOptions{}, err
	}
	options.ForegroundColors, err = parseColorLayer(firstNonEmpty(*values.foregroundColors, *values.fgColors))
	if err != nil {
		return cliOptions{}, err
	}

	patternActive := options.Pattern.Background != vase.PatternSolid || options.Pattern.Foreground != vase.PatternSolid
	if !math.IsNaN(*values.maxPatternContrast) {
		options.MaxPatternContrast = values.maxPatternContrast
	} else if patternActive {
		v := 2.2
		options.MaxPatternContrast = &v
	}

	return cliOptions{
		all:             *values.all,
		metadata:        *values.info || *values.metadata || *values.debug,
		listColors:      *values.listColors,
		help:            *values.help,
		generateOptions: options,
		renderOptions: vase.RenderOptions{
			Color:           !*values.plain,
			Ruler:           *values.showRuler && !*values.noRuler,
			MutedBackground: *values.muted || *values.dim,
		},
	}, nil
}

func renderAll(rng *rand.Rand, stdout io.Writer, opts cliOptions) error {
	if !opts.all {
		model, err := vase.Generate(rng, opts.generateOptions)
		if err != nil {
			return err
		}
		printMetadata(stdout, opts, model, false)
		fmt.Fprintln(stdout, vase.Render(model, opts.renderOptions))
		return nil
	}

	for foreground := 1; foreground <= vase.ForegroundCount(); foreground++ {
		if foreground > 1 {
			fmt.Fprintln(stdout)
		}
		local := opts
		local.generateOptions.Foreground = &foreground
		model, err := vase.Generate(rng, local.generateOptions)
		if err != nil {
			return err
		}
		printMetadata(stdout, local, model, true)
		fmt.Fprintln(stdout, vase.Render(model, local.renderOptions))
	}
	return nil
}

func printMetadata(stdout io.Writer, opts cliOptions, model vase.Model, all bool) {
	if !opts.metadata {
		return
	}
	switch {
	case all:
		fmt.Fprintf(stdout, "foreground %d on background %d\n", model.ForegroundIndex+1, model.BackgroundIndex+1)
	case opts.generateOptions.BackgroundOnly:
		fmt.Fprintf(stdout, "background %d\n", model.BackgroundIndex+1)
	case opts.generateOptions.ForegroundOnly:
		fmt.Fprintf(stdout, "foreground %d\n", model.ForegroundIndex+1)
	default:
		fmt.Fprintf(stdout, "background %d + foreground %d\n", model.BackgroundIndex+1, model.ForegroundIndex+1)
	}
	fmt.Fprintln(stdout, vase.ColorwayLabel(model.Colorway))
	if label := vase.PatternLabel(model.Pattern); label != "" {
		fmt.Fprintln(stdout, label)
	}
}

func parsePatternOptions(shared, background, foreground string, strength, scale float64, seed int, loose bool) (vase.PatternOptions, error) {
	sharedPattern, err := parsePattern(shared, vase.PatternSolid)
	if err != nil {
		return vase.PatternOptions{}, err
	}
	bg, err := parsePattern(background, sharedPattern)
	if err != nil {
		return vase.PatternOptions{}, err
	}
	fg, err := parsePattern(foreground, sharedPattern)
	if err != nil {
		return vase.PatternOptions{}, err
	}
	if strength < 0 || strength > 1 {
		return vase.PatternOptions{}, fmt.Errorf("--pattern-strength must be between 0 and 1")
	}
	if scale <= 0 {
		return vase.PatternOptions{}, fmt.Errorf("--pattern-scale must be greater than 0")
	}
	return vase.PatternOptions{
		Background:    bg,
		Foreground:    fg,
		Strength:      strength,
		Scale:         scale,
		Seed:          seed,
		LooseFamilies: loose,
	}, nil
}

func parsePattern(raw string, fallback vase.Pattern) (vase.Pattern, error) {
	if raw == "" {
		return fallback, nil
	}
	return vase.ParsePattern(raw)
}

func parseFamilies(raw string) ([]string, error) {
	if raw == "" {
		return nil, nil
	}
	known := make(map[string]bool, len(vase.KnownFamilies()))
	for _, family := range vase.KnownFamilies() {
		known[family] = true
	}
	out := []string{}
	for _, family := range strings.Split(raw, ",") {
		family = strings.TrimSpace(family)
		if family == "" {
			continue
		}
		if !known[family] {
			return nil, fmt.Errorf("unknown color family %q", family)
		}
		out = append(out, family)
	}
	return out, nil
}

func parseFamilyWeights(raw string) (map[string]float64, error) {
	out := map[string]float64{}
	if raw == "" {
		return out, nil
	}
	for _, entry := range strings.Split(raw, ",") {
		if entry == "" {
			continue
		}
		parts := strings.SplitN(entry, ":", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("bad family weight %q. Use family:number", entry)
		}
		weight, err := strconv.ParseFloat(parts[1], 64)
		if err != nil {
			return nil, fmt.Errorf("bad family weight %q. Use family:number", entry)
		}
		out[strings.TrimSpace(parts[0])] = weight
	}
	return out, nil
}

func parseColorLayer(raw string) (*vase.Layer, error) {
	if raw == "" {
		return nil, nil
	}
	layer, err := vase.ParseLayer(raw)
	if err != nil {
		return nil, err
	}
	return &layer, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func printColors(stdout io.Writer) {
	for _, color := range vase.ListColors() {
		fmt.Fprintf(stdout, "%3d  %-16s %-6s %-5s weight=%g\n", color.Code, color.Name, color.Family, color.Tone, color.Weight)
	}
}

func printHelp(stdout io.Writer) {
	fmt.Fprintf(stdout, `Usage: vase [options]

Glyph levers:
  --background=N              Pick background glyph 1-%d
  --foreground=N              Pick foreground glyph 1-%d
  --background-only           Render only the background glyph
  --foreground-only           Render only the foreground glyph

Color levers:
  --background-colors=A/B     Pin background colors by name or ANSI-256 code
  --foreground-colors=A/B     Pin foreground colors by name or ANSI-256 code
  --families=red,pink,purple  Restrict both layer pools by color family
  --background-families=...   Restrict background pool only
  --foreground-families=...   Restrict foreground pool only
  --family-weights=green:0.1,pink:2
  --min-contrast=4.5          Contrast floor for bg/fg pairs
  --dark-background-rate=0    Probability that generated backgrounds use dark colors

Paint pattern levers:
  --paint-pattern=mixed       solid, gradient, row-gradient, column-gradient,
                              radial, speckle, sparkle, ripple, bands, checker,
                              mixed
  --background-pattern=...    Override background paint pattern
  --foreground-pattern=...    Override foreground paint pattern
  --pattern-strength=0.35
  --pattern-scale=1
  --pattern-seed=N
  --max-pattern-contrast=2.2
  --loose-pattern-families

Output:
  --plain
  --muted-background
  --info, --metadata
  --ruler
  --all
  --list-colors
`, vase.BackgroundCount(), vase.ForegroundCount())
}
