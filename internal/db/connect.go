package db

import (
	"context"
	"fmt"
	"log"
	"os"
)

type Config struct {
	Driver   string
	Postgres string
	SQLite   string
}

func New(ctx context.Context, cfg Config) (Database, error) {
	switch cfg.Driver {
	case "postgres":
		connStr := cfg.Postgres
		if connStr == "" {
			connStr = "postgres://postgres:postgres@localhost:5432/learnflow?sslmode=disable"
		}
		log.Printf("[DB] Connecting to PostgreSQL...")
		return NewPostgres(ctx, connStr)
	default:
		dbPath := cfg.SQLite
		if dbPath == "" {
			dbPath = "learnflow.db"
		}
		log.Printf("[DB] Using SQLite (%s)", dbPath)
		return NewSQLite(dbPath)
	}
}

func NewFromEnv(ctx context.Context, projectRoot string) (Database, error) {
	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		driver = "sqlite"
	}

	cfg := Config{
		Driver:   driver,
		Postgres: os.Getenv("DATABASE_URL"),
		SQLite:   fmt.Sprintf("%s%c%s", projectRoot, os.PathSeparator, "learnflow.db"),
	}

	if envPath := os.Getenv("SQLITE_PATH"); envPath != "" {
		cfg.SQLite = envPath
	}

	return New(ctx, cfg)
}
