package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
)

type AuthHandler struct {
	Sessions *auth.SessionStore
}

func NewAuthHandler(sessions *auth.SessionStore) *AuthHandler {
	return &AuthHandler{Sessions: sessions}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	if req.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Email is required"})
		return
	}
	if !emailRegex.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid email format"})
		return
	}
	if req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Password is required"})
		return
	}
	if len(req.Password) < 8 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Password must be at least 8 characters"})
		return
	}

	sess, err := h.Sessions.Create(0, req.Email, "Student", "", "student")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
		return
	}

	h.Sessions.SetCookie(w, sess)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Login successful", "email": req.Email})
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email           string `json:"email"`
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirmPassword"`
		FirstName       string `json:"firstName"`
		LastName        string `json:"lastName"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	if req.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Email is required"})
		return
	}
	if !emailRegex.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid email format"})
		return
	}
	if req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Password is required"})
		return
	}
	if valid, msg := isValidPassword(req.Password); !valid {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": msg})
		return
	}
	if req.ConfirmPassword != "" && req.Password != req.ConfirmPassword {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Passwords do not match"})
		return
	}

	sess, err := h.Sessions.Create(0, req.Email, req.FirstName, req.LastName, "student")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
		return
	}

	h.Sessions.SetCookie(w, sess)
	writeJSON(w, http.StatusCreated, map[string]string{"message": "Account created", "email": req.Email})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess != nil {
		h.Sessions.Delete(sess.ID)
	}
	h.Sessions.ClearCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Logged out"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Not authenticated"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"userId": sess.UserID, "email": sess.Email, "role": sess.Role})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
