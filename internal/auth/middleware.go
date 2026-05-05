package auth

import (
	"context"
	"net/http"
	"strings"
)

type conextkey string

const Usercontextkey conextkey = "user"

func (j *JWTservie) AuthMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authheader := r.Header.Get("Authorization")
		if authheader == "" {
			http.Error(w, "missing Authorization header", http.StatusUnauthorized)
			return
		}
		parts := strings.Split(authheader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "invalid Authorization header", http.StatusUnauthorized)
			return
		}
		token := parts[1]
		user, err := j.ValidateToken(token)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), Usercontextkey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
