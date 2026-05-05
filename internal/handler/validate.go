package handler

import "regexp"

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func isValidPassword(pw string) (bool, string) {
	if len(pw) < 8 {
		return false, "Password must be at least 8 characters"
	}
	if len(pw) > 72 {
		return false, "Password must be at most 72 characters"
	}
	if !regexp.MustCompile(`[A-Z]`).MatchString(pw) {
		return false, "Password must contain at least one uppercase letter"
	}
	if !regexp.MustCompile(`[a-z]`).MatchString(pw) {
		return false, "Password must contain at least one lowercase letter"
	}
	if !regexp.MustCompile(`[0-9]`).MatchString(pw) {
		return false, "Password must contain at least one number"
	}
	if !regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(pw) {
		return false, "Password must contain at least one special character"
	}
	return true, ""
}
