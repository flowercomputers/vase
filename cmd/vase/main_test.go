package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestRunPlainSingleAvatar(t *testing.T) {
	t.Parallel()

	var stdout, stderr bytes.Buffer
	code := run([]string{"--plain", "--background=15", "--foreground=9"}, &stdout, &stderr)
	if code != 0 {
		t.Fatalf("run() code = %d, stderr = %q", code, stderr.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	lines := strings.Split(strings.TrimRight(stdout.String(), "\n"), "\n")
	if len(lines) != 9 {
		t.Fatalf("line count = %d, want 9\n%s", len(lines), stdout.String())
	}
}
