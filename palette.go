package vase

import (
	"errors"
	"fmt"
	"math"
	"math/rand"
	"strconv"
	"strings"
)

var analogousFamilies = map[string]map[string]bool{
	"green":  {"green": true, "yellow": true},
	"yellow": {"yellow": true, "green": true},
	"red":    {"red": true, "pink": true},
	"pink":   {"pink": true, "red": true, "purple": true},
	"purple": {"purple": true, "pink": true, "indigo": true},
	"indigo": {"indigo": true, "purple": true, "blue": true},
	"blue":   {"blue": true, "indigo": true},
}

func randomColorway(rng *rand.Rand, opts Options) (Colorway, error) {
	requireBackgroundVariation := opts.Pattern.Background != PatternSolid
	requireForegroundVariation := opts.Pattern.Foreground != PatternSolid
	requireLayerCoherence := (opts.Pattern.Background != PatternSolid || opts.Pattern.Foreground != PatternSolid) && !opts.Pattern.LooseFamilies

	if opts.BackgroundColors != nil && opts.ForegroundColors != nil {
		cw := Colorway{Background: *opts.BackgroundColors, Foreground: *opts.ForegroundColors}
		cw.Contrast = minLayerContrast(cw.Background, cw.Foreground)
		return validateColorway(cw, opts, requireBackgroundVariation, requireForegroundVariation, requireLayerCoherence)
	}

	darkBackground := rng.Float64() < opts.DarkBackgroundRate
	backgroundTone := ""
	switch {
	case opts.BackgroundColors != nil:
		backgroundTone = dominantTone(*opts.BackgroundColors)
	case opts.ForegroundColors != nil:
		backgroundTone = oppositeTone(dominantTone(*opts.ForegroundColors))
	case darkBackground:
		backgroundTone = "dark"
	default:
		backgroundTone = "light"
	}

	foregroundTone := oppositeTone(backgroundTone)
	if opts.ForegroundColors != nil {
		foregroundTone = dominantTone(*opts.ForegroundColors)
	}

	var backgroundPool, foregroundPool []Color
	var err error
	if opts.BackgroundColors == nil {
		backgroundPool, err = colorPool(backgroundTone, firstFamilies(opts.BackgroundFamilies, opts.Families), opts.FamilyWeights)
		if err != nil {
			return Colorway{}, err
		}
	}
	if opts.ForegroundColors == nil {
		foregroundPool, err = colorPool(foregroundTone, firstFamilies(opts.ForegroundFamilies, opts.Families), opts.FamilyWeights)
		if err != nil {
			return Colorway{}, err
		}
	}

	for range 200 {
		bg := chooseLayer(rng, opts.BackgroundColors, backgroundPool)
		fg := chooseLayer(rng, opts.ForegroundColors, foregroundPool)

		cw := Colorway{Background: bg, Foreground: fg, Contrast: minLayerContrast(bg, fg)}
		if validColorway(cw, opts, requireBackgroundVariation, requireForegroundVariation, requireLayerCoherence) {
			return cw, nil
		}
	}

	fallback := defaultColorway()
	if validColorway(fallback, opts, requireBackgroundVariation, requireForegroundVariation, requireLayerCoherence) {
		return fallback, nil
	}
	return Colorway{}, fmt.Errorf("could not find a colorway meeting %.2f:1 contrast with the requested color constraints", opts.MinContrast)
}

func KnownFamilies() []string {
	seen := map[string]bool{}
	families := []string{}
	for _, color := range colors {
		if seen[color.Family] {
			continue
		}
		seen[color.Family] = true
		families = append(families, color.Family)
	}
	return families
}

func FindColor(token string) (Color, error) {
	trimmed := strings.TrimSpace(token)
	normalized := slug(trimmed)
	numericCode, numericErr := strconv.Atoi(normalized)
	for _, color := range colors {
		if numericErr == nil && color.Code == numericCode {
			return color, nil
		}
		if slug(color.Name) == normalized || strings.EqualFold(color.Name, trimmed) {
			return color, nil
		}
	}
	return Color{}, fmt.Errorf("unknown color %q. Run with --list-colors to inspect options", token)
}

func ParseLayer(raw string) (Layer, error) {
	tokens := strings.FieldsFunc(raw, func(r rune) bool { return r == '/' || r == ',' })
	if len(tokens) == 0 || len(tokens) > 2 {
		return Layer{}, fmt.Errorf("color layer %q must contain one or two colors", raw)
	}

	first, err := FindColor(tokens[0])
	if err != nil {
		return Layer{}, err
	}
	second := first
	if len(tokens) == 2 {
		second, err = FindColor(tokens[1])
		if err != nil {
			return Layer{}, err
		}
	}
	return Layer{first, second}, nil
}

func validateColorway(cw Colorway, opts Options, requireBackgroundVariation, requireForegroundVariation, requireLayerCoherence bool) (Colorway, error) {
	if cw.Contrast < opts.MinContrast {
		return Colorway{}, fmt.Errorf("explicit colors only reach %.2f:1 contrast; minimum is %.2f:1", cw.Contrast, opts.MinContrast)
	}
	if opts.MaxPatternContrast != nil && !colorwayIsSubtle(cw, *opts.MaxPatternContrast) {
		return Colorway{}, fmt.Errorf("explicit colors exceed %.2f:1 intra-layer pattern contrast", *opts.MaxPatternContrast)
	}
	if !colorwayHasRequiredVariation(cw, requireBackgroundVariation, requireForegroundVariation) {
		return Colorway{}, errors.New("explicit patterned layers need two distinct colors")
	}
	if requireLayerCoherence && !colorwayHasLayerCoherence(cw, requireBackgroundVariation, requireForegroundVariation) {
		return Colorway{}, errors.New("explicit patterned layer colors must stay in the same or adjacent color family")
	}
	return cw, nil
}

func validColorway(cw Colorway, opts Options, requireBackgroundVariation, requireForegroundVariation, requireLayerCoherence bool) bool {
	return cw.Contrast >= opts.MinContrast &&
		(opts.MaxPatternContrast == nil || colorwayIsSubtle(cw, *opts.MaxPatternContrast)) &&
		colorwayHasRequiredVariation(cw, requireBackgroundVariation, requireForegroundVariation) &&
		(!requireLayerCoherence || colorwayHasLayerCoherence(cw, requireBackgroundVariation, requireForegroundVariation))
}

func defaultColorway() Colorway {
	bg := Layer{colors[19], colors[20]}
	fg := Layer{colors[8], colors[9]}
	return Colorway{Background: bg, Foreground: fg, Contrast: minLayerContrast(bg, fg)}
}

func colorPool(tone string, families []string, weights map[string]float64) ([]Color, error) {
	familySet := makeFamilySet(families)
	pool := []Color{}
	for _, color := range colors {
		if familySet != nil && !familySet[color.Family] {
			continue
		}
		if color.Tone != tone {
			continue
		}
		color.Weight *= weightFor(color.Family, weights)
		if color.Weight > 0 {
			pool = append(pool, color)
		}
	}
	if len(pool) == 0 {
		return nil, fmt.Errorf("no %s colors remain after applying family filters/weights", tone)
	}
	return pool, nil
}

func chooseWeighted(rng *rand.Rand, pool []Color) Color {
	total := 0.0
	for _, color := range pool {
		total += color.Weight
	}
	cursor := rng.Float64() * total
	for _, color := range pool {
		cursor -= color.Weight
		if cursor <= 0 {
			return color
		}
	}
	return pool[len(pool)-1]
}

func chooseLayer(rng *rand.Rand, explicit *Layer, pool []Color) Layer {
	if explicit != nil {
		return *explicit
	}
	return Layer{chooseWeighted(rng, pool), chooseWeighted(rng, pool)}
}

func minLayerContrast(background, foreground Layer) float64 {
	min := math.Inf(1)
	for _, bg := range background {
		for _, fg := range foreground {
			min = math.Min(min, contrastRatio(bg, fg))
		}
	}
	return min
}

func contrastRatio(a, b Color) float64 {
	la, lb := luminance(a), luminance(b)
	light, dark := math.Max(la, lb), math.Min(la, lb)
	return (light + 0.05) / (dark + 0.05)
}

func luminance(color Color) float64 {
	r := linearChannel(color.RGB[0])
	g := linearChannel(color.RGB[1])
	b := linearChannel(color.RGB[2])
	return 0.2126*r + 0.7152*g + 0.0722*b
}

func linearChannel(value float64) float64 {
	normalized := value / 255
	if normalized <= 0.03928 {
		return normalized / 12.92
	}
	return math.Pow((normalized+0.055)/1.055, 2.4)
}

func layerInternalContrast(layer Layer) float64 {
	return contrastRatio(layer[0], layer[1])
}

func colorwayIsSubtle(cw Colorway, maxContrast float64) bool {
	return math.Max(layerInternalContrast(cw.Background), layerInternalContrast(cw.Foreground)) <= maxContrast
}

func colorwayHasRequiredVariation(cw Colorway, background, foreground bool) bool {
	return (!background || cw.Background[0].Code != cw.Background[1].Code) &&
		(!foreground || cw.Foreground[0].Code != cw.Foreground[1].Code)
}

func colorwayHasLayerCoherence(cw Colorway, background, foreground bool) bool {
	return (!background || familiesAreAnalogous(cw.Background)) &&
		(!foreground || familiesAreAnalogous(cw.Foreground))
}

func familiesAreAnalogous(layer Layer) bool {
	return layer[0].Family == layer[1].Family || analogousFamilies[layer[0].Family][layer[1].Family]
}

func dominantTone(layer Layer) string {
	avg := (luminance(layer[0]) + luminance(layer[1])) / 2
	if avg < 0.32 {
		return "dark"
	}
	return "light"
}

func oppositeTone(tone string) string {
	if tone == "dark" {
		return "light"
	}
	return "dark"
}

func firstFamilies(primary, fallback []string) []string {
	if len(primary) > 0 {
		return primary
	}
	return fallback
}

func makeFamilySet(families []string) map[string]bool {
	if len(families) == 0 {
		return nil
	}
	out := make(map[string]bool, len(families))
	for _, family := range families {
		out[family] = true
	}
	return out
}

func weightFor(family string, weights map[string]float64) float64 {
	if weight, ok := weights[family]; ok {
		return weight
	}
	return 1
}

func slug(value string) string {
	return strings.Join(strings.Fields(strings.ToLower(value)), "-")
}
