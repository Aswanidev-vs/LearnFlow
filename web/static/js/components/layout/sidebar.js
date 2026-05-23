import { createElement, show, hide } from '../../utils/dom.js';
import { store } from '../../store/index.js';
import { UIActions } from '../../store/actions.js';
import router from '../../core/router.js';
import { icon } from '../../utils/icons.js';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'chart', path: '/dashboard' },
  { label: 'Courses', icon: 'books', path: '/courses' },
  { label: 'Assessments', icon: 'check', path: '/assessments' },
  { label: 'AI Assistant', icon: 'robot', path: '/ai-assistant' },
  { label: 'Marketplace', icon: 'briefcase', path: '/marketplace' },
  { label: 'Certificates', icon: 'trophy', path: '/certificates' },
  { label: 'Profile', icon: 'user', path: '/profile' },
];

export function renderSidebar(container) {
  const sidebar = createElement('aside', { className: 'sidebar', id: 'sidebar' }, [
    createElement('nav', { className: 'sidebar__nav' }, [
      createElement('ul', { className: 'sidebar__list' },
        NAV_ITEMS.map((item) =>
          createElement('li', { className: 'sidebar__item' }, [
            createElement('a', {
              className: 'sidebar__link',
              href: item.path,
              dataset: { path: item.path },
              onClick: (e) => {
                e.preventDefault();
                router.navigate(item.path);
                if (window.innerWidth < 768) UIActions.toggleSidebar(false);
              },
            }, [
              createElement('span', { className: 'sidebar__icon', innerHTML: icon(item.icon) }),
              createElement('span', { className: 'sidebar__label', textContent: item.label }),
            ]),
          ])
        )
      ),
    ]),
    createElement('div', { className: 'sidebar__footer' }, [
      createElement('button', {
        className: 'sidebar__logout btn btn--ghost btn--full',
        onClick: async () => {
          const { authService } = await import('../../services/auth.js');
          await authService.signOut();
          router.navigate('/login');
        },
      }, [
        createElement('span', { className: 'sidebar__icon', innerHTML: icon('logout') }),
        createElement('span', { className: 'sidebar__label', textContent: 'Sign Out' }),
      ]),
    ]),
  ]);

  const overlay = createElement('div', {
    className: 'sidebar-overlay hidden',
    id: 'sidebar-overlay',
    onClick: () => UIActions.toggleSidebar(false),
  });

  container.appendChild(sidebar);
  container.appendChild(overlay);

  store.subscribe('ui.sidebarOpen', (isOpen) => {
    sidebar.classList.toggle('sidebar--open', isOpen);
    overlay.classList.toggle('sidebar-overlay--visible', isOpen);
  });

  const isAuth = store.getState('auth.isAuthenticated');
  if (!isAuth) {
    sidebar.classList.add('hidden');
  }

  store.subscribe('auth.isAuthenticated', (auth) => {
    sidebar.classList.toggle('hidden', !auth);
  });

  return sidebar;
}

export function highlightActiveLink(path) {
  document.querySelectorAll('.sidebar__link').forEach((link) => {
    const linkPath = link.dataset.path;
    link.classList.toggle('sidebar__link--active', path === linkPath || path.startsWith(linkPath + '/'));
  });
}
