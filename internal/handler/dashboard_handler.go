package handler

import (
	"net/http"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
)

type DashboardHandler struct {
	DB db.Database
}

func NewDashboardHandler(database db.Database) *DashboardHandler {
	return &DashboardHandler{DB: database}
}

func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	data, err := h.DB.GetDashboardData(r.Context(), sess.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch dashboard data"})
		return
	}

	writeJSON(w, http.StatusOK, data)
}
