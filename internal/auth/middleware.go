package auth

import (
	"context"
	"net/http"
)

type sessionKey string

const SessionCtxKey sessionKey = "session"

func (s *SessionStore) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess := s.GetFromCookie(r)
		if sess != nil {
			ctx := context.WithValue(r.Context(), SessionCtxKey, sess)
			r = r.WithContext(ctx)
		}
		next.ServeHTTP(w, r)
	})
}

func (s *SessionStore) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess := GetSession(r)
		if sess == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"authentication required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func GetSession(r *http.Request) *Session {
	sess, _ := r.Context().Value(SessionCtxKey).(*Session)
	return sess
}
