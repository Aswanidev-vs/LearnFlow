package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Userclaims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

type JWTservie struct {
	secret []byte
	issuer string
	ttl    time.Duration
}

func NewJWTservice() (*JWTservie, error) {
	secret := os.Getenv("SUPER-SECRET_KEY")
	if secret == "" {
		return nil, fmt.Errorf("Environment variable 'SUPER-SECRET_KEY' is not set")
	}
	return &JWTservie{
		secret: []byte(secret),
		issuer: "learnflow",
		ttl:    24 * time.Hour,
	}, nil
}

func (j *JWTservie) GenerateToken(email, role string) (string, error) {
	claims := Userclaims{
		Email: email,
		Role:  role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   email,
			Issuer:    "learnflow",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secret)
}
func (j *JWTservie) ValidateToken(tokenstring string) (*Userclaims, error) {
	token, err := jwt.ParseWithClaims(tokenstring, &Userclaims{}, func(t *jwt.Token) (interface{}, error) {
		return j.secret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Userclaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
