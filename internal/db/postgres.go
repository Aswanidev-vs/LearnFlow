package db

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresDB struct {
	pool *pgxpool.Pool
}

func NewPostgres(ctx context.Context, connString string) (*PostgresDB, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("parse conn string: %w", err)
	}

	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = time.Minute * 30

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	p := &PostgresDB{pool: pool}
	if err := p.migrate(ctx); err != nil {
		return nil, fmt.Errorf("migrate postgres: %w", err)
	}

	return p, nil
}

func (p *PostgresDB) Close() error {
	p.pool.Close()
	return nil
}

func (p *PostgresDB) Ping(ctx context.Context) error {
	return p.pool.Ping(ctx)
}

func (p *PostgresDB) migrate(ctx context.Context) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id BIGSERIAL PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			first_name TEXT NOT NULL DEFAULT '',
			last_name TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'student',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS courses (
			id BIGSERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			category TEXT NOT NULL DEFAULT '',
			level TEXT NOT NULL DEFAULT 'Beginner',
			duration TEXT NOT NULL DEFAULT '',
			price NUMERIC(10,2) NOT NULL DEFAULT 0,
			rating NUMERIC(3,2) NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS enrollments (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL REFERENCES users(id),
			course_id BIGINT NOT NULL REFERENCES courses(id),
			progress INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(user_id, course_id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)`,
	}

	for _, m := range migrations {
		if _, err := p.pool.Exec(ctx, m); err != nil {
			return fmt.Errorf("exec migration: %w\nSQL: %s", err, m)
		}
	}
	return nil
}

func (p *PostgresDB) CreateUser(ctx context.Context, u *User) error {
	now := time.Now()
	err := p.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, now, now,
	).Scan(&u.ID)
	if err != nil {
		return err
	}
	u.CreatedAt = now
	u.UpdatedAt = now
	return nil
}

func (p *PostgresDB) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	u := &User{}
	err := p.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (p *PostgresDB) GetUserByID(ctx context.Context, id int64) (*User, error) {
	u := &User{}
	err := p.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (p *PostgresDB) UpdateUser(ctx context.Context, u *User) error {
	u.UpdatedAt = time.Now()
	_, err := p.pool.Exec(ctx,
		`UPDATE users SET first_name=$1, last_name=$2, role=$3, updated_at=$4 WHERE id=$5`,
		u.FirstName, u.LastName, u.Role, u.UpdatedAt, u.ID,
	)
	return err
}

func (p *PostgresDB) CreateCourse(ctx context.Context, c *Course) error {
	err := p.pool.QueryRow(ctx,
		`INSERT INTO courses (title, description, category, level, duration, price, rating, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
		c.Title, c.Description, c.Category, c.Level, c.Duration, c.Price, c.Rating, time.Now(),
	).Scan(&c.ID)
	return err
}

func (p *PostgresDB) GetCourses(ctx context.Context, f CourseFilter) ([]Course, error) {
	query := `SELECT id, title, description, category, level, duration, price, rating, created_at FROM courses WHERE 1=1`
	args := []any{}
	argIdx := 1

	if f.Category != "" {
		query += fmt.Sprintf(` AND category = $%d`, argIdx)
		args = append(args, f.Category)
		argIdx++
	}
	if f.Level != "" {
		query += fmt.Sprintf(` AND level = $%d`, argIdx)
		args = append(args, f.Level)
		argIdx++
	}
	if f.Search != "" {
		query += fmt.Sprintf(` AND (LOWER(title) LIKE $%d OR LOWER(description) LIKE $%d)`, argIdx, argIdx+1)
		q := "%" + strings.ToLower(f.Search) + "%"
		args = append(args, q, q)
		argIdx += 2
	}

	query += ` ORDER BY created_at DESC`

	if f.PerPage > 0 {
		offset := (f.Page - 1) * f.PerPage
		query += fmt.Sprintf(` LIMIT %d OFFSET %d`, f.PerPage, offset)
	}

	rows, err := p.pool.Query(ctx, query, args...)
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

func (p *PostgresDB) GetCourseByID(ctx context.Context, id int64) (*Course, error) {
	c := &Course{}
	err := p.pool.QueryRow(ctx,
		`SELECT id, title, description, category, level, duration, price, rating, created_at FROM courses WHERE id = $1`,
		id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Level, &c.Duration, &c.Price, &c.Rating, &c.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (p *PostgresDB) CreateEnrollment(ctx context.Context, e *Enrollment) error {
	now := time.Now()
	err := p.pool.QueryRow(ctx,
		`INSERT INTO enrollments (user_id, course_id, progress, created_at) VALUES ($1, $2, $3, $4) RETURNING id`,
		e.UserID, e.CourseID, e.Progress, now,
	).Scan(&e.ID)
	if err != nil {
		return err
	}
	e.CreatedAt = now
	return nil
}

func (p *PostgresDB) GetEnrollmentsByUser(ctx context.Context, userID int64) ([]Enrollment, error) {
	rows, err := p.pool.Query(ctx,
		`SELECT id, user_id, course_id, progress, created_at FROM enrollments WHERE user_id = $1`,
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

func (p *PostgresDB) UpdateEnrollmentProgress(ctx context.Context, userID, courseID int64, progress int) error {
	_, err := p.pool.Exec(ctx,
		`UPDATE enrollments SET progress = $1 WHERE user_id = $2 AND course_id = $3`,
		progress, userID, courseID,
	)
	return err
}
