package handler

import (
	"net/http"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
)

type CertificateHandler struct {
	DB db.Database
}

func NewCertificateHandler(database db.Database) *CertificateHandler {
	return &CertificateHandler{DB: database}
}

func (h *CertificateHandler) ListCertificates(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	certs, err := h.DB.GetCertificates(r.Context(), sess.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch certificates"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"certificates": certs})
}
