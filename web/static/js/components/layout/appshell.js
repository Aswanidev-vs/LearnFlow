import { createElement, clearElement } from '../../utils/dom.js';
import { store } from '../../store/index.js';
import { renderNavbar } from './navbar.js';
import { renderSidebar } from './sidebar.js';
import { renderFooter } from './footer.js';
import { renderToastContainer } from '../ui/toast.js';

export function renderAppShell(root) {
  clearElement(root);

  const appShell = createElement('div', { className: 'app', id: 'app' });
  const mainLayout = createElement('div', { className: 'app__layout app__layout--authenticated' });
  const mainContent = createElement('main', { className: 'app__content', id: 'main-content' });
  const pageContainer = createElement('div', { className: 'page-container', id: 'page-container' });

  renderNavbar(mainLayout);
  renderSidebar(mainLayout);
  mainContent.appendChild(pageContainer);
  renderFooter(mainContent);
  mainLayout.appendChild(mainContent);
  appShell.appendChild(mainLayout);
  renderToastContainer(appShell);

  root.appendChild(appShell);

  mountClerkUserButton();

  return pageContainer;
}

export function renderPublicShell(root) {
  clearElement(root);
  const shell = createElement('div', { className: 'public-app', id: 'public-app' });
  const content = createElement('main', { className: 'public-app__content', id: 'main-content' });
  const pageContainer = createElement('div', { className: 'page-container', id: 'page-container' });

  content.appendChild(pageContainer);
  renderFooter(content);
  shell.appendChild(content);
  renderToastContainer(shell);

  root.appendChild(shell);
  return pageContainer;
}

export function switchToAppShell(root) {
  return renderAppShell(root);
}

export function switchToPublicShell(root) {
  return renderPublicShell(root);
}

async function mountClerkUserButton() {
  const btnContainer = document.getElementById('clerk-user-button');
  if (!btnContainer) return;
  try {
    const { authService } = await import('../../services/auth.js');
    if (authService.isInitialized && authService.clerk?.user) {
      authService.mountUserButton(btnContainer);
    }
  } catch (e) {
    // Clerk not available
  }
}
