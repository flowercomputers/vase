*Vase*

Vase generates small terminal avatars from fixed 9x17 text templates.

The output is plain terminal text by default, with optional ANSI 256-color
rendering, foreground/background template selection, palette constraints, and
paint patterns.

Importing:

```go
import "github.com/flowercomputers/vase"
```



*Layout*

```text
.
├── *.go              Go library package: github.com/flowercomputers/vase
├── cmd/vase/         Go command-line wrapper
├── node/             Node CLI and browser/SVG prototype
├── foregrounds.txt   Template notes/source material
└── archive/          Older experiments kept for reference
```



*Go CLI*

Run from the repo root:

```sh
go run ./cmd/vase
go run ./cmd/vase --paint-pattern=mixed
go run ./cmd/vase --background=15 --foreground=9 --plain
go run ./cmd/vase --info --ruler
go run ./cmd/vase --list-colors
```

Build a local binary:

```sh
go build -o vase ./cmd/vase
./vase --paint-pattern=mixed
```



*Go Library*

Minimal use:

```go
package main

import (
	"fmt"
	"math/rand"

	"github.com/flowercomputers/vase"
)

func main() {
	model, err := vase.Generate(rand.New(rand.NewSource(1)), vase.DefaultOptions())
	if err != nil {
		panic(err)
	}

	fmt.Println(vase.RenderPlain(model))
}
```

Useful public entrypoints:

- `vase.Generate(rng, opts)` creates an avatar model.
- `vase.Render(model, opts)` renders text with explicit render options.
- `vase.RenderPlain(model)` renders copy/paste-friendly text.
- `vase.RenderANSI(model)` renders colored terminal text.
- `vase.ParseLayer("pollen/lilac")` parses reusable color layers.
- `vase.ParsePattern("mixed")` parses paint patterns.
- `vase.ListColors()` and `vase.KnownFamilies()` expose palette metadata.



*Core Model*

Each avatar combines:

- a 9x17 background template
- a 9x17 foreground template
- one or two background colors
- one or two foreground colors
- an optional paint pattern that swaps between the two colors inside a layer

Template coordinates are preserved. The generator does not recenter templates
by visible bounds because the source art is already authored on the shared
9x17 canvas.

Foreground/background contrast is checked across all color pairings. Patterned
layers also prefer same-family or adjacent-family color variation, so texture
stays coherent while the foreground and background remain visually distinct.



*Development Checks*

```sh
go test ./...
go test -race ./...
go vet ./...
node --check node/avatar-grid.js
```

Quick output checks:

```sh
go run ./cmd/vase --plain --background=15 --foreground=9
npm --prefix node run avatar -- --plain --background=15 --foreground=9
```
