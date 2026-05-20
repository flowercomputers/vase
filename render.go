package vase

import (
	"fmt"
	"strings"
)

var mutedBackgroundColor = Color{Code: 8}

func Render(model Model, opts RenderOptions) string {
	lines := make([]string, 0, height+1)
	for y, row := range model.Cells {
		var b strings.Builder
		if opts.Ruler {
			fmt.Fprintf(&b, "%d  ", y+1)
		}
		for x, cell := range row {
			b.WriteString(renderCell(cell, opts, model.Colorway, model.Pattern, x, y))
		}
		lines = append(lines, b.String())
	}
	if opts.Ruler {
		lines = append(lines, "   "+ruler)
	}
	return strings.Join(lines, "\n")
}

func RenderPlain(model Model) string {
	return Render(model, RenderOptions{})
}

func RenderANSI(model Model) string {
	return Render(model, DefaultRenderOptions())
}

func renderCell(cell Cell, opts RenderOptions, colorway Colorway, pattern PatternOptions, x, y int) string {
	if cell.Foreground != ' ' {
		return paint(cell.Foreground, shadeFor(cell.Foreground, colorway.Foreground, x, y, "foreground", pattern), opts.Color)
	}
	if cell.Background != ' ' {
		color := shadeFor(cell.Background, colorway.Background, x, y, "background", pattern)
		if opts.MutedBackground {
			color = mutedBackgroundColor
		}
		return paint(cell.Background, color, opts.Color)
	}
	return " "
}

func paint(char rune, color Color, useColor bool) string {
	if !useColor || char == ' ' {
		return string(char)
	}
	return fmt.Sprintf("\x1b[38;5;%dm%s\x1b[0m", color.Code, string(char))
}

func ColorwayLabel(cw Colorway) string {
	return fmt.Sprintf("colors background=%s(%s) foreground=%s(%s) min-contrast=%.2f:1",
		colorNames(cw.Background),
		colorFamilies(cw.Background),
		colorNames(cw.Foreground),
		colorFamilies(cw.Foreground),
		cw.Contrast,
	)
}

func PatternLabel(opts PatternOptions) string {
	if opts.Background == PatternSolid && opts.Foreground == PatternSolid {
		return ""
	}
	return fmt.Sprintf(
		"paint background=%s foreground=%s strength=%.2f scale=%.2f seed=%d",
		opts.Background,
		opts.Foreground,
		opts.Strength,
		opts.Scale,
		opts.Seed,
	)
}

func colorNames(layer Layer) string {
	return layer[0].Name + "/" + layer[1].Name
}

func colorFamilies(layer Layer) string {
	return layer[0].Family + "/" + layer[1].Family
}
