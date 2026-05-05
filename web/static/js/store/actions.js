import store from './index.js';
import { generateId } from '../utils/helpers.js';

export const AuthActions = {
  setUser(user) {
    store.setState('auth.user', user);
    store.setState('auth.isAuthenticated', !!user);
    store.setState('auth.isLoading', false);
  },

  setToken(token) {
    store.setState('auth.token', token);
  },

  setLoading(isLoading) {
    store.setState('auth.isLoading', isLoading);
  },

  logout() {
    store.setState('auth.user', null);
    store.setState('auth.isAuthenticated', false);
    store.setState('auth.token', null);
  },
};

export const CourseActions = {
  setCourses(courses, pagination) {
    store.setState('courses.list', courses);
    if (pagination) store.setState('courses.pagination', pagination);
    store.setState('courses.isLoading', false);
  },

  setCurrentCourse(course) {
    store.setState('courses.currentCourse', course);
  },

  setCurrentLesson(lesson) {
    store.setState('courses.currentLesson', lesson);
  },

  setFilters(filters) {
    store.mergeState('courses.filters', filters);
  },

  setLoading(isLoading) {
    store.setState('courses.isLoading', isLoading);
  },
};

export const DashboardActions = {
  setStats(stats) {
    store.setState('dashboard.stats', stats);
  },

  setRecentActivity(activity) {
    store.setState('dashboard.recentActivity', activity);
  },

  setProgress(progress) {
    store.setState('dashboard.progress', progress);
  },

  setLoading(isLoading) {
    store.setState('dashboard.isLoading', isLoading);
  },
};

export const AssessmentActions = {
  setAssessments(assessments) {
    store.setState('assessments.list', assessments);
  },

  setCurrent(assessment) {
    store.setState('assessments.current', assessment);
  },

  setSubmitting(isSubmitting) {
    store.setState('assessments.isSubmitting', isSubmitting);
  },
};

export const ChatActions = {
  addMessage(message) {
    const messages = store.getState('aiChat.messages') || [];
    store.setState('aiChat.messages', [
      ...messages,
      { id: generateId('msg'), timestamp: Date.now(), ...message },
    ]);
  },

  setTyping(isTyping) {
    store.setState('aiChat.isTyping', isTyping);
  },

  clearMessages() {
    store.setState('aiChat.messages', []);
  },

  setConversationId(id) {
    store.setState('aiChat.conversationId', id);
  },
};

export const MarketplaceActions = {
  setGigs(gigs, pagination) {
    store.setState('marketplace.gigs', gigs);
    if (pagination) store.setState('marketplace.pagination', pagination);
    store.setState('marketplace.isLoading', false);
  },

  setCurrentGig(gig) {
    store.setState('marketplace.currentGig', gig);
  },

  setFilters(filters) {
    store.mergeState('marketplace.filters', filters);
  },

  setLoading(isLoading) {
    store.setState('marketplace.isLoading', isLoading);
  },
};

export const UIActions = {
  toggleSidebar(force) {
    const current = store.getState('ui.sidebarOpen');
    store.setState('ui.sidebarOpen', force ?? !current);
  },

  setTheme(theme) {
    store.setState('ui.theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lf_theme', theme);
  },

  addToast(message, type = 'info', duration = 4000) {
    const toast = { id: generateId('toast'), message, type, duration };
    const toasts = store.getState('ui.toasts') || [];
    store.setState('ui.toasts', [...toasts, toast]);
    setTimeout(() => this.removeToast(toast.id), duration);
    return toast.id;
  },

  removeToast(id) {
    const toasts = store.getState('ui.toasts') || [];
    store.setState(
      'ui.toasts',
      toasts.filter((t) => t.id !== id)
    );
  },

  openModal(modalId, data = null) {
    store.setState('ui.activeModal', { id: modalId, data });
  },

  closeModal() {
    store.setState('ui.activeModal', null);
  },
};
