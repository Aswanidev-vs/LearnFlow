package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/db"
	"github.com/Aswanidev-vs/learnflow/internal/handler"
	"github.com/Aswanidev-vs/learnflow/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
	rootDir := findProjectRoot()
	ctx := context.Background()

	database, err := db.NewFromEnv(ctx, rootDir)
	if err != nil {
		log.Fatalf("[DB] Failed to initialize database: %v", err)
	}
	defer database.Close()

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		sessionSecret = "dev-session-secret-change-in-prod"
		log.Printf("[WARN] Using default session secret. Set SESSION_SECRET env var in production.")
	}

	sessions := auth.NewSessionStore(sessionSecret)
	authHandler := handler.NewAuthHandler(sessions, database)
	resetHandler := handler.NewResetHandler(database)
	courseHandler := handler.NewCourseHandler(database)
	lessonHandler := handler.NewLessonHandler(database)
	assessmentHandler := handler.NewAssessmentHandler(database)
	marketplaceHandler := handler.NewMarketplaceHandler(database)
	certificateHandler := handler.NewCertificateHandler(database)
	profileHandler := handler.NewProfileHandler(database)
	dashboardHandler := handler.NewDashboardHandler(database)
	chatHandler := handler.NewChatHandler()

	rateLimiter := middleware.NewRateLimiterFromEnv()
	validator := middleware.NewValidatorFromEnv()
	corsConfig := middleware.NewCORSFromEnv()

	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Compress(5))
	r.Use(validator.RequestID)
	r.Use(validator.SecurityHeaders)
	r.Use(corsConfig.Middleware)
	r.Use(validator.LimitBody)
	r.Use(sessions.Middleware)

	staticDir := filepath.Join(rootDir, "web", "static")
	indexFile := filepath.Join(rootDir, "index.html")

	// Auth routes
	r.Route("/auth", func(r chi.Router) {
		r.Use(rateLimiter.Middleware)
		r.Use(validator.ValidateJSON)
		r.Post("/login", authHandler.Login)
		r.Post("/logout", authHandler.Logout)
		r.Get("/me", authHandler.Me)
		r.Post("/signup", authHandler.Signup)
		r.Post("/reset-password", resetHandler.ResetPassword)
		r.Post("/reset-password/confirm", resetHandler.ResetPasswordConfirm)
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(rateLimiter.Middleware)

		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			if err := database.Ping(r.Context()); err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusServiceUnavailable)
				w.Write([]byte(`{"status":"unhealthy","database":"` + err.Error() + `"}`))
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"ok","service":"learnflow","database":"healthy"}`))
		})

		// Public course listing and marketplace browsing
		r.Group(func(r chi.Router) {
			r.Get("/courses", courseHandler.ListCourses)
			r.Get("/marketplace/gigs", marketplaceHandler.ListGigs)
			r.Get("/marketplace/gigs/{id}", marketplaceHandler.GetGig)
		})

		// Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(sessions.RequireAuth)
			r.Use(validator.ValidateJSON)

			// Dashboard
			r.Get("/dashboard", dashboardHandler.GetDashboard)

			// Courses
			r.Get("/courses/{id}", courseHandler.GetCourse)
			r.Post("/courses/{id}/enroll", courseHandler.EnrollCourse)

			// Lessons
			r.Get("/courses/{courseId}/lessons/{lessonId}", lessonHandler.GetLesson)
			r.Post("/courses/{courseId}/lessons/{lessonId}/complete", lessonHandler.CompleteLesson)

			// Assessments
			r.Get("/assessments", assessmentHandler.ListAssessments)
			r.Get("/assessments/{id}", assessmentHandler.GetAssessment)
			r.Post("/assessments/{id}/submit", assessmentHandler.SubmitAssessment)

			// Profile
			r.Get("/profile", profileHandler.GetProfile)
			r.Put("/profile", profileHandler.UpdateProfile)

			// Certificates
			r.Get("/certificates", certificateHandler.ListCertificates)

			// AI Chat
			r.Post("/ai/chat", chatHandler.SendMessage)
		})

		// Certificate download (public for preview)
		r.Get("/certificates/{id}/download", handler.DownloadCertificate)
	})

	fileServer(r, "/static", http.Dir(staticDir))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, indexFile)
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/auth/") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error":"not found"}`))
			return
		}
		http.ServeFile(w, r, indexFile)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[SERVER] LearnFlow starting on http://localhost:%s", port)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("[SERVER] Error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Printf("[SERVER] Shutting down gracefully...")
	sessions.Stop()
	shutdownCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[SERVER] Forced shutdown: %v", err)
	}
	log.Printf("[SERVER] Stopped")
}

func findProjectRoot() string {
	dir, _ := os.Getwd()
	for {
		if fileExists(filepath.Join(dir, "go.mod")) && fileExists(filepath.Join(dir, "index.html")) {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	fallback, _ := os.Getwd()
	log.Printf("[WARN] Could not find project root, using: %s", fallback)
	return fallback
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func fileServer(r chi.Router, path string, root http.FileSystem) {
	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		if strings.HasSuffix(r.URL.Path, ".js") || strings.HasSuffix(r.URL.Path, ".css") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}
