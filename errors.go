package vase

import "fmt"

func errUnknownPattern(pattern Pattern) error {
	return fmt.Errorf("unknown paint pattern %q", pattern)
}
