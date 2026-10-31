package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	ListenAddr           string
	PublicURL            string
	ServerID             string
	ServerName           string
	ServerRegion         string
	ServerLocation       string
	ServerLatitude       *float64
	ServerLongitude      *float64
	HMACSecret           string
	AdminToken           string
	CORSOrigins          []string
	MaxConcurrentTests   int
	DailyBandwidthBytes  int64
	LightBudgetBytes     int64
	StandardBudgetBytes  int64
	MaxDuration          time.Duration
	SessionTTL           time.Duration
	RateLimitPerIP       int
	EnabledRegions       []string
}

func Load() Config {
	return Config{
		ListenAddr:          getenv("SPEEDTEST_LISTEN_ADDR", ":18443"),
		PublicURL:           getenv("SPEEDTEST_PUBLIC_URL", "http://127.0.0.1:18443"),
		ServerID:            getenv("SPEEDTEST_SERVER_ID", "local-1"),
		ServerName:          getenv("SPEEDTEST_SERVER_NAME", "Local Dev"),
		ServerRegion:        getenv("SPEEDTEST_SERVER_REGION", "local"),
		ServerLocation:      getenv("SPEEDTEST_SERVER_LOCATION", "Development"),
		ServerLatitude:      getenvOptionalFloat("SPEEDTEST_SERVER_LATITUDE"),
		ServerLongitude:     getenvOptionalFloat("SPEEDTEST_SERVER_LONGITUDE"),
		HMACSecret:          getenv("SPEEDTEST_HMAC_SECRET", "dev-hmac-secret-change-in-production"),
		AdminToken:          getenv("SPEEDTEST_ADMIN_TOKEN", "dev-admin-token"),
		CORSOrigins:         splitCSV(getenv("SPEEDTEST_CORS_ORIGINS", "http://127.0.0.1:43123,http://localhost:43123")),
		MaxConcurrentTests:  getenvInt("SPEEDTEST_MAX_CONCURRENT_TESTS", 50),
		DailyBandwidthBytes: int64(getenvInt("SPEEDTEST_DAILY_BANDWIDTH_GB", 500)) * 1024 * 1024 * 1024,
		LightBudgetBytes:    int64(getenvInt("SPEEDTEST_PER_TEST_BUDGET_MB_LIGHT", 20)) * 1024 * 1024,
		StandardBudgetBytes: int64(getenvInt("SPEEDTEST_PER_TEST_BUDGET_MB_STANDARD", 80)) * 1024 * 1024,
		MaxDuration:         time.Duration(getenvInt("SPEEDTEST_MAX_DURATION_SEC", 20)) * time.Second,
		SessionTTL:          time.Duration(getenvInt("SPEEDTEST_SESSION_TTL_SEC", 120)) * time.Second,
		RateLimitPerIP:      getenvInt("SPEEDTEST_RATE_LIMIT_PER_IP", 30),
		EnabledRegions:      splitCSV(getenv("SPEEDTEST_ENABLED_REGIONS", "local,us-east,us-west,eu-west")),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvOptionalFloat(key string) *float64 {
	v := os.Getenv(key)
	if v == "" {
		return nil
	}
	n, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return nil
	}
	return &n
}

func getenvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
