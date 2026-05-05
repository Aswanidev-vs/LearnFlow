const initialState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  },
  courses: {
    list: [],
    currentCourse: null,
    currentLesson: null,
    filters: { category: '', level: '', search: '' },
    pagination: { page: 1, totalPages: 1, total: 0 },
    isLoading: false,
  },
  dashboard: {
    stats: { enrolledCourses: 0, completedLessons: 0, certificates: 0, streak: 0 },
    recentActivity: [],
    progress: [],
    isLoading: false,
  },
  assessments: {
    list: [],
    current: null,
    isSubmitting: false,
  },
  aiChat: {
    messages: [],
    isTyping: false,
    conversationId: null,
  },
  marketplace: {
    gigs: [],
    currentGig: null,
    proposals: [],
    filters: { budget: '', skills: [], status: '' },
    pagination: { page: 1, totalPages: 1, total: 0 },
    isLoading: false,
  },
  profile: {
    data: null,
    isEditing: false,
    isSaving: false,
  },
  certificates: {
    list: [],
    isLoading: false,
  },
  ui: {
    sidebarOpen: false,
    theme: 'light',
    toasts: [],
    activeModal: null,
  },
};

class Store {
  constructor(initState = {}) {
    this._state = structuredClone(initState);
    this._listeners = new Map();
    this._globalListeners = new Set();
  }

  getState(path) {
    if (!path) return structuredClone(this._state);
    return path.split('.').reduce((acc, key) => acc?.[key], this._state);
  }

  setState(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!(key in acc) || typeof acc[key] !== 'object') acc[key] = {};
      return acc[key];
    }, this._state);
    const oldValue = target[last];
    target[last] = value;
    this._notify(path, value, oldValue);
    return this;
  }

  mergeState(path, partial) {
    const current = this.getState(path) || {};
    this.setState(path, { ...current, ...partial });
    return this;
  }

  reset(newState) {
    this._state = structuredClone(newState || initialState);
    this._notify('*', this._state, null);
  }

  subscribe(pathOrFn, handler) {
    if (typeof pathOrFn === 'function') {
      this._globalListeners.add(pathOrFn);
      return () => this._globalListeners.delete(pathOrFn);
    }
    if (!this._listeners.has(pathOrFn)) {
      this._listeners.set(pathOrFn, new Set());
    }
    this._listeners.get(pathOrFn).add(handler);
    return () => this._listeners.get(pathOrFn)?.delete(handler);
  }

  _notify(changedPath, newValue, oldValue) {
    for (const [path, handlers] of this._listeners) {
      if (changedPath.startsWith(path) || path.startsWith(changedPath)) {
        handlers.forEach((fn) => fn(this.getState(path), changedPath));
      }
    }
    this._globalListeners.forEach((fn) => fn(this._state, changedPath));
  }
}

const store = new Store(initialState);

export { store, Store, initialState };
export default store;
