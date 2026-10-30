package bandwidth

import "testing"

func TestConcurrencyCap(t *testing.T) {
	c := NewController(2, 1<<30)
	if err := c.TryBegin(); err != nil {
		t.Fatal(err)
	}
	if err := c.TryBegin(); err != nil {
		t.Fatal(err)
	}
	if err := c.TryBegin(); err == nil {
		t.Fatal("expected capacity rejection")
	}
	c.End()
	if err := c.TryBegin(); err != nil {
		t.Fatal(err)
	}
}

func TestDailyQuota(t *testing.T) {
	c := NewController(10, 1000)
	if err := c.RecordBytes(600); err != nil {
		t.Fatal(err)
	}
	if err := c.RecordBytes(500); err == nil {
		t.Fatal("expected daily quota rejection")
	}
	snap := c.Snapshot()
	if snap.BytesTransferredToday != 600 {
		t.Fatalf("bytes=%d", snap.BytesTransferredToday)
	}
}
