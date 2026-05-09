package middleware

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
)

type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
	MaxAge         int
}

func NewCORSFromEnv() *CORSConfig {
	origins := []string{"*"}
	if v := os.Getenv("CORS_ORIGINS"); v != "" {
		origins = strings.Split(v, ",")
	}

	return &CORSConfig{
		AllowedOrigins: origins,
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		MaxAge:         86400,
	}
}

func (c *CORSConfig) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			next.ServeHTTP(w, r)
			return
		}

		allowed := false
		for _, o := range c.AllowedOrigins {
			if o == "*" || o == origin {
				allowed = true
				break
			}
		}

		if !allowed {
			next.ServeHTTP(w, r)
			return
		}

		if origin == "" {
			origin = "*"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", strings.Join(c.AllowedMethods, ", "))
		w.Header().Set("Access-Control-Allow-Headers", strings.Join(c.AllowedHeaders, ", "))
		w.Header().Set("Access-Control-Max-Age", "86400")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type HealthChecker struct {
	checks []func(ctx context.Context) error
}

func NewHealthChecker() *HealthChecker {
	return &HealthChecker{}
}

func (h *HealthChecker) AddCheck(name string, check func(ctx context.Context) error) {
	h.checks = append(h.checks, check)
}

func (h *HealthChecker) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		for _, check := range h.checks {
			if err := check(r.Context()); err != nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				w.Write([]byte(`{"status":"unhealthy","error":"` + err.Error() + `"}`))
				return
			}
		}

		w.Write([]byte(`{"status":"healthy"}`))
	}
}

func GracefulShutdown(srv *http.Server) {
	log.Printf("[SERVER] Ready to accept connections")
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}
