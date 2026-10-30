package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/speedcheck/speedtest/internal/bandwidth"
	"github.com/speedcheck/speedtest/internal/config"
	"github.com/speedcheck/speedtest/internal/session"
)

func testServer() *Server {
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
		RateLimitPerIP:      1000,
	}
	return &Server{
		Cfg:      cfg,
		Sessions: session.NewManager(cfg.HMACSecret, cfg.SessionTTL, cfg.LightBudgetBytes, cfg.StandardBudgetBytes),
		Quota:    bandwidth.NewController(cfg.MaxConcurrentTests, cfg.DailyBandwidthBytes),
		Limiter:  NewRateLimiter(cfg.RateLimitPerIP, time.Minute),
	}
}

func TestSessionDownloadUpload(t *testing.T) {
	s := testServer()
	handler := s.Routes()

	req := httptest.NewRequest(http.MethodPost, "/sessions", bytes.NewBufferString(`{"mode":"lightweight"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("session status %d: %s", rr.Code, rr.Body.String())
	}
	var sess map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &sess); err != nil {
		t.Fatal(err)
	}
	token := sess["token"].(string)

	dreq := httptest.NewRequest(http.MethodGet, "/download?size=65536&token="+token, nil)
	drr := httptest.NewRecorder()
	handler.ServeHTTP(drr, dreq)
	if drr.Code != http.StatusOK {
		t.Fatalf("download %d: %s", drr.Code, drr.Body.String())
	}
	if drr.Body.Len() != 65536 {
		t.Fatalf("download bytes %d", drr.Body.Len())
	}

	payload := bytes.Repeat([]byte("a"), 32768)
	ureq := httptest.NewRequest(http.MethodPost, "/upload?token="+token, bytes.NewReader(payload))
	urr := httptest.NewRecorder()
	handler.ServeHTTP(urr, ureq)
	if urr.Code != http.StatusOK {
		t.Fatalf("upload %d: %s", urr.Code, urr.Body.String())
	}
}

func TestInvalidSessionRejected(t *testing.T) {
	s := testServer()
	handler := s.Routes()
	req := httptest.NewRequest(http.MethodGet, "/download?size=1024&token=bad", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 got %d", rr.Code)
	}
}

func TestAdminAuth(t *testing.T) {
	s := testServer()
	handler := s.Routes()
	req := httptest.NewRequest(http.MethodGet, "/admin/metrics", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 got %d", rr.Code)
	}
	req2 := httptest.NewRequest(http.MethodGet, "/admin/metrics", nil)
	req2.Header.Set("Authorization", "Bearer admin")
	rr2 := httptest.NewRecorder()
	handler.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d body %s", rr2.Code, rr2.Body.String())
	}
	body, _ := io.ReadAll(rr2.Body)
	if !bytes.Contains(body, []byte("metrics")) {
		t.Fatalf("unexpected body %s", body)
	}
}

func TestHealth(t *testing.T) {
	s := testServer()
	handler := s.Routes()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("health %d", rr.Code)
	}
}
