import AppConfig from '../core/config.js';
import { store } from '../store/index.js';
import { UIActions } from '../store/actions.js';

class ApiService {
  constructor() {
    this.baseUrl = AppConfig.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, showToast = true } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const token = store.getState('auth.token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const config = {
      method,
      headers: { ...defaultHeaders, ...headers },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        const { AuthActions } = await import('../store/actions.js');
        AuthActions.logout();
        if (showToast) {
          UIActions.addToast('Session expired. Please log in again.', 'warning');
        }
        window.history.pushState(null, '', '/login');
        const { router } = await import('../core/router.js');
        router._navigate('/login');
        throw new ApiError('Unauthorized', 401);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (showToast) {
        UIActions.addToast('Network error. Please check your connection.', 'error');
      }
      throw new ApiError('Network error', 0, { originalError: error });
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  upload(endpoint, formData, options = {}) {
    const token = store.getState('auth.token');
    return this.request(endpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      ...options,
    });
  }
}

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const api = new ApiService();

export { ApiService, ApiError, api };
export default api;
