package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const (
	sessionCookieName = "lf_session"
	sessionMaxAge     = 24 * time.Hour
)

type Session struct {
	ID        string
	UserID    int64
	Email     string
	FirstName string
	LastName  string
	Role      string
	CreatedAt time.Time
	ExpiresAt time.Time
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	secret   []byte
}

func NewSessionStore(secret string) *SessionStore {
	s := &SessionStore{
		sessions: make(map[string]*Session),
		secret:   []byte(secret),
	}
	go s.cleanup()
	return s
}

func (s *SessionStore) Create(userID int64, email, firstName, lastName, role string) (*Session, error) {
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		return nil, fmt.Errorf("generate session token: %w", err)
	}

	now := time.Now()
	sess := &Session{
		ID:        hex.EncodeToString(token),
		UserID:    userID,
		Email:     email,
		FirstName: firstName,
		LastName:  lastName,
		Role:      role,
		CreatedAt: now,
		ExpiresAt: now.Add(sessionMaxAge),
	}

	s.mu.Lock()
	s.sessions[sess.ID] = sess
	s.mu.Unlock()

	return sess, nil
}

func (s *SessionStore) Get(sessionID string) *Session {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sess, ok := s.sessions[sessionID]
	if !ok {
		return nil
	}
	if time.Now().After(sess.ExpiresAt) {
		delete(s.sessions, sessionID)
		return nil
	}
	return sess
}

func (s *SessionStore) Delete(sessionID string) {
	s.mu.Lock()
	delete(s.sessions, sessionID)
	s.mu.Unlock()
}

func (s *SessionStore) SetCookie(w http.ResponseWriter, sess *Session) {
	sig := s.sign(sess.ID)
	value := fmt.Sprintf("%s.%s", sess.ID, sig)

	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionMaxAge.Seconds()),
	})
}

func (s *SessionStore) GetFromCookie(r *http.Request) *Session {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return nil
	}

	parts := splitCookieValue(cookie.Value)
	if len(parts) != 2 {
		return nil
	}

	sessionID, sig := parts[0], parts[1]
	if !s.verify(sessionID, sig) {
		return nil
	}

	return s.Get(sessionID)
}

func (s *SessionStore) ClearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func (s *SessionStore) sign(sessionID string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(sessionID))
	return hex.EncodeToString(mac.Sum(nil))
}

func (s *SessionStore) verify(sessionID, sig string) bool {
	return hmac.Equal([]byte(s.sign(sessionID)), []byte(sig))
}

func splitCookieValue(val string) []string {
	for i := 0; i < len(val); i++ {
		if val[i] == '.' {
			return []string{val[:i], val[i+1:]}
		}
	}
	return nil
}

func (s *SessionStore) cleanup() {
	ticker := time.NewTicker(15 * time.Minute)
	for range ticker.C {
		now := time.Now()
		s.mu.Lock()
		for id, sess := range s.sessions {
			if now.After(sess.ExpiresAt) {
				delete(s.sessions, id)
			}
		}
		s.mu.Unlock()
	}
}
