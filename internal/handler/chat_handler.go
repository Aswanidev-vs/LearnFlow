package handler

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strings"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
)

type ChatHandler struct{}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	sess := auth.GetSession(r)
	if sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		return
	}

	var req struct {
		Message        string `json:"message"`
		ConversationID string `json:"conversationId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	if req.Message == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Message is required"})
		return
	}

	convID := req.ConversationID
	if convID == "" {
		convID = "conv-" + sess.Email
	}

	response := generateResponse(req.Message)

	writeJSON(w, http.StatusOK, map[string]any{
		"content":        response,
		"conversationId": convID,
	})
}

var responses = []struct {
	keywords []string
	response string
}{
	{
		[]string{"goroutine", "concurrency", "channel", "parallel"},
		"Great question about Go concurrency! Goroutines are lightweight threads managed by the Go runtime. They're much cheaper than OS threads — you can spawn thousands of them. Channels provide type-safe communication between goroutines. The key pattern is: `go func()` to launch a goroutine, and `ch <- value` / `value := <-ch` to send/receive on channels. Always remember to handle goroutine lifecycle to avoid leaks.",
	},
	{
		[]string{"interface", "struct", "type", "method"},
		"In Go, interfaces are satisfied implicitly — if a type implements all methods of an interface, it automatically satisfies it. This is fundamentally different from explicit `implements` in Java/C#. Start with small interfaces (1-2 methods), and compose them. The `io.Reader` and `io.Writer` interfaces are great examples of this philosophy.",
	},
	{
		[]string{"test", "testing", "tdd", "unit test"},
		"Go has excellent built-in testing support. Use table-driven tests with subtests for comprehensive coverage:\n\n```go\nfunc TestAdd(t *testing.T) {\n  tests := []struct{\n    name string\n    a, b, want int\n  }{\n    {\"positive\", 1, 2, 3},\n    {\"zero\", 0, 0, 0},\n  }\n  for _, tt := range tests {\n    t.Run(tt.name, func(t *testing.T) {\n      got := Add(tt.a, tt.b)\n      if got != tt.want {\n        t.Errorf(\"got %d, want %d\", got, tt.want)\n      }\n    })\n  }\n}\n```\n\nRun with `go test -v -cover ./...` to see coverage.",
	},
	{
		[]string{"react", "component", "hook", "state"},
		"React 19 introduces powerful new patterns. Server Components run on the server and can directly access your database. Actions handle form submissions with built-in pending states via `useActionState`. The key rule: use Server Components by default, add `'use client'` only when you need interactivity (event handlers, hooks, browser APIs). This dramatically reduces client-side JavaScript.",
	},
	{
		[]string{"error", "error handling", "panic", "recover"},
		"Go's error handling is explicit and idiomatic. The pattern is:\n\n```go\nresult, err := doSomething()\nif err != nil {\n  return fmt.Errorf(\"doSomething failed: %w\", err)\n}\n```\n\nUse `%w` for error wrapping (Go 1.13+) to preserve the error chain. Only use `panic` for truly unrecoverable situations. In production code, prefer returning errors over panicking.",
	},
	{
		[]string{"database", "sql", "query", "postgres", "sqlite"},
		"When working with databases in Go, always use `context.Context` for timeouts and cancellation. Use `QueryRowContext` for single rows, `QueryContext` for multiple rows. Always `defer rows.Close()` after queries. Check `sql.ErrNoRows` specifically — it's not an error, it means no results. For production, use connection pooling (pgxpool for PostgreSQL) and parameterized queries to prevent SQL injection.",
	},
	{
		[]string{"deploy", "docker", "ci/cd", "production"},
		"For production deployment:\n\n1. **Docker**: Use multi-stage builds to keep images small\n2. **CI/CD**: GitHub Actions with matrix testing across Go versions\n3. **Health checks**: Always implement `/health` endpoint\n4. **Graceful shutdown**: Handle SIGTERM, drain connections\n5. **Environment**: Use env vars for config, never hardcode secrets\n6. **Monitoring**: Structured logging + Prometheus metrics",
	},
	{
		[]string{"help", "stuck", "confused", "don't understand"},
		"I'm here to help! Could you tell me which specific concept or topic you're struggling with? I can break it down step by step, provide code examples, or point you to the relevant lesson in your course. Learning programming is about building understanding piece by piece — there are no stupid questions.",
	},
}

func generateResponse(message string) string {
	lower := strings.ToLower(message)

	for _, r := range responses {
		for _, kw := range r.keywords {
			if strings.Contains(lower, kw) {
				return r.response
			}
		}
	}

	defaults := []string{
		"That's an interesting question! Let me think about this... Based on your current course progress, I'd recommend reviewing the relevant lesson materials and trying a hands-on approach. Break the problem into smaller pieces, implement each one, and test as you go. Would you like me to explain a specific concept in more detail?",
		"Good question! Here's my recommendation: start by understanding the fundamentals, then practice with small exercises. The key to mastering any programming concept is repetition and building muscle memory. Try implementing a simple version first, then iterate to add complexity.",
		"I'd suggest approaching this systematically. First, make sure you understand the prerequisite concepts. Then, write pseudocode for your solution before implementing it. This helps catch logical errors early. If you're stuck on a specific part, share the code you have so far and I can help debug it.",
		"Great topic to explore! I recommend starting with the official documentation and then building a small proof-of-concept. Hands-on practice is the best way to solidify your understanding. If you run into specific errors along the way, share them and I'll help you troubleshoot.",
	}
	return defaults[rand.Intn(len(defaults))]
}
