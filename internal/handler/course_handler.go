package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
	"github.com/go-chi/chi/v5"
)

type CourseHandler struct {
	DB db.Database
}

func NewCourseHandler(database db.Database) *CourseHandler {
	return &CourseHandler{DB: database}
}

func (h *CourseHandler) ListCourses(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 {
		perPage = 12
	}

	filter := db.CourseFilter{
		Category: q.Get("category"),
		Level:    q.Get("level"),
		Search:   q.Get("search"),
		Page:     page,
		PerPage:  perPage,
	}

	courses, total, err := h.DB.GetCourses(r.Context(), filter)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch courses"})
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
		"courses": courses,
		"pagination": map[string]any{
			"page":       page,
			"totalPages": totalPages,
			"total":      total,
		},
	})
}

func (h *CourseHandler) GetCourse(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid course ID"})
		return
	}

	var userID int64
	if sess := auth.GetSession(r); sess != nil {
		userID = sess.UserID
	}

	course, modules, err := h.DB.GetCourseWithModules(r.Context(), id, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch course"})
		return
	}
	if course == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Course not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"course": map[string]any{
			"id":             course.ID,
			"title":          course.Title,
			"description":    course.Description,
			"category":       course.Category,
			"level":          course.Level,
			"duration":       course.Duration,
			"price":          course.Price,
			"rating":         course.Rating,
			"thumbnail":      course.Thumbnail,
			"instructorName": course.InstructorName,
			"lessonsCount":   course.LessonsCount,
			"studentsCount":  course.StudentsCount,
			"tags":           course.Tags,
			"enrolled":       course.Enrolled,
			"progress":       course.Progress,
			"modules":        modules,
		},
	})
}

func (h *CourseHandler) EnrollCourse(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	idStr := chi.URLParam(r, "id")
	courseID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid course ID"})
		return
	}

	course, err := h.DB.GetCourseByID(r.Context(), courseID)
	if err != nil || course == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Course not found"})
		return
	}

	enrolled, _ := h.DB.IsEnrolled(r.Context(), sess.UserID, courseID)
	if enrolled {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "Already enrolled"})
		return
	}

	enrollment := &db.Enrollment{UserID: sess.UserID, CourseID: courseID}
	if err := h.DB.CreateEnrollment(r.Context(), enrollment); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to enroll"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Enrolled successfully"})
}

func (h *CourseHandler) parseJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return false
	}
	return true
}
