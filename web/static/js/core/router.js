import AppConfig from './config.js';
import { parseRouteParams } from '../utils/helpers.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
    this.currentRoute = null;
    this.currentCleanup = null;
    this._onPopState = this._handlePopState.bind(this);
  }

  register(path, { handler, title, layout = 'default', auth = false, roles = [] }) {
    this.routes.set(path, { handler, title, layout, auth, roles });
    return this;
  }

  use(fn) {
    this.middleware.push(fn);
    return this;
  }

  start() {
    window.addEventListener('popstate', this._onPopState);
    this._navigate(window.location.pathname + window.location.search);
  }

  stop() {
    window.removeEventListener('popstate', this._onPopState);
  }

  navigate(path, { replace = false, state = null } = {}) {
    if (replace) {
      window.history.replaceState(state, '', path);
    } else {
      window.history.pushState(state, '', path);
    }
    this._navigate(path);
  }

  back() {
    window.history.back();
  }

  _handlePopState() {
    this._navigate(window.location.pathname + window.location.search);
  }

  async _navigate(fullPath) {
    const [path, queryString] = fullPath.split('?');
    const query = Object.fromEntries(new URLSearchParams(queryString || ''));

    let matchedRoute = null;
    let params = {};

    for (const [pattern, config] of this.routes) {
      const routeParams = parseRouteParams(pattern, path);
      if (routeParams !== null) {
        matchedRoute = { pattern, ...config };
        params = routeParams;
        break;
      }
    }

    if (!matchedRoute) {
      const notFound = this.routes.get('*');
      if (notFound) {
        matchedRoute = { pattern: '*', ...notFound };
      } else {
        console.warn(`[Router] No route found for: ${path}`);
        return;
      }
    }

    const routeContext = {
      path,
      params,
      query,
      fullPath,
      layout: matchedRoute.layout,
      title: matchedRoute.title,
    };

    try {
      for (const mw of this.middleware) {
        const result = await mw(routeContext, matchedRoute);
        if (result === false) return;
      }
    } catch (err) {
      console.error('[Router] Middleware error:', err);
      return;
    }

    if (this.currentCleanup) {
      try { await this.currentCleanup(); } catch (e) { /* ignore */ }
      this.currentCleanup = null;
    }

    this.currentRoute = routeContext;

    if (matchedRoute.title) {
      document.title = `${matchedRoute.title} | ${AppConfig.APP_NAME}`;
    }

    try {
      const cleanup = await matchedRoute.handler(routeContext);
      if (typeof cleanup === 'function') {
        this.currentCleanup = cleanup;
      }
    } catch (err) {
      console.error('[Router] Handler error:', err);
    }
  }
}

const router = new Router();

export { Router, router };
export default router;
