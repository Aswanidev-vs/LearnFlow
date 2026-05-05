package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Aswanidev-vs/learnflow/internal/handler"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	rootDir := findProjectRoot()
	staticDir := filepath.Join(rootDir, "web", "static")
	indexFile := filepath.Join(rootDir, "index.html")

	log.Printf("[DEBUG] rootDir=%s", rootDir)
	log.Printf("[DEBUG] indexFile=%s exists=%v", indexFile, fileExists(indexFile))
	log.Printf("[DEBUG] staticDir=%s exists=%v", staticDir, fileExists(staticDir))

	r.Route("/auth", func(r chi.Router) {
		r.Post("/signup", handler.Signuphandler)
		r.Post("/login", handler.LoginHandler)
		r.Post("/reset-password", handler.ResetPasswordHandler)
		r.Post("/reset-password/confirm", handler.ResetPasswordConfirmHandler)
	})

	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"learnflow"}`))
	})

	FileServer(r, "/static", http.Dir(staticDir))

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
		port = "3000"
	}

	log.Printf("LearnFlow server starting on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
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

func FileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny("{}*", path) {
		panic("FileServer does not permit URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}
