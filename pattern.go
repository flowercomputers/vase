package vase

import "math"

func ParsePattern(raw string) (Pattern, error) {
	pattern := Pattern(raw)
	if !paintPatterns[pattern] {
		return "", errUnknownPattern(pattern)
	}
	return pattern, nil
}

func shadeFor(char rune, layerColors Layer, x, y int, layer string, patternOptions PatternOptions) Color {
	base := 0
	if char == '░' || char == '▒' {
		base = 1
	}
	return layerColors[patternShadeIndex(x, y, layer, base, patternOptions)]
}

func patternShadeIndex(x, y int, layer string, base int, opts PatternOptions) int {
	pattern := opts.Background
	if layer == "foreground" {
		pattern = opts.Foreground
	}
	pattern = resolvedPattern(pattern, layer, opts.Seed)
	if pattern == PatternSolid {
		return base
	}
	strength := clamp(opts.Strength, 0, 1)
	scale := math.Max(0.25, opts.Scale)
	signal := patternSignal(pattern, x, y, layer, scale, opts.Seed)
	threshold := 1 - strength
	if pattern == PatternSparkle {
		threshold = 1 - strength*0.35
	}
	if signal > threshold {
		return 1 - base
	}
	return base
}

func resolvedPattern(pattern Pattern, layer string, seed int) Pattern {
	if pattern != PatternMixed {
		return pattern
	}
	choices := []Pattern{
		PatternGradient,
		PatternRowGradient,
		PatternColumnGradient,
		PatternRadial,
		PatternSpeckle,
		PatternSparkle,
		PatternRipple,
		PatternBands,
		PatternChecker,
	}
	return choices[int(math.Floor(hash01(0, 0, layer, seed)*float64(len(choices))))]
}

func patternSignal(pattern Pattern, x, y int, layer string, scale float64, seed int) float64 {
	switch pattern {
	case PatternGradient:
		return clamp((float64(x)/(width-1)*0.68+float64(y)/(height-1)*0.32)*scale, 0, 1)
	case PatternRowGradient:
		return clamp((float64(y)/(height-1))*scale, 0, 1)
	case PatternColumnGradient:
		return clamp((float64(x)/(width-1))*scale, 0, 1)
	case PatternRadial:
		cx, cy := float64(width-1)/2, float64(height-1)/2
		return clamp((math.Hypot(float64(x)-cx, (float64(y)-cy)*1.8)/math.Hypot(cx, cy*1.8))*scale, 0, 1)
	case PatternSpeckle:
		return hash01(x, y, layer, seed)
	case PatternSparkle:
		local := hash01(x, y, layer, seed)
		if local < 0.82 {
			return 0
		}
		return 0.9 + hash01(x+17, y+9, layer, seed)*0.1
	case PatternRipple:
		cx, cy := float64(width-1)/2, float64(height-1)/2
		distance := math.Hypot(float64(x)-cx, (float64(y)-cy)*1.8)
		phase := hash01(3, 7, layer, seed) * math.Pi * 2
		return (math.Sin(distance*scale*1.45+phase) + 1) / 2
	case PatternBands:
		phase := hash01(11, 5, layer, seed) * math.Pi * 2
		return (math.Sin((float64(x)*0.75+float64(y)*0.35)*scale+phase) + 1) / 2
	case PatternChecker:
		size := int(math.Max(1, math.Round(2/scale)))
		if (x/size+y/size)%2 == 0 {
			return 0.25
		}
		return 0.85
	default:
		return 0
	}
}

func hash01(x, y int, layer string, seed int) float64 {
	value := uint32((x+1)*374761393 + (y+1)*668265263 + seed*1442695041)
	if layer == "foreground" {
		value += uint32(2246822519)
	} else {
		value += uint32(3266489917)
	}
	value = (value ^ (value >> 13)) * 1274126177
	return float64(value^(value>>16)) / 4294967295
}

func clamp(value, min, max float64) float64 {
	return math.Min(max, math.Max(min, value))
}
