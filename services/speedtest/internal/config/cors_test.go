package config

import "testing"

func TestCORSOriginsAlwaysIncludePublicSite(t *testing.T) {
	t.Setenv("SPEEDTEST_CORS_ORIGINS", "http://127.0.0.1:43123")
	got := Load().CORSOrigins
	want := map[string]bool{
		"http://127.0.0.1:43123":       false,
		"https://myspeedguage.com":     false,
		"https://www.myspeedguage.com": false,
	}
	for _, origin := range got {
		if _, ok := want[origin]; ok {
			want[origin] = true
		}
	}
	for origin, found := range want {
		if !found {
			t.Errorf("missing %s in %v", origin, got)
		}
	}
}

func TestCORSOriginsDropsDuplicateAndSlash(t *testing.T) {
	got := corsOrigins("https://myspeedguage.com/, https://myspeedguage.com")
	count := 0
	for _, origin := range got {
		if origin == "https://myspeedguage.com" {
			count++
		}
		if origin == "https://myspeedguage.com/" {
			t.Fatalf("origin kept a trailing slash: %v", got)
		}
	}
	if count != 1 {
		t.Fatalf("expected one site origin, got %v", got)
	}
}
