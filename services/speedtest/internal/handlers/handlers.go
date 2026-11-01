package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/speedcheck/speedtest/internal/bandwidth"
	"github.com/speedcheck/speedtest/internal/config"
	"github.com/speedcheck/speedtest/internal/session"
)

type Server struct {
	Cfg         config.Config
	Sessions    *session.Manager
	Quota       *bandwidth.Controller
	Limiter     *RateLimiter
	PingLimiter *RateLimiter
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/servers", s.handleServers)
	mux.HandleFunc("/sessions", s.handleSessions)
	mux.HandleFunc("/sessions/cancel", s.handleCancel)
	mux.HandleFunc("/ping", s.handlePing)
	mux.HandleFunc("/download", s.handleDownload)
	mux.HandleFunc("/upload", s.handleUpload)
	mux.HandleFunc("/admin/metrics", s.handleAdminMetrics)
	mux.HandleFunc("/admin/config", s.handleAdminConfig)
	return s.withCORS(s.withNoCache(mux))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	snap := s.Quota.Snapshot()
	healthy := snap.ActiveTests < snap.MaxConcurrent && snap.BytesTransferredToday < snap.DailyLimitBytes
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  map[bool]string{true: "ok", false: "degraded"}[healthy],
		"healthy": healthy,
		"server":  s.serverInfo(),
		"metrics": snap,
		"time":    time.Now().UTC().Format(time.RFC3339Nano),
	})
}

func (s *Server) handleServers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"servers": []map[string]any{s.serverInfo()},
	})
}

func (s *Server) handleSessions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	if !s.Limiter.Allow(r) {
		writeError(w, http.StatusTooManyRequests, "rate limit exceeded")
		return
	}
	if err := s.Quota.TryBegin(); err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}
	// Slot held until client finishes; they should cancel or expire. Soft-release via End after create
	// is wrong — instead we End when cancel is called or rely on session TTL + active count of transfers.
	// For capacity we track concurrent active transfer slots separately via TryBegin/End around transfers.
	s.Quota.End()

	var body struct {
		Mode session.Mode `json:"mode"`
	}
	_ = json.NewDecoder(io.LimitReader(r.Body, 1<<16)).Decode(&body)
	if body.Mode == "" {
		body.Mode = session.ModeStandard
	}

	sess, token, err := s.Sessions.Create(body.Mode)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	connections := 8
	chunk := 1 << 20 // 1 MiB
	if body.Mode == session.ModeLightweight {
		connections = 2
		chunk = 512 << 10
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"sessionId":           sess.SessionID,
		"token":               token,
		"mode":                sess.Mode,
		"expiresAt":           sess.Exp * 1000,
		"maxBytes":            sess.MaxBytes,
		"maxDurationMs":       s.Cfg.MaxDuration.Milliseconds(),
		"downloadConnections": connections,
		"uploadConnections":   connections,
		"chunkSize":           chunk,
		"server":              s.serverInfo(),
	})
}

func (s *Server) handleCancel(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	token := bearerOrQuery(r)
	sess, err := s.Sessions.Validate(token)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	s.Sessions.Cancel(sess.SessionID)
	writeJSON(w, http.StatusOK, map[string]any{"cancelled": true, "sessionId": sess.SessionID})
}

func (s *Server) handlePing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		methodNotAllowed(w)
		return
	}
	if s.PingLimiter != nil && !s.PingLimiter.Allow(r) {
		writeError(w, http.StatusTooManyRequests, "rate limit exceeded")
		return
	}
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	token := bearerOrQuery(r)
	sess, err := s.Sessions.Validate(token)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	if err := s.Quota.TryBegin(); err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}
	defer s.Quota.End()

	size := parseSize(r.URL.Query().Get("size"), 1<<20)
	remaining := sess.MaxBytes - sess.BytesUsed
	if size > remaining {
		size = remaining
	}
	if size <= 0 {
		writeError(w, http.StatusPaymentRequired, "session byte budget exhausted")
		return
	}
	if err := s.Sessions.ReserveBytes(sess, size); err != nil {
		writeError(w, http.StatusPaymentRequired, err.Error())
		return
	}
	if err := s.Quota.RecordBytes(size); err != nil {
		writeError(w, http.StatusTooManyRequests, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Content-Encoding", "identity")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// Zero-filled payload: throughput tests do not need cryptographic randomness.
	// Avoids CPU saturation on small VPSes (was crypto/rand per chunk).
	buf := make([]byte, 64*1024)
	var written int64
	for written < size {
		if sess.Cancelled.Load() || r.Context().Err() != nil {
			return
		}
		n := int64(len(buf))
		if size-written < n {
			n = size - written
		}
		nw, err := w.Write(buf[:n])
		written += int64(nw)
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		if err != nil {
			return
		}
	}
}

func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		methodNotAllowed(w)
		return
	}
	token := bearerOrQuery(r)
	sess, err := s.Sessions.Validate(token)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	if err := s.Quota.TryBegin(); err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}
	defer s.Quota.End()

	limit := sess.MaxBytes - sess.BytesUsed
	if limit <= 0 {
		writeError(w, http.StatusPaymentRequired, "session byte budget exhausted")
		return
	}

	reader := io.LimitReader(r.Body, limit+1)
	buf := make([]byte, 64*1024)
	var received int64
	for {
		if sess.Cancelled.Load() || r.Context().Err() != nil {
			break
		}
		n, err := reader.Read(buf)
		received += int64(n)
		if received > limit {
			received = limit
			break
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			writeError(w, http.StatusBadRequest, "upload interrupted")
			return
		}
	}

	if err := s.Sessions.ReserveBytes(sess, received); err != nil {
		writeError(w, http.StatusPaymentRequired, err.Error())
		return
	}
	if err := s.Quota.RecordBytes(received); err != nil {
		writeError(w, http.StatusTooManyRequests, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"receivedBytes": received,
		"sessionId":     sess.SessionID,
	})
}

func (s *Server) handleAdminMetrics(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(r) {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"metrics":      s.Quota.Snapshot(),
		"activeSessions": s.Sessions.ActiveCount(),
		"server":       s.serverInfo(),
	})
}

func (s *Server) handleAdminConfig(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(r) {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{
			"maxConcurrentTests":  s.Cfg.MaxConcurrentTests,
			"dailyBandwidthBytes": s.Cfg.DailyBandwidthBytes,
			"lightBudgetBytes":    s.Cfg.LightBudgetBytes,
			"standardBudgetBytes": s.Cfg.StandardBudgetBytes,
			"maxDurationSec":      s.Cfg.MaxDuration.Seconds(),
			"sessionTTLSec":       s.Cfg.SessionTTL.Seconds(),
			"enabledRegions":      s.Cfg.EnabledRegions,
		})
	case http.MethodPut:
		var body struct {
			MaxConcurrentTests  *int   `json:"maxConcurrentTests"`
			DailyBandwidthBytes *int64 `json:"dailyBandwidthBytes"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}
		maxC := s.Cfg.MaxConcurrentTests
		daily := s.Cfg.DailyBandwidthBytes
		if body.MaxConcurrentTests != nil {
			maxC = *body.MaxConcurrentTests
			s.Cfg.MaxConcurrentTests = maxC
		}
		if body.DailyBandwidthBytes != nil {
			daily = *body.DailyBandwidthBytes
			s.Cfg.DailyBandwidthBytes = daily
		}
		s.Quota.UpdateLimits(maxC, daily)
		writeJSON(w, http.StatusOK, map[string]any{"updated": true})
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) authorizeAdmin(r *http.Request) bool {
	auth := r.Header.Get("Authorization")
	return auth == "Bearer "+s.Cfg.AdminToken
}

func (s *Server) serverInfo() map[string]any {
	return map[string]any{
		"id":       s.Cfg.ServerID,
		"name":     s.Cfg.ServerName,
		"region":   s.Cfg.ServerRegion,
		"location": s.Cfg.ServerLocation,
		"url":      s.Cfg.PublicURL,
		"healthy":  true,
	}
}

func (s *Server) withCORS(next http.Handler) http.Handler {
	allowed := map[string]struct{}{}
	for _, o := range s.Cfg.CORSOrigins {
		allowed[o] = struct{}{}
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if _, ok := allowed[origin]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Cache-Control, Pragma")
				w.Header().Set("Access-Control-Expose-Headers", "X-Session-Bytes-Used")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) withNoCache(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

func bearerOrQuery(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return r.URL.Query().Get("token")
}

func parseSize(raw string, fallback int64) int64 {
	if raw == "" {
		return fallback
	}
	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || n <= 0 {
		return fallback
	}
	const maxChunk = 32 << 20 // 32 MiB per request
	if n > maxChunk {
		return maxChunk
	}
	return n
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func methodNotAllowed(w http.ResponseWriter) {
	writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}
