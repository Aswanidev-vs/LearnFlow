import { createElement } from '../../utils/dom.js';
import { icon } from '../../utils/icons.js';

export function renderLoadingSpinner(size = 'md') {
  return createElement('div', { className: `spinner spinner--${size}` }, [
    createElement('div', { className: 'spinner__circle' }),
  ]);
}

export function renderPageLoader() {
  return createElement('div', { className: 'page-loader' }, [
    renderLoadingSpinner('lg'),
    createElement('p', { className: 'page-loader__text', textContent: 'Loading...' }),
  ]);
}

export function renderEmptyState(message, iconName = 'inbox') {
  return createElement('div', { className: 'empty-state' }, [
    createElement('span', { className: 'empty-state__icon', innerHTML: icon(iconName) }),
    createElement('p', { className: 'empty-state__message', textContent: message }),
  ]);
}

export function renderErrorState(message, onRetry = null) {
  const container = createElement('div', { className: 'error-state' }, [
    createElement('span', { className: 'error-state__icon', innerHTML: icon('alert') }),
    createElement('p', { className: 'error-state__message', textContent: message }),
  ]);
  if (onRetry) {
    container.appendChild(
      createElement('button', {
        className: 'btn btn--primary',
        textContent: 'Try Again',
        onClick: onRetry,
      })
    );
  }
  return container;
}
