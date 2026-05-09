package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type Validator struct {
	maxBodySize int64
}

func NewValidatorFromEnv() *Validator {
	maxBody := int64(1 << 20)
	if v := os.Getenv("MAX_BODY_SIZE_MB"); v != "" {
		var mb int
		if _, err := fmt.Sscanf(v, "%d", &mb); err == nil && mb > 0 {
			maxBody = int64(mb) << 20
		}
	}
	return &Validator{maxBodySize: maxBody}
}

func (v *Validator) LimitBody(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch {
			r.Body = http.MaxBytesReader(w, r.Body, v.maxBodySize)
		}
		next.ServeHTTP(w, r)
	})
}

func (v *Validator) ValidateJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch {
			ct := r.Header.Get("Content-Type")
			if ct != "" && !strings.HasPrefix(ct, "application/json") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnsupportedMediaType)
				json.NewEncoder(w).Encode(map[string]string{
					"error": fmt.Sprintf("Content-Type must be application/json, got %s", ct),
				})
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (v *Validator) SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		if r.TLS != nil {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		next.ServeHTTP(w, r)
	})
}

func (v *Validator) RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = fmt.Sprintf("%x", time.Now().UnixNano())
		}
		w.Header().Set("X-Request-ID", reqID)
		next.ServeHTTP(w, r)
	})
}
