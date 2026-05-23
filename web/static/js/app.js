import router from './core/router.js';
import { store } from './store/index.js';
import { UIActions, AuthActions } from './store/actions.js';
import authService from './services/auth.js';
import { renderAppShell, renderPublicShell, switchToAppShell, switchToPublicShell } from './components/layout/appshell.js';
import { renderModal } from './components/ui/modal.js';
import { highlightActiveLink } from './components/layout/sidebar.js';
import { icon } from './utils/icons.js';

import { renderLandingPage } from './pages/landing/index.js';
import { renderLoginPage, renderSignupPage } from './components/auth/authPages.js';
import { renderDashboardPage } from './pages/dashboard/index.js';
import { renderCoursesPage, renderCourseDetailPage } from './pages/courses/index.js';
import { renderLessonPage } from './pages/lessons/index.js';
import { renderAssessmentsPage } from './pages/assessments/index.js';
import { renderAIChatPage } from './pages/ai/index.js';
import { renderMarketplacePage, renderGigDetailPage } from './pages/marketplace/index.js';
import { renderProfilePage } from './pages/profile/index.js';
import { renderCertificatesPage } from './pages/certificates/index.js';

console.log('[LF] app.js loaded');

const root = document.getElementById('root');
let currentLayout = null;

function applyTheme() {
  const saved = localStorage.getItem('lf_theme') || 'dark';
  UIActions.setTheme(saved);
}

function getPageContainer() {
  return document.getElementById('page-container');
}

function ensureLayout(layoutType) {
  if (currentLayout === layoutType) {
    return getPageContainer();
  }
  currentLayout = layoutType;
  console.log('[LF] Switching to layout:', layoutType);
  if (layoutType === 'public') {
    return switchToPublicShell(root);
  }
  return switchToAppShell(root);
}

let authReady = false;
let authResolve = null;
const authReadyPromise = new Promise((r) => { authResolve = r; });

async function authMiddleware(ctx, route) {
  if (!authReady) {
    await Promise.race([
      authReadyPromise,
      new Promise((r) => setTimeout(r, 5000)),
    ]);
  }

  if (route.auth) {
    const isAuth = store.getState('auth.isAuthenticated');
    const isLoading = store.getState('auth.isLoading');
    if (isLoading) {
      await new Promise((resolve) => {
        const unsub = store.subscribe('auth.isLoading', (loading) => {
          if (!loading) { unsub(); resolve(); }
        });
        setTimeout(() => { unsub(); resolve(); }, 3000);
      });
    }
    if (!store.getState('auth.isAuthenticated')) {
      router.navigate('/login', { replace: true });
      return false;
    }
  } else if (route.pattern === '/login' || route.pattern === '/signup') {
    if (store.getState('auth.isAuthenticated')) {
      router.navigate('/dashboard', { replace: true });
      return false;
    }
  }
  return true;
}

async function syncBackendSession() {
  try {
    const user = authService.getUser();
    if (!user?.email) return;
    await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: user.email, password: 'oauth-session-sync' }),
    });
  } catch (e) {
    console.warn('[LF] Backend session sync failed:', e.message);
  }
}

function createRouteHandler(renderFn, layoutType) {
  return async (ctx) => {
    console.log('[LF] Route:', ctx.path, 'layout:', layoutType);
    const pageContainer = ensureLayout(layoutType);
    if (layoutType !== 'public') {
      highlightActiveLink(ctx.path);
    }
    try {
      await renderFn(pageContainer, ctx);
      console.log('[LF] Rendered:', ctx.path);
    } catch (err) {
      console.error('[LF] Render error:', ctx.path, err);

      // Keep error UX consistent with the design system.
      const message = (err && err.message) ? err.message : 'Unknown render error';

      pageContainer.innerHTML = `
        <div class="empty-state" role="alert" aria-live="polite">
          <span class="empty-state__icon">${icon('alert')}</span>
          <p class="empty-state__message">We couldn't load this page.</p>

          <div style="margin-top: 0.75rem; max-width: 720px;">
            <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: 0.5rem;">
              Error: ${message}
            </p>

            <details>
              <summary style="cursor: pointer; font-size: var(--text-xs); color: var(--text-secondary);">
                View technical details
              </summary>
              <pre style="margin-top: 0.75rem; padding: 1rem; border: 1px solid var(--border-default); border-radius: var(--radius-md); overflow: auto; background: var(--bg-muted);">
${(err && err.stack) ? err.stack : ''}
              </pre>
            </details>

            <a href="/" class="btn btn--primary" style="margin-top: 1rem; display: inline-block;">
              Go Home
            </a>
          </div>
        </div>
      `;
    }
  };
}

function initRouter() {
  console.log('[LF] Registering routes...');

  router.use(authMiddleware);

  router.register('/', {
    handler: createRouteHandler((c) => renderLandingPage(c), 'public'),
    title: 'Home',
    layout: 'public',
  });

  router.register('/login', {
    handler: createRouteHandler((c) => renderLoginPage(c), 'public'),
    title: 'Sign In',
    layout: 'public',
  });

  router.register('/login/sso-callback', {
    handler: createRouteHandler(async (c, ctx) => {
      await authService.init();
      
      const result = await authService.handleRedirectCallback();
      if (result.success) {
        await syncBackendSession();
        router.navigate('/dashboard', { replace: true });
      } else {
        console.error('[OAuth] Callback failed:', result.error);
        router.navigate('/login', { replace: true });
      }
    }, 'public'),
    title: 'Signing In...',
    layout: 'public',
  });

  router.register('/signup', {
    handler: createRouteHandler((c) => renderSignupPage(c), 'public'),
    title: 'Sign Up',
    layout: 'public',
  });

  router.register('/dashboard', {
    handler: createRouteHandler((c) => renderDashboardPage(c), 'app'),
    title: 'Dashboard',
    auth: true,
  });

  router.register('/courses', {
    handler: createRouteHandler((c) => renderCoursesPage(c), 'app'),
    title: 'Courses',
    auth: true,
  });

  router.register('/courses/:id', {
    handler: createRouteHandler((c, ctx) => renderCourseDetailPage(c, ctx.params.id), 'app'),
    title: 'Course Details',
    auth: true,
  });

  router.register('/courses/:courseId/lessons/:lessonId', {
    handler: createRouteHandler((c, ctx) => renderLessonPage(c, ctx.params), 'app'),
    title: 'Lesson',
    auth: true,
  });

  router.register('/assessments', {
    handler: createRouteHandler((c) => renderAssessmentsPage(c), 'app'),
    title: 'Assessments',
    auth: true,
  });

  router.register('/ai-assistant', {
    handler: createRouteHandler((c) => renderAIChatPage(c), 'app'),
    title: 'AI Assistant',
    auth: true,
  });

  router.register('/marketplace', {
    handler: createRouteHandler((c) => renderMarketplacePage(c), 'app'),
    title: 'Marketplace',
    auth: true,
  });

  router.register('/marketplace/:id', {
    handler: createRouteHandler((c, ctx) => renderGigDetailPage(c, ctx.params.id), 'app'),
    title: 'Gig Details',
    auth: true,
  });

  router.register('/profile', {
    handler: createRouteHandler((c) => renderProfilePage(c), 'app'),
    title: 'Profile',
    auth: true,
  });

  router.register('/certificates', {
    handler: createRouteHandler((c) => renderCertificatesPage(c), 'app'),
    title: 'Certificates',
    auth: true,
  });

  router.register('*', {
    handler: createRouteHandler((c) => {
      c.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">${icon('search')}</span>
          <p class="empty-state__message">Page not found</p>
          <a href="/" class="btn btn--primary" style="margin-top: 1rem;">Go Home</a>
        </div>
      `;
    }, 'public'),
    title: '404',
  });

  console.log('[LF] Starting router...');
  router.start();
  console.log('[LF] Router started');
}

function interceptLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    e.preventDefault();
    router.navigate(href);
  });
}

async function init() {
  console.log('[LF] init() start');
  applyTheme();
  interceptLinks();
  renderModal();

  console.log('[LF] Initializing auth...');
  try {
    // Ensure auth state is stable before we let middleware/routes render app shell.
    await authService.init();
  } catch (e) {
    console.warn('[LF] Auth init skipped:', e.message);
    AuthActions.setLoading(false);
  }

  authReady = true;
  if (authResolve) authResolve();

  console.log('[LF] Starting router (after auth)...');
  initRouter();

  console.log('[LF] init() done');
}

init().catch(err => {
  console.error('[LF] init() failed:', err);
});
