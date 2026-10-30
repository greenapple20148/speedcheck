package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/speedcheck/speedtest/internal/bandwidth"
	"github.com/speedcheck/speedtest/internal/config"
	"github.com/speedcheck/speedtest/internal/session"
)

func TestDailyQuotaEnforced(t *testing.T) {
	cfg := config.Config{
		PublicURL:           "http://127.0.0.1:18443",
		ServerID:            "test-1",
		ServerName:          "Test",
		ServerRegion:        "local",
		ServerLocation:      "Lab",
		HMACSecret:          "test-secret",
		AdminToken:          "admin",
		CORSOrigins:         []string{"http://127.0.0.1:43123"},
		MaxConcurrentTests:  10,
		DailyBandwidthBytes: 100_000,
		LightBudgetBytes:    5 << 20,
		StandardBudgetBytes: 10 << 20,
		MaxDuration:         10 * time.Second,
		SessionTTL:          time.Minute,
		RateLimitPerIP:      1000,
	}
	s := &Server{
		Cfg:      cfg,
		Sessions: session.NewManager(cfg.HMACSecret, cfg.SessionTTL, cfg.LightBudgetBytes, cfg.StandardBudgetBytes),
		Quota:    bandwidth.NewController(cfg.MaxConcurrentTests, cfg.DailyBandwidthBytes),
		Limiter:  NewRateLimiter(cfg.RateLimitPerIP, time.Minute),
	}
	handler := s.Routes()

	req := httptest.NewRequest(http.MethodPost, "/sessions", bytes.NewBufferString(`{"mode":"lightweight"}`))
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	var sess map[string]any
	_ = json.Unmarshal(rr.Body.Bytes(), &sess)
	token := sess["token"].(string)

	dreq := httptest.NewRequest(http.MethodGet, "/download?size=90000&token="+token, nil)
	drr := httptest.NewRecorder()
	handler.ServeHTTP(drr, dreq)
	if drr.Code != http.StatusOK {
		t.Fatalf("first download expected 200 got %d", drr.Code)
	}

	dreq2 := httptest.NewRequest(http.MethodGet, "/download?size=20000&token="+token, nil)
	drr2 := httptest.NewRecorder()
	handler.ServeHTTP(drr2, dreq2)
	if drr2.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 for daily quota, got %d body %s", drr2.Code, drr2.Body.String())
	}
}

func TestRateLimitOnSessions(t *testing.T) {
	cfg := config.Config{
		PublicURL:           "http://127.0.0.1:18443",
		ServerID:            "test-1",
		ServerName:          "Test",
		ServerRegion:        "local",
		ServerLocation:      "Lab",
		HMACSecret:          "test-secret",
		AdminToken:          "admin",
		CORSOrigins:         []string{"http://127.0.0.1:43123"},
		MaxConcurrentTests:  10,
		DailyBandwidthBytes: 1 << 30,
		LightBudgetBytes:    5 << 20,
		StandardBudgetBytes: 10 << 20,
		MaxDuration:         10 * time.Second,
		SessionTTL:          time.Minute,
		RateLimitPerIP:      2,
	}
	s := &Server{
		Cfg:      cfg,
		Sessions: session.NewManager(cfg.HMACSecret, cfg.SessionTTL, cfg.LightBudgetBytes, cfg.StandardBudgetBytes),
		Quota:    bandwidth.NewController(cfg.MaxConcurrentTests, cfg.DailyBandwidthBytes),
		Limiter:  NewRateLimiter(cfg.RateLimitPerIP, time.Minute),
	}
	handler := s.Routes()
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/sessions", bytes.NewBufferString(`{"mode":"lightweight"}`))
		req.RemoteAddr = "203.0.113.10:1234"
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected create %d", rr.Code)
		}
	}
	req := httptest.NewRequest(http.MethodPost, "/sessions", bytes.NewBufferString(`{"mode":"lightweight"}`))
	req.RemoteAddr = "203.0.113.10:1234"
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 got %d", rr.Code)
	}
}
