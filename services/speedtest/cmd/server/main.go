package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/speedcheck/speedtest/internal/bandwidth"
	"github.com/speedcheck/speedtest/internal/config"
	"github.com/speedcheck/speedtest/internal/handlers"
	"github.com/speedcheck/speedtest/internal/session"
)

func main() {
	cfg := config.Load()
	const defaultHMAC = "dev-hmac-secret-change-in-production"
	const defaultAdmin = "dev-admin-token"
	if os.Getenv("SPEEDTEST_PRODUCTION") == "true" &&
		(cfg.HMACSecret == defaultHMAC || cfg.AdminToken == defaultAdmin) {
		log.Fatal("refusing to start: SPEEDTEST_PRODUCTION=true but the HMAC secret or admin token is still a default")
	}
	if cfg.HMACSecret == defaultHMAC {
		log.Println("warning: measurement service is using the default HMAC secret")
	}

	sessions := session.NewManager(cfg.HMACSecret, cfg.SessionTTL, cfg.LightBudgetBytes, cfg.StandardBudgetBytes)
	quota := bandwidth.NewController(cfg.MaxConcurrentTests, cfg.DailyBandwidthBytes)
	limiter := handlers.NewRateLimiter(cfg.RateLimitPerIP, time.Minute)
	pingLimiter := handlers.NewRateLimiter(cfg.PingRateLimitPerIP, time.Minute)

	srv := &handlers.Server{
		Cfg:         cfg,
		Sessions:    sessions,
		Quota:       quota,
		Limiter:     limiter,
		PingLimiter: pingLimiter,
	}

	server := &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           srv.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	log.Printf("SpeedCheck measurement service listening on %s (public %s)", cfg.ListenAddr, cfg.PublicURL)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Println(err)
		os.Exit(1)
	}
}
