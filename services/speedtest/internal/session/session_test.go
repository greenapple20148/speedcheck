package session

import (
	"testing"
	"time"
)

func TestCreateAndValidate(t *testing.T) {
	m := NewManager("test-secret", time.Minute, 10<<20, 40<<20)
	sess, token, err := m.Create(ModeLightweight)
	if err != nil {
		t.Fatal(err)
	}
	got, err := m.Validate(token)
	if err != nil {
		t.Fatal(err)
	}
	if got.SessionID != sess.SessionID {
		t.Fatalf("session mismatch")
	}
	if got.MaxBytes != 10<<20 {
		t.Fatalf("unexpected budget %d", got.MaxBytes)
	}
}

func TestRejectTamperedToken(t *testing.T) {
	m := NewManager("test-secret", time.Minute, 10<<20, 40<<20)
	_, token, err := m.Create(ModeStandard)
	if err != nil {
		t.Fatal(err)
	}
	tampered := token + "x"
	if _, err := m.Validate(tampered); err == nil {
		t.Fatal("expected signature failure")
	}
}

func TestByteBudget(t *testing.T) {
	m := NewManager("test-secret", time.Minute, 1000, 1000)
	sess, _, err := m.Create(ModeLightweight)
	if err != nil {
		t.Fatal(err)
	}
	if err := m.ReserveBytes(sess, 600); err != nil {
		t.Fatal(err)
	}
	if err := m.ReserveBytes(sess, 500); err == nil {
		t.Fatal("expected budget exceed")
	}
}

func TestCancel(t *testing.T) {
	m := NewManager("test-secret", time.Minute, 1000, 1000)
	sess, token, err := m.Create(ModeStandard)
	if err != nil {
		t.Fatal(err)
	}
	if !m.Cancel(sess.SessionID) {
		t.Fatal("cancel failed")
	}
	if _, err := m.Validate(token); err == nil {
		t.Fatal("expected cancelled session rejection")
	}
}
