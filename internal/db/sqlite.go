package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteDB struct {
	db *sql.DB
}

func NewSQLite(dbPath string) (*SQLiteDB, error) {
	dsn := fmt.Sprintf("file:%s?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=ON", dbPath)
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	s := &SQLiteDB{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("migrate sqlite: %w", err)
	}

	return s, nil
}

func (s *SQLiteDB) Close() error {
	return s.db.Close()
}

func (s *SQLiteDB) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

func (s *SQLiteDB) migrate() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			first_name TEXT NOT NULL DEFAULT '',
			last_name TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'student',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS courses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			category TEXT NOT NULL DEFAULT '',
			level TEXT NOT NULL DEFAULT 'Beginner',
			duration TEXT NOT NULL DEFAULT '',
			price REAL NOT NULL DEFAULT 0,
			rating REAL NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS enrollments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id),
			course_id INTEGER NOT NULL REFERENCES courses(id),
			progress INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, course_id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)`,
	}

	for _, m := range migrations {
		if _, err := s.db.Exec(m); err != nil {
			return fmt.Errorf("exec migration: %w\nSQL: %s", err, m)
		}
	}
	return nil
}

func (s *SQLiteDB) CreateUser(ctx context.Context, u *User) error {
	now := time.Now()
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, now, now,
	)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	u.ID = id
	u.CreatedAt = now
	u.UpdatedAt = now
	return nil
}

func (s *SQLiteDB) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE email = ?`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (s *SQLiteDB) GetUserByID(ctx context.Context, id int64) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE id = ?`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (s *SQLiteDB) UpdateUser(ctx context.Context, u *User) error {
	u.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE users SET first_name=?, last_name=?, role=?, updated_at=? WHERE id=?`,
		u.FirstName, u.LastName, u.Role, u.UpdatedAt, u.ID,
	)
	return err
}

func (s *SQLiteDB) CreateCourse(ctx context.Context, c *Course) error {
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO courses (title, description, category, level, duration, price, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		c.Title, c.Description, c.Category, c.Level, c.Duration, c.Price, c.Rating, time.Now(),
	)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	c.ID = id
	return nil
}

func (s *SQLiteDB) GetCourses(ctx context.Context, f CourseFilter) ([]Course, error) {
	query := `SELECT id, title, description, category, level, duration, price, rating, created_at FROM courses WHERE 1=1`
	args := []any{}

	if f.Category != "" {
		query += ` AND category = ?`
		args = append(args, f.Category)
	}
	if f.Level != "" {
		query += ` AND level = ?`
		args = append(args, f.Level)
	}
	if f.Search != "" {
		query += ` AND (title LIKE ? OR description LIKE ?)`
		q := "%" + strings.ToLower(f.Search) + "%"
		args = append(args, q, q)
	}

	query += ` ORDER BY created_at DESC`

	if f.PerPage > 0 {
		offset := (f.Page - 1) * f.PerPage
		query += fmt.Sprintf(` LIMIT %d OFFSET %d`, f.PerPage, offset)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []Course
	for rows.Next() {
		var c Course
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Level, &c.Duration, &c.Price, &c.Rating, &c.CreatedAt); err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}
	return courses, rows.Err()
}

func (s *SQLiteDB) GetCourseByID(ctx context.Context, id int64) (*Course, error) {
	c := &Course{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, title, description, category, level, duration, price, rating, created_at FROM courses WHERE id = ?`,
		id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Level, &c.Duration, &c.Price, &c.Rating, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (s *SQLiteDB) CreateEnrollment(ctx context.Context, e *Enrollment) error {
	now := time.Now()
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO enrollments (user_id, course_id, progress, created_at) VALUES (?, ?, ?, ?)`,
		e.UserID, e.CourseID, e.Progress, now,
	)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	e.ID = id
	e.CreatedAt = now
	return nil
}

func (s *SQLiteDB) GetEnrollmentsByUser(ctx context.Context, userID int64) ([]Enrollment, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, course_id, progress, created_at FROM enrollments WHERE user_id = ?`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []Enrollment
	for rows.Next() {
		var e Enrollment
		if err := rows.Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.CreatedAt); err != nil {
			return nil, err
		}
		enrollments = append(enrollments, e)
	}
	return enrollments, rows.Err()
}

func (s *SQLiteDB) UpdateEnrollmentProgress(ctx context.Context, userID, courseID int64, progress int) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?`,
		progress, userID, courseID,
	)
	return err
}
