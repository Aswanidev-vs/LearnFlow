package auth

import "net/http"

func Getuserfromcontext(r *http.Request) (*Userclaims, bool) {
	claims, ok := r.Context().Value(Usercontextkey).(*Userclaims)
	return claims, ok
}
