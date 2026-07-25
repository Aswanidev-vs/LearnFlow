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
			bio TEXT NOT NULL DEFAULT '',
			location TEXT NOT NULL DEFAULT '',
			website TEXT NOT NULL DEFAULT '',
			github TEXT NOT NULL DEFAULT '',
			skills TEXT NOT NULL DEFAULT '',
			image_url TEXT NOT NULL DEFAULT '',
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
			thumbnail TEXT NOT NULL DEFAULT '',
			instructor_name TEXT NOT NULL DEFAULT '',
			lessons_count INTEGER NOT NULL DEFAULT 0,
			students_count INTEGER NOT NULL DEFAULT 0,
			tags TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS modules (
			id BIGSERIAL PRIMARY KEY,
			course_id BIGINT NOT NULL REFERENCES courses(id),
			title TEXT NOT NULL,
			"order" INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS lessons (
			id BIGSERIAL PRIMARY KEY,
			module_id BIGINT NOT NULL REFERENCES modules(id),
			title TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'video',
			content TEXT NOT NULL DEFAULT '',
			duration INTEGER NOT NULL DEFAULT 0,
			"order" INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS enrollments (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL REFERENCES users(id),
			course_id BIGINT NOT NULL REFERENCES courses(id),
			progress INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(user_id, course_id)
		)`,
		`CREATE TABLE IF NOT EXISTS lesson_completions (
			user_id BIGINT NOT NULL REFERENCES users(id),
			lesson_id BIGINT NOT NULL REFERENCES lessons(id),
			completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (user_id, lesson_id)
		)`,
		`CREATE TABLE IF NOT EXISTS assessments (
			id BIGSERIAL PRIMARY KEY,
			course_id BIGINT NOT NULL REFERENCES courses(id),
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			type TEXT NOT NULL DEFAULT 'project',
			max_score INTEGER NOT NULL DEFAULT 100
		)`,
		`CREATE TABLE IF NOT EXISTS assessment_submissions (
			id BIGSERIAL PRIMARY KEY,
			assessment_id BIGINT NOT NULL REFERENCES assessments(id),
			user_id BIGINT NOT NULL REFERENCES users(id),
			github_url TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'pending',
			score INTEGER NOT NULL DEFAULT 0,
			feedback TEXT NOT NULL DEFAULT '',
			submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS certificates (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL REFERENCES users(id),
			course_id BIGINT NOT NULL REFERENCES courses(id),
			issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			cert_type TEXT NOT NULL DEFAULT 'course'
		)`,
		`CREATE TABLE IF NOT EXISTS gigs (
			id BIGSERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			client_name TEXT NOT NULL DEFAULT '',
			budget TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'open',
			skills TEXT NOT NULL DEFAULT '',
			duration TEXT NOT NULL DEFAULT '',
			proposals INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)`,
		`CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id)`,
		`CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id)`,
		`CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id)`,
		`CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id)`,
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
		`INSERT INTO users (email, password_hash, first_name, last_name, role, bio, location, website, github, skills, image_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
		u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, u.Bio, u.Location, u.Website, u.GitHub, u.Skills, u.ImageURL, now, now,
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
		`SELECT id, email, password_hash, first_name, last_name, role, bio, location, website, github, skills, image_url, created_at, updated_at FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.Bio, &u.Location, &u.Website, &u.GitHub, &u.Skills, &u.ImageURL, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (p *PostgresDB) GetUserByID(ctx context.Context, id int64) (*User, error) {
	u := &User{}
	err := p.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, first_name, last_name, role, bio, location, website, github, skills, image_url, created_at, updated_at FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.Bio, &u.Location, &u.Website, &u.GitHub, &u.Skills, &u.ImageURL, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (p *PostgresDB) UpdateUser(ctx context.Context, u *User) error {
	u.UpdatedAt = time.Now()
	_, err := p.pool.Exec(ctx,
		`UPDATE users SET first_name=$1, last_name=$2, role=$3, bio=$4, location=$5, website=$6, github=$7, skills=$8, image_url=$9, updated_at=$10 WHERE id=$11`,
		u.FirstName, u.LastName, u.Role, u.Bio, u.Location, u.Website, u.GitHub, u.Skills, u.ImageURL, u.UpdatedAt, u.ID,
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

func (p *PostgresDB) GetCourses(ctx context.Context, f CourseFilter) ([]Course, int, error) {
	countQuery := `SELECT COUNT(*) FROM courses WHERE 1=1`
	query := `SELECT id, title, description, category, level, duration, price, rating, created_at FROM courses WHERE 1=1`
	args := []any{}
	argIdx := 1

	if f.Category != "" {
		countQuery += fmt.Sprintf(` AND category = $%d`, argIdx)
		query += fmt.Sprintf(` AND category = $%d`, argIdx)
		args = append(args, f.Category)
		argIdx++
	}
	if f.Level != "" {
		countQuery += fmt.Sprintf(` AND level = $%d`, argIdx)
		query += fmt.Sprintf(` AND level = $%d`, argIdx)
		args = append(args, f.Level)
		argIdx++
	}
	if f.Search != "" {
		countQuery += fmt.Sprintf(` AND (LOWER(title) LIKE $%d OR LOWER(description) LIKE $%d)`, argIdx, argIdx)
		query += fmt.Sprintf(` AND (LOWER(title) LIKE $%d OR LOWER(description) LIKE $%d)`, argIdx, argIdx)
		q := "%" + strings.ToLower(f.Search) + "%"
		args = append(args, q)
		argIdx++
	}

	var total int
	p.pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	query += ` ORDER BY created_at DESC`

	if f.PerPage > 0 {
		offset := (f.Page - 1) * f.PerPage
		query += fmt.Sprintf(` LIMIT %d OFFSET %d`, f.PerPage, offset)
	}

	rows, err := p.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var courses []Course
	for rows.Next() {
		var c Course
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Level, &c.Duration, &c.Price, &c.Rating, &c.CreatedAt); err != nil {
			return nil, 0, err
		}
		courses = append(courses, c)
	}
	return courses, total, rows.Err()
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

func (p *PostgresDB) IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error) {
	var count int
	err := p.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND course_id = $2`,
		userID, courseID,
	).Scan(&count)
	return count > 0, err
}

func (p *PostgresDB) GetCourseWithModules(ctx context.Context, courseID, userID int64) (*CourseDetail, []Module, error) {
	course, err := p.GetCourseByID(ctx, courseID)
	if err != nil || course == nil {
		return nil, nil, err
	}

	detail := &CourseDetail{Course: *course}

	if userID > 0 {
		enrolled, _ := p.IsEnrolled(ctx, userID, courseID)
		detail.Enrolled = enrolled
		if enrolled {
			var progress int
			p.pool.QueryRow(ctx,
				`SELECT progress FROM enrollments WHERE user_id = $1 AND course_id = $2`,
				userID, courseID,
			).Scan(&progress)
			detail.Progress = progress
		}
	}

	rows, err := p.pool.Query(ctx,
		`SELECT id, course_id, title, "order" FROM modules WHERE course_id = $1 ORDER BY "order"`,
		courseID,
	)
	if err != nil {
		return detail, nil, nil
	}
	defer rows.Close()

	var modules []Module
	for rows.Next() {
		var m Module
		if err := rows.Scan(&m.ID, &m.CourseID, &m.Title, &m.Order); err != nil {
			continue
		}
		m.Lessons = []Lesson{}
		modules = append(modules, m)
	}

	for i := range modules {
		lessonRows, err := p.pool.Query(ctx,
			`SELECT id, module_id, title, type, content, duration, "order" FROM lessons WHERE module_id = $1 ORDER BY "order"`,
			modules[i].ID,
		)
		if err != nil {
			continue
		}
		for lessonRows.Next() {
			var l Lesson
			if err := lessonRows.Scan(&l.ID, &l.ModuleID, &l.Title, &l.Type, &l.Content, &l.Duration, &l.Order); err != nil {
				continue
			}
			if userID > 0 {
				var completed int
				p.pool.QueryRow(ctx,
					`SELECT COUNT(*) FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2`,
					userID, l.ID,
				).Scan(&completed)
				l.Completed = completed > 0
			}
			modules[i].Lessons = append(modules[i].Lessons, l)
		}
		lessonRows.Close()
	}

	detail.Modules = modules
	return detail, modules, nil
}

func (p *PostgresDB) GetAssessments(ctx context.Context, userID int64) ([]Assessment, error) {
	rows, err := p.pool.Query(ctx,
		`SELECT a.id, a.course_id, a.title, a.description, a.type, a.max_score,
		        COALESCE(s.status, 'pending') as status,
		        COALESCE(s.submitted_at, NULL) as submitted_at,
		        COALESCE(s.score, 0) as score
		 FROM assessments a
		 LEFT JOIN assessment_submissions s ON a.id = s.assessment_id AND s.user_id = $1
		 ORDER BY a.id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assessments []Assessment
	for rows.Next() {
		var a Assessment
		if err := rows.Scan(&a.ID, &a.CourseID, &a.Title, &a.Description, &a.Type, &a.MaxScore,
			&a.Status, &a.SubmittedAt, &a.Score); err != nil {
			continue
		}
		assessments = append(assessments, a)
	}
	return assessments, rows.Err()
}

func (p *PostgresDB) GetAssessmentByID(ctx context.Context, id, userID int64) (*Assessment, error) {
	a := &Assessment{}
	err := p.pool.QueryRow(ctx,
		`SELECT a.id, a.course_id, a.title, a.description, a.type, a.max_score,
		        COALESCE(s.status, 'pending') as status,
		        COALESCE(s.submitted_at, NULL) as submitted_at,
		        COALESCE(s.score, 0) as score
		 FROM assessments a
		 LEFT JOIN assessment_submissions s ON a.id = s.assessment_id AND s.user_id = $1
		 WHERE a.id = $2`,
		userID, id,
	).Scan(&a.ID, &a.CourseID, &a.Title, &a.Description, &a.Type, &a.MaxScore,
		&a.Status, &a.SubmittedAt, &a.Score)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (p *PostgresDB) SubmitAssessment(ctx context.Context, sub *AssessmentSubmission) error {
	now := time.Now()
	err := p.pool.QueryRow(ctx,
		`INSERT INTO assessment_submissions (assessment_id, user_id, github_url, status, submitted_at)
		 VALUES ($1, $2, $3, 'submitted', $4) RETURNING id`,
		sub.AssessmentID, sub.UserID, sub.GitHubURL, now,
	).Scan(&sub.ID)
	if err != nil {
		return err
	}
	sub.Status = "submitted"
	sub.SubmittedAt = now
	return nil
}

func (p *PostgresDB) GetCertificates(ctx context.Context, userID int64) ([]Certificate, error) {
	rows, err := p.pool.Query(ctx,
		`SELECT c.id, c.user_id, c.course_id, co.title as course_name, c.issued_at, c.cert_type
		 FROM certificates c
		 JOIN courses co ON c.course_id = co.id
		 WHERE c.user_id = $1
		 ORDER BY c.issued_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certs []Certificate
	for rows.Next() {
		var cert Certificate
		if err := rows.Scan(&cert.ID, &cert.UserID, &cert.CourseID, &cert.CourseName, &cert.IssuedAt, &cert.CertType); err != nil {
			continue
		}
		certs = append(certs, cert)
	}
	return certs, rows.Err()
}

func (p *PostgresDB) MarkLessonComplete(ctx context.Context, userID, lessonID int64) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, lesson_id) DO NOTHING`,
		userID, lessonID, time.Now(),
	)
	return err
}

func (p *PostgresDB) GetGigs(ctx context.Context, f GigFilter) ([]Gig, int, error) {
	countQuery := `SELECT COUNT(*) FROM gigs WHERE 1=1`
	query := `SELECT id, title, description, client_name, budget, status, skills, duration, proposals, created_at FROM gigs WHERE 1=1`
	args := []any{}
	argIdx := 1

	if f.Search != "" {
		searchCondition := fmt.Sprintf(` AND (LOWER(title) LIKE $%d OR LOWER(description) LIKE $%d)`, argIdx, argIdx)
		q := "%" + strings.ToLower(f.Search) + "%"
		countQuery += searchCondition
		query += searchCondition
		args = append(args, q)
		argIdx++
	}
	if f.Status != "" {
		countQuery += fmt.Sprintf(` AND status = $%d`, argIdx)
		query += fmt.Sprintf(` AND status = $%d`, argIdx)
		args = append(args, f.Status)
		argIdx++
	}

	var total int
	p.pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	query += ` ORDER BY created_at DESC`
	if f.PerPage > 0 {
		offset := (f.Page - 1) * f.PerPage
		query += fmt.Sprintf(` LIMIT %d OFFSET %d`, f.PerPage, offset)
	}

	rows, err := p.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var gigs []Gig
	for rows.Next() {
		var g Gig
		if err := rows.Scan(&g.ID, &g.Title, &g.Description, &g.ClientName, &g.Budget, &g.Status, &g.Skills, &g.Duration, &g.Proposals, &g.CreatedAt); err != nil {
			continue
		}
		gigs = append(gigs, g)
	}
	return gigs, total, rows.Err()
}

func (p *PostgresDB) GetGigByID(ctx context.Context, id int64) (*Gig, error) {
	g := &Gig{}
	err := p.pool.QueryRow(ctx,
		`SELECT id, title, description, client_name, budget, status, skills, duration, proposals, created_at FROM gigs WHERE id = $1`,
		id,
	).Scan(&g.ID, &g.Title, &g.Description, &g.ClientName, &g.Budget, &g.Status, &g.Skills, &g.Duration, &g.Proposals, &g.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return g, err
}

func (p *PostgresDB) GetDashboardData(ctx context.Context, userID int64) (*DashboardData, error) {
	data := &DashboardData{}

	p.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM enrollments WHERE user_id = $1`, userID,
	).Scan(&data.Stats.EnrolledCourses)

	p.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM lesson_completions WHERE user_id = $1`, userID,
	).Scan(&data.Stats.CompletedLessons)

	p.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM certificates WHERE user_id = $1`, userID,
	).Scan(&data.Stats.Certificates)

	data.Stats.Streak = 1
	data.RecentActivity = []Activity{}

	enrollments, _ := p.GetEnrollmentsByUser(ctx, userID)
	for _, e := range enrollments {
		course, _ := p.GetCourseByID(ctx, e.CourseID)
		if course != nil {
			data.Progress = append(data.Progress, CourseProgress{
				CourseID: e.CourseID,
				Title:    course.Title,
				Progress: e.Progress,
			})
		}
	}

	return data, nil
}
