package handler

import (
	"net/http"
	"strconv"

	"github.com/Aswanidev-vs/learnflow/internal/db"
	"github.com/go-chi/chi/v5"
)

type MarketplaceHandler struct {
	DB db.Database
}

func NewMarketplaceHandler(database db.Database) *MarketplaceHandler {
	return &MarketplaceHandler{DB: database}
}

func (h *MarketplaceHandler) ListGigs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 {
		perPage = 12
	}

	filter := db.GigFilter{
		Search:  q.Get("search"),
		Budget:  q.Get("budget"),
		Status:  q.Get("status"),
		Page:    page,
		PerPage: perPage,
	}

	gigs, total, err := h.DB.GetGigs(r.Context(), filter)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch gigs"})
		return
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}
	if totalPages < 1 {
		totalPages = 1
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"gigs": gigs,
		"pagination": map[string]any{
			"page":       page,
			"totalPages": totalPages,
			"total":      total,
		},
	})
}

func (h *MarketplaceHandler) GetGig(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid gig ID"})
		return
	}

	gig, err := h.DB.GetGigByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch gig"})
		return
	}
	if gig == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Gig not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"gig": gig})
}
