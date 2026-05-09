package middleware

import (
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     int
	burst    int
	window   time.Duration
}

type visitor struct {
	tokens   int
	lastSeen time.Time
}

func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     requestsPerMinute,
		burst:    requestsPerMinute * 2,
		window:   time.Minute,
	}
	go rl.cleanup()
	return rl
}

func NewRateLimiterFromEnv() *RateLimiter {
	rate := 60
	if v := os.Getenv("RATE_LIMIT_RPM"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			rate = n
		}
	}
	return NewRateLimiter(rate)
}

func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		rl.visitors[ip] = &visitor{tokens: rl.rate - 1, lastSeen: time.Now()}
		return true
	}

	elapsed := time.Since(v.lastSeen)
	tokensToAdd := int(elapsed.Seconds()) * rl.rate / int(rl.window.Seconds())
	v.tokens += tokensToAdd
	if v.tokens > rl.burst {
		v.tokens = rl.burst
	}
	v.lastSeen = time.Now()

	if v.tokens <= 0 {
		return false
	}
	v.tokens--
	return true
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastSeen) > 10*time.Minute {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)

		if !rl.Allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"rate limit exceeded","retryAfter":60}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}

func getIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	return host
}
