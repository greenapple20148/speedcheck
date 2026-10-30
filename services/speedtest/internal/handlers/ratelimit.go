package handlers

import (
	"net"
	"net/http"
	"sync"
	"time"
)

type ipBucket struct {
	count   int
	resetAt time.Time
}

type RateLimiter struct {
	limit  int
	window time.Duration
	mu     sync.Mutex
	ips    map[string]*ipBucket
}

func NewRateLimiter(limitPerWindow int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		limit:  limitPerWindow,
		window: window,
		ips:    make(map[string]*ipBucket),
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) Allow(r *http.Request) bool {
	ip := clientIP(r)
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()
	b, ok := rl.ips[ip]
	if !ok || now.After(b.resetAt) {
		rl.ips[ip] = &ipBucket{count: 1, resetAt: now.Add(rl.window)}
		return true
	}
	if b.count >= rl.limit {
		return false
	}
	b.count++
	return true
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	for range ticker.C {
		now := time.Now()
		rl.mu.Lock()
		for ip, b := range rl.ips {
			if now.After(b.resetAt) {
				delete(rl.ips, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return xff
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
