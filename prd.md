# Product Requirements Document: LearnFlow LMS (Golang Edition)

**Project Name:** LearnFlow LMS  
**Version:** 1.1 (Modified for Go/Chi Stack)  
**Date:** February 2026  
**Status:** Ready for MVP Development  

---

## 1. Executive Summary
LearnFlow is a next-generation SaaS Learning Management System (LMS) designed to combine structured learning with real-world collaboration and AI-driven personalization. The platform moves beyond content consumption by offering GitHub-based assessments, dual-certification, and a built-in freelancing marketplace. This version of the PRD focuses on a **high-concurrency Golang backend** using the **Chi router** to ensure long-term scalability and maintainability. [cite: 7, 8, 9, 10]

---

## 2. Technical Architecture (The Go Stack)
To meet the target of **10,000+ concurrent users**, the following stack is finalized: [cite: 226, 235]

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend** | **Golang + Chi Router** | Lightweight, idiomatic, and standard-library compatible for modular sub-routing. |
| **Database** | **PostgreSQL + GORM** | Robust relational data for complex user/course/project mappings. [cite: 226] |
| **Auth** | **Supabase Auth / Clerk** | Fast JWT-based authentication with pre-built GitHub OAuth support. [cite: 226] |
| **AI Engine** | **OpenAI / Claude API** | Powers the 24/7 AI Assistant and automated code reviews. [cite: 226] |
| **Payments** | **Stripe Go SDK** | Handles course purchases and freelancer escrow management. [cite: 226] |
| **Hosting** | **Render / Koyeb** | Free-tier friendly for Go binaries; provides seamless "push-to-deploy" from GitHub. |

---

## 3. Core Feature Modules

### 3.1 Course Learning & Progress Tracking
* **Structured Delivery:** Course curriculum organized into modules and lessons (video, text, resources). [cite: 68]
* **Go Implementation:** Use `chi.Route` to handle nested lesson endpoints; store progress timestamps in PostgreSQL via GORM.
* **Resume Feature:** Learners can resume videos from the last watched position across devices. [cite: 71]

### 3.2 GitHub-Based Assessment
* **Workflow:** Learners submit a GitHub repo URL for their course project. [cite: 107]
* **Automation:** The Go backend utilizes the `google/go-github` library to validate repo accessibility and commit history. [cite: 108]
* **AI Review:** Submissions are sent to the AI API for code quality analysis based on a 0–100 rubric. [cite: 109, 111]

### 3.3 AI Personal Assistant
* **Conversational Chat:** A 24/7 chatbot embedded in the dashboard, contextually aware of learner progress. [cite: 148, 149, 150]
* **Weekly Reports:** A Go cron job/worker generates a "Weekly Learning Report" identifying weak areas and suggested improvements. [cite: 154, 157, 158]

### 3.4 Dual Certification System
* **Course Certificate:** Issued upon passing the GitHub assessment (Score ≥ 70/100). [cite: 112, 120]
* **Internship Certificate:** Issued after completing the Collaboration/Internship track with instructor approval. [cite: 125]
* **Tech:** Generated as PDFs using the Go-native `maroto` or `gofpdf` libraries. [cite: 122, 127]

---

## 4. Freelancing Marketplace
The platform transitions learners from students to professionals through an integrated marketplace. [cite: 170]

* **Freelancer Profiles:** Learners who earn certifications can create public profiles with "Verified" badges. [cite: 175, 177]
* **Gig Board:** Clients post projects; learners submit proposals via a Go-based matching engine. [cite: 181, 183, 213]
* **Escrow Payments:** Funds are held securely in Stripe and released milestone-by-milestone upon client approval. [cite: 207, 208, 209]

---

## 5. MVP Development Phases (Months 1–3) [cite: 237]

### Phase 1: Foundation (Month 1)
* Setup `chi` router with standard middleware (Logger, Recoverer, CORS).
* Initialize PostgreSQL schema using GORM.
* Integrate Supabase/Clerk for User Auth.

### Phase 2: Learning Core (Month 2)
* Develop Course/Module/Lesson API endpoints.
* Implement video progress tracking and "Resume" logic.
* Basic AI Chatbot integration for learner support.

### Phase 3: Assessments & Payments (Month 3)
* Build GitHub URL submission logic and repo validation.
* Integrate Stripe for course checkout.
* Deploy MVP to Render/Koyeb for initial user testing.

---

## 6. Non-Functional Requirements [cite: 235]
* **Performance:** API response times < 200ms; AI response < 5s.
* **Availability:** 99.9% uptime target.
* **Security:** TLS 1.3 encryption and PCI-DSS compliance for payments.

---

## 7. Success Metrics (KPIs) [cite: 238]
* **Course Completion Rate:** Target ≥ 60%. [cite: 240]
* **AI Usage:** ≥ 50% of active learners using the AI Assistant weekly. [cite: 244]
* **Conversion:** ≥ 15% of certified learners successfully hired for a gig. [cite: 253]

---

