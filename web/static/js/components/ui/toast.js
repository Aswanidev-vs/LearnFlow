import { createElement } from '../../utils/dom.js';
import { store } from '../../store/index.js';
import { UIActions } from '../../store/actions.js';

export function renderToastContainer(root) {
  const container = createElement('div', { className: 'toast-container', id: 'toast-container' });
  root.appendChild(container);

  store.subscribe('ui.toasts', (toasts) => {
    renderToasts(container, toasts);
  });

  return container;
}

function renderToasts(container, toasts) {
  container.innerHTML = '';
  toasts.forEach((toast) => {
    const el = createElement('div', {
      className: `toast toast--${toast.type}`,
      dataset: { id: toast.id },
    }, [
      createElement('span', { className: 'toast__icon', textContent: getToastIcon(toast.type) }),
      createElement('span', { className: 'toast__message', textContent: toast.message }),
      createElement('button', {
        className: 'toast__close',
        innerHTML: '&times;',
        onClick: () => UIActions.removeToast(toast.id),
      }),
    ]);
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--visible'));
  });
}

function getToastIcon(type) {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  return icons[type] || icons.info;
}
