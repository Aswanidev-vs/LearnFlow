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
			bio TEXT NOT NULL DEFAULT '',
			location TEXT NOT NULL DEFAULT '',
			website TEXT NOT NULL DEFAULT '',
			github TEXT NOT NULL DEFAULT '',
			skills TEXT NOT NULL DEFAULT '',
			image_url TEXT NOT NULL DEFAULT '',
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
			thumbnail TEXT NOT NULL DEFAULT '',
			instructor_name TEXT NOT NULL DEFAULT '',
			lessons_count INTEGER NOT NULL DEFAULT 0,
			students_count INTEGER NOT NULL DEFAULT 0,
			tags TEXT NOT NULL DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS modules (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			course_id INTEGER NOT NULL REFERENCES courses(id),
			title TEXT NOT NULL,
			"order" INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS lessons (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			module_id INTEGER NOT NULL REFERENCES modules(id),
			title TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'video',
			content TEXT NOT NULL DEFAULT '',
			duration INTEGER NOT NULL DEFAULT 0,
			"order" INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS enrollments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id),
			course_id INTEGER NOT NULL REFERENCES courses(id),
			progress INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, course_id)
		)`,
		`CREATE TABLE IF NOT EXISTS lesson_completions (
			user_id INTEGER NOT NULL REFERENCES users(id),
			lesson_id INTEGER NOT NULL REFERENCES lessons(id),
			completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, lesson_id)
		)`,
		`CREATE TABLE IF NOT EXISTS assessments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			course_id INTEGER NOT NULL REFERENCES courses(id),
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			type TEXT NOT NULL DEFAULT 'project',
			max_score INTEGER NOT NULL DEFAULT 100
		)`,
		`CREATE TABLE IF NOT EXISTS assessment_submissions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			assessment_id INTEGER NOT NULL REFERENCES assessments(id),
			user_id INTEGER NOT NULL REFERENCES users(id),
			github_url TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'pending',
			score INTEGER NOT NULL DEFAULT 0,
			feedback TEXT NOT NULL DEFAULT '',
			submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS certificates (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id),
			course_id INTEGER NOT NULL REFERENCES courses(id),
			issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			cert_type TEXT NOT NULL DEFAULT 'course'
		)`,
		`CREATE TABLE IF NOT EXISTS gigs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			client_name TEXT NOT NULL DEFAULT '',
			budget TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'open',
			skills TEXT NOT NULL DEFAULT '',
			duration TEXT NOT NULL DEFAULT '',
			proposals INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
		if _, err := s.db.Exec(m); err != nil {
			return fmt.Errorf("exec migration: %w\nSQL: %s", err, m)
		}
	}
	return nil
}

func (s *SQLiteDB) CreateUser(ctx context.Context, u *User) error {
	now := time.Now()
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO users (email, password_hash, first_name, last_name, role, bio, location, website, github, skills, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, u.Bio, u.Location, u.Website, u.GitHub, u.Skills, u.ImageURL, now, now,
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
		`SELECT id, email, password_hash, first_name, last_name, role, bio, location, website, github, skills, image_url, created_at, updated_at FROM users WHERE email = ?`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.Bio, &u.Location, &u.Website, &u.GitHub, &u.Skills, &u.ImageURL, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (s *SQLiteDB) GetUserByID(ctx context.Context, id int64) (*User, error) {
	u := &User{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, email, password_hash, first_name, last_name, role, bio, location, website, github, skills, image_url, created_at, updated_at FROM users WHERE id = ?`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.Bio, &u.Location, &u.Website, &u.GitHub, &u.Skills, &u.ImageURL, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (s *SQLiteDB) UpdateUser(ctx context.Context, u *User) error {
	u.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE users SET first_name=?, last_name=?, role=?, bio=?, location=?, website=?, github=?, skills=?, image_url=?, updated_at=? WHERE id=?`,
		u.FirstName, u.LastName, u.Role, u.Bio, u.Location, u.Website, u.GitHub, u.Skills, u.ImageURL, u.UpdatedAt, u.ID,
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

func (s *SQLiteDB) GetCourses(ctx context.Context, f CourseFilter) ([]Course, int, error) {
	countQuery := `SELECT COUNT(*) FROM courses WHERE 1=1`
	query := `SELECT id, title, description, category, level, duration, price, rating, created_at FROM courses WHERE 1=1`
	args := []any{}

	if f.Category != "" {
		countQuery += ` AND category = ?`
		query += ` AND category = ?`
		args = append(args, f.Category)
	}
	if f.Level != "" {
		countQuery += ` AND level = ?`
		query += ` AND level = ?`
		args = append(args, f.Level)
	}
	if f.Search != "" {
		countQuery += ` AND (title LIKE ? OR description LIKE ?)`
		query += ` AND (title LIKE ? OR description LIKE ?)`
		q := "%" + strings.ToLower(f.Search) + "%"
		args = append(args, q, q)
	}

	var total int
	s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)

	query += ` ORDER BY created_at DESC`

	if f.PerPage > 0 {
		offset := (f.Page - 1) * f.PerPage
		query += fmt.Sprintf(` LIMIT %d OFFSET %d`, f.PerPage, offset)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
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

func (s *SQLiteDB) IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error) {
	var count int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND course_id = ?`,
		userID, courseID,
	).Scan(&count)
	return count > 0, err
}

func (s *SQLiteDB) GetCourseWithModules(ctx context.Context, courseID, userID int64) (*CourseDetail, []Module, error) {
	course, err := s.GetCourseByID(ctx, courseID)
	if err != nil || course == nil {
		return nil, nil, err
	}

	detail := &CourseDetail{Course: *course}

	// Check enrollment
	if userID > 0 {
		enrolled, _ := s.IsEnrolled(ctx, userID, courseID)
		detail.Enrolled = enrolled
		if enrolled {
			var progress int
			s.db.QueryRowContext(ctx,
				`SELECT progress FROM enrollments WHERE user_id = ? AND course_id = ?`,
				userID, courseID,
			).Scan(&progress)
			detail.Progress = progress
		}
	}

	// Get modules
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, course_id, title, "order" FROM modules WHERE course_id = ? ORDER BY "order"`,
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

	// Get lessons for each module
	for i := range modules {
		lessonRows, err := s.db.QueryContext(ctx,
			`SELECT id, module_id, title, type, content, duration, "order" FROM lessons WHERE module_id = ? ORDER BY "order"`,
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
			// Check if lesson is completed
			if userID > 0 {
				var completed int
				s.db.QueryRowContext(ctx,
					`SELECT COUNT(*) FROM lesson_completions WHERE user_id = ? AND lesson_id = ?`,
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

func (s *SQLiteDB) GetAssessments(ctx context.Context, userID int64) ([]Assessment, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT a.id, a.course_id, a.title, a.description, a.type, a.max_score,
		        COALESCE(s.status, 'pending') as status,
		        COALESCE(s.submitted_at, NULL) as submitted_at,
		        COALESCE(s.score, 0) as score
		 FROM assessments a
		 LEFT JOIN assessment_submissions s ON a.id = s.assessment_id AND s.user_id = ?
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

func (s *SQLiteDB) GetAssessmentByID(ctx context.Context, id, userID int64) (*Assessment, error) {
	a := &Assessment{}
	err := s.db.QueryRowContext(ctx,
		`SELECT a.id, a.course_id, a.title, a.description, a.type, a.max_score,
		        COALESCE(s.status, 'pending') as status,
		        COALESCE(s.submitted_at, NULL) as submitted_at,
		        COALESCE(s.score, 0) as score
		 FROM assessments a
		 LEFT JOIN assessment_submissions s ON a.id = s.assessment_id AND s.user_id = ?
		 WHERE a.id = ?`,
		userID, id,
	).Scan(&a.ID, &a.CourseID, &a.Title, &a.Description, &a.Type, &a.MaxScore,
		&a.Status, &a.SubmittedAt, &a.Score)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (s *SQLiteDB) SubmitAssessment(ctx context.Context, sub *AssessmentSubmission) error {
	now := time.Now()
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO assessment_submissions (assessment_id, user_id, github_url, status, submitted_at)
		 VALUES (?, ?, ?, 'submitted', ?)`,
		sub.AssessmentID, sub.UserID, sub.GitHubURL, now,
	)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	sub.ID = id
	sub.Status = "submitted"
	sub.SubmittedAt = now
	return nil
}

func (s *SQLiteDB) GetCertificates(ctx context.Context, userID int64) ([]Certificate, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT c.id, c.user_id, c.course_id, co.title as course_name, c.issued_at, c.cert_type
		 FROM certificates c
		 JOIN courses co ON c.course_id = co.id
		 WHERE c.user_id = ?
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

func (s *SQLiteDB) MarkLessonComplete(ctx context.Context, userID, lessonID int64) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, ?, ?)`,
		userID, lessonID, time.Now(),
	)
	return err
}

func (s *SQLiteDB) GetGigs(ctx context.Context, f GigFilter) ([]Gig, int, error) {
	countQuery := `SELECT COUNT(*) FROM gigs WHERE 1=1`
	query := `SELECT id, title, description, client_name, budget, status, skills, duration, proposals, created_at FROM gigs WHERE 1=1`
	args := []any{}

	if f.Search != "" {
		searchCondition := ` AND (title LIKE ? OR description LIKE ?)`
		q := "%" + strings.ToLower(f.Search) + "%"
		countQuery += searchCondition
		query += searchCondition
		args = append(args, q, q)
	}
	if f.Status != "" {
		countQuery += ` AND status = ?`
		query += ` AND status = ?`
		args = append(args, f.Status)
	}

	var total int
	s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)

	query += ` ORDER BY created_at DESC`
	if f.PerPage > 0 {
		offset := (f.Page - 1) * f.PerPage
		query += fmt.Sprintf(` LIMIT %d OFFSET %d`, f.PerPage, offset)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
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

func (s *SQLiteDB) GetGigByID(ctx context.Context, id int64) (*Gig, error) {
	g := &Gig{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, title, description, client_name, budget, status, skills, duration, proposals, created_at FROM gigs WHERE id = ?`,
		id,
	).Scan(&g.ID, &g.Title, &g.Description, &g.ClientName, &g.Budget, &g.Status, &g.Skills, &g.Duration, &g.Proposals, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return g, err
}

func (s *SQLiteDB) GetDashboardData(ctx context.Context, userID int64) (*DashboardData, error) {
	data := &DashboardData{}

	// Stats
	s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM enrollments WHERE user_id = ?`, userID,
	).Scan(&data.Stats.EnrolledCourses)

	s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM lesson_completions WHERE user_id = ?`, userID,
	).Scan(&data.Stats.CompletedLessons)

	s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM certificates WHERE user_id = ?`, userID,
	).Scan(&data.Stats.Certificates)

	data.Stats.Streak = 1 // Simplified streak calculation

	// Recent activity
	data.RecentActivity = []Activity{}

	// Course progress
	enrollments, _ := s.GetEnrollmentsByUser(ctx, userID)
	for _, e := range enrollments {
		course, _ := s.GetCourseByID(ctx, e.CourseID)
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
