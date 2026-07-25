package handler

import (
	"net/http"
	"strconv"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
	"github.com/go-chi/chi/v5"
)

type LessonHandler struct {
	DB db.Database
}

func NewLessonHandler(database db.Database) *LessonHandler {
	return &LessonHandler{DB: database}
}

func (h *LessonHandler) GetLesson(w http.ResponseWriter, r *http.Request) {
	courseIDStr := chi.URLParam(r, "courseId")
	lessonIDStr := chi.URLParam(r, "lessonId")

	courseID, err := strconv.ParseInt(courseIDStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid course ID"})
		return
	}

	lessonID, err := strconv.ParseInt(lessonIDStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid lesson ID"})
		return
	}

	var userID int64
	if sess := auth.GetSession(r); sess != nil {
		userID = sess.UserID
	}

	course, modules, err := h.DB.GetCourseWithModules(r.Context(), courseID, userID)
	if err != nil || course == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Course not found"})
		return
	}

	for _, mod := range modules {
		for _, les := range mod.Lessons {
			if les.ID == lessonID {
				writeJSON(w, http.StatusOK, map[string]any{
					"lesson": map[string]any{
						"id":        les.ID,
						"moduleId":  les.ModuleID,
						"title":     les.Title,
						"type":      les.Type,
						"content":   les.Content,
						"duration":  les.Duration,
						"completed": les.Completed,
						"courseId":  courseID,
						"moduleName": mod.Title,
					},
				})
				return
			}
		}
	}

	writeJSON(w, http.StatusNotFound, map[string]string{"error": "Lesson not found"})
}

func (h *LessonHandler) CompleteLesson(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	courseIDStr := chi.URLParam(r, "courseId")
	lessonIDStr := chi.URLParam(r, "lessonId")

	courseID, err := strconv.ParseInt(courseIDStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid course ID"})
		return
	}

	lessonID, err := strconv.ParseInt(lessonIDStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid lesson ID"})
		return
	}

	enrolled, _ := h.DB.IsEnrolled(r.Context(), sess.UserID, courseID)
	if !enrolled {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Not enrolled in this course"})
		return
	}

	if err := h.DB.MarkLessonComplete(r.Context(), sess.UserID, lessonID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to mark lesson complete"})
		return
	}

	_, modules, _ := h.DB.GetCourseWithModules(r.Context(), courseID, sess.UserID)
	totalLessons := 0
	completedLessons := 0
	for _, mod := range modules {
		for _, les := range mod.Lessons {
			totalLessons++
			if les.Completed {
				completedLessons++
			}
		}
	}
	progress := 0
	if totalLessons > 0 {
		progress = (completedLessons * 100) / totalLessons
	}
	h.DB.UpdateEnrollmentProgress(r.Context(), sess.UserID, courseID, progress)

	writeJSON(w, http.StatusOK, map[string]any{"success": true, "progress": progress})
}
