package auth

import "net/http"

func GetUserFromContext(r *http.Request) (*Session, bool) {
	sess, ok := r.Context().Value(SessionCtxKey).(*Session)
	return sess, ok
}
