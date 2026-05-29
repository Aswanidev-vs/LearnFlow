import { createElement } from '../../utils/dom.js';
import { store } from '../../store/index.js';
import { UIActions } from '../../store/actions.js';
import AppConfig from '../../core/config.js';
import { icon } from '../../utils/icons.js';

export function renderNavbar(container) {
  const navbar = createElement('nav', { className: 'navbar' }, [
    createElement('div', { className: 'navbar__left' }, [
      createElement('button', {
        className: 'navbar__toggle btn btn--icon',
        innerHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
        onClick: () => UIActions.toggleSidebar(),
      }),
      createElement('a', { className: 'navbar__brand', href: '/' }, [
        createElement('span', { className: 'navbar__brand-icon', innerHTML: icon('bolt') }),
        createElement('span', { className: 'navbar__name', textContent: 'LearnFlow' }),
      ]),
    ]),
    createElement('div', { className: 'navbar__center' }, [
      createElement('div', { className: 'navbar__search' }, [
        (() => { const s = document.createElement('span'); s.className = 'navbar__search-icon'; s.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'; return s; })(),
        createElement('input', {
          className: 'navbar__search-input',
          type: 'text',
          placeholder: 'Search courses, topics...',
          id: 'global-search',
        }),
      ]),
    ]),
    createElement('div', { className: 'navbar__right' }, [
      createElement('button', {
        className: 'navbar__theme-toggle btn btn--icon',
        innerHTML: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
        onClick: () => {
          const current = store.getState('ui.theme');
          UIActions.setTheme(current === 'light' ? 'dark' : 'light');
        },
      }),
      createElement('button', {
        className: 'navbar__notifications btn btn--icon',
        innerHTML: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      }),
      createElement('div', { id: 'clerk-user-button', className: 'navbar__user' }),
    ]),
  ]);

  container.appendChild(navbar);
  return navbar;
}
