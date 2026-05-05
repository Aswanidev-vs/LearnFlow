import { createElement, clearElement } from '../../utils/dom.js';

export function renderFormField({ id, label, type = 'text', placeholder = '', required = false, value = '' }) {
  return createElement('div', { className: 'form-group' }, [
    createElement('label', { className: 'form-label', for: id, textContent: label }),
    createElement('input', {
      className: 'form-input',
      type,
      id,
      name: id,
      placeholder,
      required: required ? 'required' : undefined,
      value,
    }),
  ]);
}

export function renderButton({ text, type = 'button', variant = 'primary', size = 'md', loading = false, disabled = false, onClick }) {
  const btn = createElement('button', {
    className: `btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''}`,
    type,
    textContent: loading ? '' : text,
    onClick,
  });
  if (disabled) btn.disabled = true;
  if (loading) btn.appendChild(createElement('div', { className: 'spinner spinner--sm' }));
  return btn;
}

export function renderPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return createElement('div');

  const container = createElement('div', { className: 'pagination' });

  const prevBtn = createElement('button', {
    className: `pagination__btn ${page <= 1 ? 'pagination__btn--disabled' : ''}`,
    textContent: '← Previous',
    onClick: () => page > 1 && onPageChange(page - 1),
  });
  if (page <= 1) prevBtn.disabled = true;

  const nextBtn = createElement('button', {
    className: `pagination__btn ${page >= totalPages ? 'pagination__btn--disabled' : ''}`,
    textContent: 'Next →',
    onClick: () => page < totalPages && onPageChange(page + 1),
  });
  if (page >= totalPages) nextBtn.disabled = true;

  const info = createElement('span', {
    className: 'pagination__info',
    textContent: `Page ${page} of ${totalPages}`,
  });

  container.append(prevBtn, info, nextBtn);
  return container;
}

export function renderProgressBar(percentage, showLabel = true) {
  return createElement('div', { className: 'progress-bar-wrapper' }, [
    createElement('div', { className: 'progress-bar' }, [
      createElement('div', { className: 'progress-bar__fill', style: `width: ${Math.min(100, percentage)}%` }),
    ]),
    showLabel && createElement('span', { className: 'progress-bar__label', textContent: `${Math.round(percentage)}%` }),
  ]);
}

export function renderBadge(text, variant = 'default') {
  return createElement('span', { className: `badge badge--${variant}`, textContent: text });
}

export function renderAvatar(src, name, size = 'md') {
  const avatar = createElement('div', { className: `avatar avatar--${size}` });
  if (src) {
    avatar.appendChild(createElement('img', { src, alt: name || '', className: 'avatar__img' }));
  } else {
    avatar.textContent = name ? name.charAt(0).toUpperCase() : '?';
  }
  return avatar;
}

export function renderSkeleton(count = 1, type = 'card') {
  const container = createElement('div', { className: 'skeleton-group' });
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      container.appendChild(
        createElement('div', { className: 'skeleton skeleton--card' }, [
          createElement('div', { className: 'skeleton__thumbnail' }),
          createElement('div', { className: 'skeleton__body' }, [
            createElement('div', { className: 'skeleton__line skeleton__line--short' }),
            createElement('div', { className: 'skeleton__line' }),
            createElement('div', { className: 'skeleton__line skeleton__line--medium' }),
          ]),
        ])
      );
    } else {
      container.appendChild(createElement('div', { className: `skeleton skeleton--${type}` }));
    }
  }
  return container;
}
