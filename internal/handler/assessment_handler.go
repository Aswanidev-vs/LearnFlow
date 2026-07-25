package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
	"github.com/go-chi/chi/v5"
)

type AssessmentHandler struct {
	DB db.Database
}

func NewAssessmentHandler(database db.Database) *AssessmentHandler {
	return &AssessmentHandler{DB: database}
}

func (h *AssessmentHandler) ListAssessments(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	assessments, err := h.DB.GetAssessments(r.Context(), sess.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch assessments"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"assessments": assessments})
}

func (h *AssessmentHandler) GetAssessment(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid assessment ID"})
		return
	}

	assessment, err := h.DB.GetAssessmentByID(r.Context(), id, sess.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch assessment"})
		return
	}
	if assessment == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Assessment not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"assessment": assessment})
}

func (h *AssessmentHandler) SubmitAssessment(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	idStr := chi.URLParam(r, "id")
	assessmentID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid assessment ID"})
		return
	}

	var req struct {
		GitHubURL string `json:"githubUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	if req.GitHubURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "GitHub URL is required"})
		return
	}

	assessment, err := h.DB.GetAssessmentByID(r.Context(), assessmentID, sess.UserID)
	if err != nil || assessment == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Assessment not found"})
		return
	}

	sub := &db.AssessmentSubmission{
		AssessmentID: assessmentID,
		UserID:       sess.UserID,
		GitHubURL:    req.GitHubURL,
	}
	if err := h.DB.SubmitAssessment(r.Context(), sub); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to submit assessment"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Assessment submitted for review"})
}
