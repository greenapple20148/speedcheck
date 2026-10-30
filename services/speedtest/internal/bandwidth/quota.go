package bandwidth

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

type Metrics struct {
	ActiveTests          int64 `json:"activeTests"`
	TestsStartedToday    int64 `json:"testsStartedToday"`
	TestsCompletedToday  int64 `json:"testsCompletedToday"`
	TestsRejectedToday   int64 `json:"testsRejectedToday"`
	BytesTransferredToday int64 `json:"bytesTransferredToday"`
	DailyLimitBytes      int64 `json:"dailyLimitBytes"`
	MaxConcurrent        int64 `json:"maxConcurrent"`
	DayKey               string `json:"dayKey"`
}

type Controller struct {
	maxConcurrent int64
	dailyLimit    int64
	active        int64
	started       int64
	completed     int64
	rejected      int64
	bytesToday    int64
	dayKey        string
	mu            sync.Mutex
}

func NewController(maxConcurrent int, dailyLimitBytes int64) *Controller {
	return &Controller{
		maxConcurrent: int64(maxConcurrent),
		dailyLimit:    dailyLimitBytes,
		dayKey:        dayKey(time.Now().UTC()),
	}
}

func (c *Controller) TryBegin() error {
	c.rollDay()
	for {
		cur := atomic.LoadInt64(&c.active)
		if cur >= c.maxConcurrent {
			atomic.AddInt64(&c.rejected, 1)
			return fmt.Errorf("server at capacity (%d concurrent tests)", c.maxConcurrent)
		}
		if atomic.CompareAndSwapInt64(&c.active, cur, cur+1) {
			atomic.AddInt64(&c.started, 1)
			return nil
		}
	}
}

func (c *Controller) End() {
	atomic.AddInt64(&c.active, -1)
	atomic.AddInt64(&c.completed, 1)
}

func (c *Controller) RecordBytes(n int64) error {
	c.rollDay()
	newTotal := atomic.AddInt64(&c.bytesToday, n)
	if newTotal > c.dailyLimit {
		atomic.AddInt64(&c.bytesToday, -n)
		atomic.AddInt64(&c.rejected, 1)
		return fmt.Errorf("daily bandwidth quota exceeded")
	}
	return nil
}

func (c *Controller) Snapshot() Metrics {
	c.rollDay()
	return Metrics{
		ActiveTests:           atomic.LoadInt64(&c.active),
		TestsStartedToday:     atomic.LoadInt64(&c.started),
		TestsCompletedToday:   atomic.LoadInt64(&c.completed),
		TestsRejectedToday:    atomic.LoadInt64(&c.rejected),
		BytesTransferredToday: atomic.LoadInt64(&c.bytesToday),
		DailyLimitBytes:       c.dailyLimit,
		MaxConcurrent:         c.maxConcurrent,
		DayKey:                c.dayKey,
	}
}

func (c *Controller) UpdateLimits(maxConcurrent int, dailyLimitBytes int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	atomic.StoreInt64(&c.maxConcurrent, int64(maxConcurrent))
	c.dailyLimit = dailyLimitBytes
}

func (c *Controller) rollDay() {
	today := dayKey(time.Now().UTC())
	c.mu.Lock()
	defer c.mu.Unlock()
	if today != c.dayKey {
		c.dayKey = today
		atomic.StoreInt64(&c.started, 0)
		atomic.StoreInt64(&c.completed, 0)
		atomic.StoreInt64(&c.rejected, 0)
		atomic.StoreInt64(&c.bytesToday, 0)
	}
}

func dayKey(t time.Time) string {
	return t.Format("2006-01-02")
}
