import api from './api.js';
import MockData from './mockData.js';
import { sleep } from '../utils/helpers.js';

const USE_MOCK = true;

class CourseService {
  async getCourses(filters = {}) {
    if (USE_MOCK) {
      await sleep(400);
      let courses = [...MockData.courses];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        courses = courses.filter(
          (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
        );
      }
      if (filters.category) {
        courses = courses.filter((c) => c.category === filters.category);
      }
      if (filters.level) {
        courses = courses.filter((c) => c.level === filters.level);
      }
      return {
        courses,
        pagination: { page: 1, totalPages: 1, total: courses.length },
      };
    }
    const params = new URLSearchParams(filters).toString();
    return api.get(`/courses?${params}`);
  }

  async getCourseById(id) {
    if (USE_MOCK) {
      await sleep(300);
      return MockData.courses.find((c) => c.id === id) || null;
    }
    return api.get(`/courses/${id}`);
  }

  async enrollCourse(courseId) {
    if (USE_MOCK) {
      await sleep(500);
      return { success: true, message: 'Enrolled successfully' };
    }
    return api.post(`/courses/${courseId}/enroll`);
  }

  async getLesson(courseId, lessonId) {
    if (USE_MOCK) {
      await sleep(200);
      const course = MockData.courses.find((c) => c.id === courseId);
      if (!course) return null;
      for (const mod of course.modules) {
        const lesson = mod.lessons.find((l) => l.id === lessonId);
        if (lesson) return { ...lesson, courseId, moduleName: mod.title };
      }
      return null;
    }
    return api.get(`/courses/${courseId}/lessons/${lessonId}`);
  }

  async updateProgress(courseId, lessonId, progress) {
    if (USE_MOCK) {
      await sleep(100);
      return { success: true };
    }
    return api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, { progress });
  }
}

class DashboardService {
  async getDashboardData() {
    if (USE_MOCK) {
      await sleep(500);
      return MockData.dashboard;
    }
    return api.get('/dashboard');
  }
}

class AssessmentService {
  async getAssessments() {
    if (USE_MOCK) {
      await sleep(400);
      return MockData.assessments;
    }
    return api.get('/assessments');
  }

  async getAssessmentById(id) {
    if (USE_MOCK) {
      await sleep(300);
      return MockData.assessments.find((a) => a.id === id) || null;
    }
    return api.get(`/assessments/${id}`);
  }

  async submitAssessment(assessmentId, githubUrl) {
    if (USE_MOCK) {
      await sleep(1000);
      return { success: true, message: 'Assessment submitted for review', score: null };
    }
    return api.post(`/assessments/${assessmentId}/submit`, { githubUrl });
  }
}

class ChatService {
  async sendMessage(message, conversationId) {
    if (USE_MOCK) {
      await sleep(1500);
      const responses = [
        "That's a great question! Let me break it down for you. In Go, goroutines are lightweight threads managed by the Go runtime. They're much cheaper than OS threads, which is why Go can handle thousands of concurrent operations efficiently.",
        "I'd recommend starting with the basics of that concept. Try reviewing the lesson on interfaces in your current course. The key idea is that Go uses implicit interface satisfaction — if a type implements all the methods of an interface, it automatically satisfies that interface.",
        "Based on your progress, I think you're ready to tackle the concurrency module. I'd suggest starting with the worker pool pattern, as it's one of the most practical patterns you'll use in production Go code.",
        "Here's a tip: when writing tests in Go, use table-driven tests with subtests. This pattern makes your tests more readable and easier to maintain. Here's an example:\n\n```go\nfunc TestAdd(t *testing.T) {\n  tests := []struct{\n    name string\n    a, b, want int\n  }{\n    {\"positive\", 1, 2, 3},\n    {\"zero\", 0, 0, 0},\n  }\n  for _, tt := range tests {\n    t.Run(tt.name, func(t *testing.T) {\n      got := Add(tt.a, tt.b)\n      if got != tt.want {\n        t.Errorf(\"got %d, want %d\", got, tt.want)\n      }\n    })\n  }\n}",
      ];
      return {
        content: responses[Math.floor(Math.random() * responses.length)],
        conversationId: conversationId || 'conv-123',
      };
    }
    return api.post('/ai/chat', { message, conversationId });
  }
}

class MarketplaceService {
  async getGigs(filters = {}) {
    if (USE_MOCK) {
      await sleep(400);
      let gigs = [...MockData.marketplace.gigs];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        gigs = gigs.filter(
          (g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
        );
      }
      return {
        gigs,
        pagination: { page: 1, totalPages: 1, total: gigs.length },
      };
    }
    const params = new URLSearchParams(filters).toString();
    return api.get(`/marketplace/gigs?${params}`);
  }

  async getGigById(id) {
    if (USE_MOCK) {
      await sleep(300);
      return MockData.marketplace.gigs.find((g) => g.id === id) || null;
    }
    return api.get(`/marketplace/gigs/${id}`);
  }

  async submitProposal(gigId, proposal) {
    if (USE_MOCK) {
      await sleep(800);
      return { success: true, message: 'Proposal submitted successfully' };
    }
    return api.post(`/marketplace/gigs/${gigId}/proposals`, proposal);
  }
}

class CertificateService {
  async getCertificates() {
    if (USE_MOCK) {
      await sleep(300);
      return MockData.certificates;
    }
    return api.get('/certificates');
  }

  async downloadCertificate(certificateId) {
    if (USE_MOCK) {
      return '#';
    }
    return api.get(`/certificates/${certificateId}/download`);
  }
}

class ProfileService {
  async getProfile() {
    if (USE_MOCK) {
      await sleep(300);
      return {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        bio: 'Full-stack developer passionate about learning new technologies.',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        github: 'johndoe',
        skills: ['Go', 'React', 'TypeScript', 'PostgreSQL', 'Docker'],
        role: 'student',
        joinedAt: '2026-01-15',
        social: { github: 'https://github.com/johndoe', linkedin: 'https://linkedin.com/in/johndoe' },
      };
    }
    return api.get('/profile');
  }

  async updateProfile(data) {
    if (USE_MOCK) {
      await sleep(500);
      return { success: true, message: 'Profile updated' };
    }
    return api.put('/profile', data);
  }
}

export const courseService = new CourseService();
export const dashboardService = new DashboardService();
export const assessmentService = new AssessmentService();
export const chatService = new ChatService();
export const marketplaceService = new MarketplaceService();
export const certificateService = new CertificateService();
export const profileService = new ProfileService();
