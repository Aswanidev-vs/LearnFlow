package db

import (
	"context"
	"time"
)

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	Role         string    `json:"role"`
	Bio          string    `json:"bio"`
	Location     string    `json:"location"`
	Website      string    `json:"website"`
	GitHub       string    `json:"github"`
	Skills       string    `json:"skills"`
	ImageURL     string    `json:"imageUrl"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Course struct {
	ID             int64     `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Category       string    `json:"category"`
	Level          string    `json:"level"`
	Duration       string    `json:"duration"`
	Price          float64   `json:"price"`
	Rating         float64   `json:"rating"`
	Thumbnail      string    `json:"thumbnail"`
	InstructorName string    `json:"instructorName"`
	LessonsCount   int       `json:"lessonsCount"`
	StudentsCount  int       `json:"studentsCount"`
	Tags           string    `json:"tags"`
	CreatedAt      time.Time `json:"createdAt"`
}

type CourseDetail struct {
	Course
	Enrolled bool  `json:"enrolled"`
	Progress int   `json:"progress"`
	Modules  []Module `json:"modules"`
}

type Module struct {
	ID       int64    `json:"id"`
	CourseID int64    `json:"courseId"`
	Title    string   `json:"title"`
	Order    int      `json:"order"`
	Lessons  []Lesson `json:"lessons"`
}

type Lesson struct {
	ID        int64   `json:"id"`
	ModuleID  int64   `json:"moduleId"`
	Title     string  `json:"title"`
	Type      string  `json:"type"`
	Content   string  `json:"content"`
	Duration  int     `json:"duration"`
	Order     int     `json:"order"`
	Completed bool    `json:"completed"`
}

type Enrollment struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	CourseID  int64     `json:"courseId"`
	Progress  int       `json:"progress"`
	CreatedAt time.Time `json:"createdAt"`
}

type Assessment struct {
	ID          int64     `json:"id"`
	CourseID    int64     `json:"courseId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	MaxScore    int       `json:"maxScore"`
	Status      string    `json:"status"`
	SubmittedAt time.Time `json:"submittedAt,omitempty"`
	Score       int       `json:"score,omitempty"`
}

type AssessmentSubmission struct {
	ID           int64     `json:"id"`
	AssessmentID int64     `json:"assessmentId"`
	UserID       int64     `json:"userId"`
	GitHubURL    string    `json:"githubUrl"`
	Status       string    `json:"status"`
	Score        int       `json:"score"`
	Feedback     string    `json:"feedback"`
	SubmittedAt  time.Time `json:"submittedAt"`
}

type Certificate struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	CourseID  int64     `json:"courseId"`
	CourseName string   `json:"courseName"`
	IssuedAt  time.Time `json:"issuedAt"`
	CertType  string    `json:"certType"`
}

type Gig struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ClientName  string    `json:"clientName"`
	Budget      string    `json:"budget"`
	Status      string    `json:"status"`
	Skills      string    `json:"skills"`
	Duration    string    `json:"duration"`
	Proposals   int       `json:"proposals"`
	CreatedAt   time.Time `json:"createdAt"`
}

type DashboardData struct {
	Stats          DashboardStats  `json:"stats"`
	RecentActivity []Activity      `json:"recentActivity"`
	Progress       []CourseProgress `json:"progress"`
}

type DashboardStats struct {
	EnrolledCourses  int `json:"enrolledCourses"`
	CompletedLessons int `json:"completedLessons"`
	Certificates     int `json:"certificates"`
	Streak           int `json:"streak"`
}

type Activity struct {
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Timestamp time.Time `json:"timestamp"`
}

type CourseProgress struct {
	CourseID         int64   `json:"courseId"`
	Title            string  `json:"title"`
	Progress         int     `json:"progress"`
	CompletedLessons int     `json:"completedLessons"`
	TotalLessons     int     `json:"totalLessons"`
}

type CourseFilter struct {
	Category string
	Level    string
	Search   string
	Page     int
	PerPage  int
}

type GigFilter struct {
	Search  string
	Budget  string
	Status  string
	Page    int
	PerPage int
}

type Database interface {
	Close() error
	Ping(ctx context.Context) error

	CreateUser(ctx context.Context, u *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id int64) (*User, error)
	UpdateUser(ctx context.Context, u *User) error

	CreateCourse(ctx context.Context, c *Course) error
	GetCourses(ctx context.Context, filter CourseFilter) ([]Course, int, error)
	GetCourseByID(ctx context.Context, id int64) (*Course, error)
	GetCourseWithModules(ctx context.Context, courseID, userID int64) (*CourseDetail, []Module, error)

	CreateEnrollment(ctx context.Context, e *Enrollment) error
	GetEnrollmentsByUser(ctx context.Context, userID int64) ([]Enrollment, error)
	UpdateEnrollmentProgress(ctx context.Context, userID, courseID int64, progress int) error
	IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error)

	GetAssessments(ctx context.Context, userID int64) ([]Assessment, error)
	GetAssessmentByID(ctx context.Context, id, userID int64) (*Assessment, error)
	SubmitAssessment(ctx context.Context, sub *AssessmentSubmission) error

	GetCertificates(ctx context.Context, userID int64) ([]Certificate, error)

	MarkLessonComplete(ctx context.Context, userID, lessonID int64) error

	GetGigs(ctx context.Context, filter GigFilter) ([]Gig, int, error)
	GetGigByID(ctx context.Context, id int64) (*Gig, error)

	GetDashboardData(ctx context.Context, userID int64) (*DashboardData, error)
}
