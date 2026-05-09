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
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Course struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Level       string    `json:"level"`
	Duration    string    `json:"duration"`
	Price       float64   `json:"price"`
	Rating      float64   `json:"rating"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Enrollment struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	CourseID  int64     `json:"courseId"`
	Progress  int       `json:"progress"`
	CreatedAt time.Time `json:"createdAt"`
}

type Database interface {
	Close() error
	Ping(ctx context.Context) error

	CreateUser(ctx context.Context, u *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id int64) (*User, error)
	UpdateUser(ctx context.Context, u *User) error

	CreateCourse(ctx context.Context, c *Course) error
	GetCourses(ctx context.Context, filter CourseFilter) ([]Course, error)
	GetCourseByID(ctx context.Context, id int64) (*Course, error)

	CreateEnrollment(ctx context.Context, e *Enrollment) error
	GetEnrollmentsByUser(ctx context.Context, userID int64) ([]Enrollment, error)
	UpdateEnrollmentProgress(ctx context.Context, userID, courseID int64, progress int) error
}

type CourseFilter struct {
	Category string
	Level    string
	Search   string
	Page     int
	PerPage  int
}
