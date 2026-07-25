package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
)

type ProfileHandler struct {
	DB db.Database
}

func NewProfileHandler(database db.Database) *ProfileHandler {
	return &ProfileHandler{DB: database}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	user, err := h.DB.GetUserByID(r.Context(), sess.UserID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "User not found"})
		return
	}

	social := map[string]string{}
	if user.GitHub != "" {
		social["github"] = "https://github.com/" + user.GitHub
	}
	if user.Website != "" {
		social["linkedin"] = user.Website
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":        user.ID,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"email":     user.Email,
		"bio":       user.Bio,
		"location":  user.Location,
		"website":   user.Website,
		"github":    user.GitHub,
		"skills":    user.Skills,
		"role":      user.Role,
		"joinedAt":  user.CreatedAt,
		"imageUrl":  user.ImageURL,
		"social":    social,
	})
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	var req struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Bio       string `json:"bio"`
		Location  string `json:"location"`
		Website   string `json:"website"`
		GitHub    string `json:"github"`
		Skills    string `json:"skills"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	user, err := h.DB.GetUserByID(r.Context(), sess.UserID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "User not found"})
		return
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	user.Bio = req.Bio
	user.Location = req.Location
	user.Website = req.Website
	user.GitHub = req.GitHub
	user.Skills = req.Skills

	if err := h.DB.UpdateUser(r.Context(), user); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to update profile"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Profile updated"})
}
