package session

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
)

type Mode string

const (
	ModeLightweight Mode = "lightweight"
	ModeStandard    Mode = "standard"
)

type Claims struct {
	SessionID string `json:"sid"`
	Mode      Mode   `json:"mode"`
	MaxBytes  int64  `json:"maxBytes"`
	Exp       int64  `json:"exp"`
	Iat       int64  `json:"iat"`
}

type ActiveSession struct {
	Claims
	BytesUsed    int64
	CreatedAt    time.Time
	LastActivity time.Time
	Cancelled    atomic.Bool
}

type Manager struct {
	secret     []byte
	ttl        time.Duration
	lightMax   int64
	standardMax int64
	mu         sync.Mutex
	active     map[string]*ActiveSession
}

func NewManager(secret string, ttl time.Duration, lightMax, standardMax int64) *Manager {
	m := &Manager{
		secret:      []byte(secret),
		ttl:         ttl,
		lightMax:    lightMax,
		standardMax: standardMax,
		active:      make(map[string]*ActiveSession),
	}
	go m.reaper()
	return m
}

func (m *Manager) Create(mode Mode) (*ActiveSession, string, error) {
	if mode != ModeLightweight && mode != ModeStandard {
		mode = ModeStandard
	}
	now := time.Now()
	maxBytes := m.standardMax
	if mode == ModeLightweight {
		maxBytes = m.lightMax
	}
	claims := Claims{
		SessionID: uuid.NewString(),
		Mode:      mode,
		MaxBytes:  maxBytes,
		Exp:       now.Add(m.ttl).Unix(),
		Iat:       now.Unix(),
	}
	token, err := m.sign(claims)
	if err != nil {
		return nil, "", err
	}
	sess := &ActiveSession{
		Claims:       claims,
		CreatedAt:    now,
		LastActivity: now,
	}
	m.mu.Lock()
	m.active[claims.SessionID] = sess
	m.mu.Unlock()
	return sess, token, nil
}

func (m *Manager) Validate(token string) (*ActiveSession, error) {
	claims, err := m.verify(token)
	if err != nil {
		return nil, err
	}
	if time.Now().Unix() > claims.Exp {
		return nil, errors.New("session expired")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	sess, ok := m.active[claims.SessionID]
	if !ok {
		// Reconstruct from token for distributed/restart resilience, still enforce budget.
		sess = &ActiveSession{
			Claims:       *claims,
			CreatedAt:    time.Unix(claims.Iat, 0),
			LastActivity: time.Now(),
		}
		m.active[claims.SessionID] = sess
	}
	if sess.Cancelled.Load() {
		return nil, errors.New("session cancelled")
	}
	sess.LastActivity = time.Now()
	return sess, nil
}

func (m *Manager) ReserveBytes(sess *ActiveSession, n int64) error {
	for {
		used := atomic.LoadInt64(&sess.BytesUsed)
		if used+n > sess.MaxBytes {
			return fmt.Errorf("session byte budget exceeded (%d/%d)", used, sess.MaxBytes)
		}
		if atomic.CompareAndSwapInt64(&sess.BytesUsed, used, used+n) {
			return nil
		}
	}
}

func (m *Manager) Cancel(sessionID string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	sess, ok := m.active[sessionID]
	if !ok {
		return false
	}
	sess.Cancelled.Store(true)
	return true
}

func (m *Manager) ActiveCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.active)
}

func (m *Manager) sign(claims Claims) (string, error) {
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	encoded := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, m.secret)
	mac.Write([]byte(encoded))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return encoded + "." + sig, nil
}

func (m *Manager) verify(token string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return nil, errors.New("invalid token format")
	}
	mac := hmac.New(sha256.New, m.secret)
	mac.Write([]byte(parts[0]))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return nil, errors.New("invalid token signature")
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("invalid token payload")
	}
	var claims Claims
	if err := json.Unmarshal(raw, &claims); err != nil {
		return nil, errors.New("invalid token claims")
	}
	return &claims, nil
}

func (m *Manager) reaper() {
	ticker := time.NewTicker(30 * time.Second)
	for range ticker.C {
		now := time.Now().Unix()
		m.mu.Lock()
		for id, sess := range m.active {
			if now > sess.Exp || time.Since(sess.LastActivity) > m.ttl*2 {
				delete(m.active, id)
			}
		}
		m.mu.Unlock()
	}
}
