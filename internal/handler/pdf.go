package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Aswanidev-vs/learnflow/internal/auth"
	"github.com/Aswanidev-vs/learnflow/internal/pdf"
	"github.com/go-chi/chi/v5"
)

func DownloadCertificate(w http.ResponseWriter, r *http.Request) {
	certID := chi.URLParam(r, "id")
	if certID == "" {
		http.Error(w, "Missing certificate ID", http.StatusBadRequest)
		return
	}

	userName := r.URL.Query().Get("name")
	courseName := r.URL.Query().Get("course")
	credentialID := r.URL.Query().Get("id")

	if sess := auth.GetSession(r); sess != nil {
		if userName == "" && sess.FirstName != "" {
			userName = fmt.Sprintf("%s %s", sess.FirstName, sess.LastName)
		}
	}
	if userName == "" {
		userName = "Student"
	}
	if courseName == "" {
		courseName = "LearnFlow Course"
	}
	if credentialID == "" {
		credentialID = certID
	}

	data := pdf.CertificateData{
		UserName:     userName,
		CourseName:   courseName,
		IssueDate:    time.Now(),
		CredentialID: credentialID,
	}

	pdfBytes, err := pdf.GenerateCertificate(data)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to generate PDF: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")

	// Preview should render in-browser; download should force “Save as”.
	// Frontend passes ?preview=1 for preview.
	disposition := "attachment"
	if r.URL.Query().Get("preview") == "1" {
		disposition = "inline"
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("%s; filename=certificate_%s.pdf", disposition, credentialID))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))
	w.Write(pdfBytes)
}
