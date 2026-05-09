import { createElement, clearElement } from '../../utils/dom.js';
import { icon } from '../../utils/icons.js';

const PASSWORD_RULES = [
  { id: 'minLength', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
  { id: 'symbol', label: 'One special character (!@#$...)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function validatePassword(value) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(value),
  }));
}

export function isPasswordValid(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export function getPasswordStrength(value) {
  if (!value) return { score: 0, label: '', color: '' };
  const passed = PASSWORD_RULES.filter((r) => r.test(value)).length;
  if (passed <= 1) return { score: 1, label: 'Weak', color: 'var(--color-error)' };
  if (passed <= 2) return { score: 2, label: 'Fair', color: 'var(--color-warning)' };
  if (passed <= 4) return { score: 3, label: 'Good', color: 'var(--color-info)' };
  return { score: 4, label: 'Strong', color: 'var(--color-success)' };
}

function updateStrengthBar(container, value) {
  const strength = getPasswordStrength(value);
  container.innerHTML = '';
  const bar = createElement('div', { className: 'password-strength__bar' });
  const fill = createElement('div', {
    className: 'password-strength__fill',
    style: `width: ${(strength.score / 4) * 100}%; background-color: ${strength.color}`,
  });
  bar.appendChild(fill);
  container.appendChild(bar);
  if (strength.label) {
    container.appendChild(createElement('span', {
      className: 'password-strength__label',
      style: `color: ${strength.color}`,
      textContent: strength.label,
    }));
  }
}

function updateChecklist(container, value) {
  const results = validatePassword(value || '');
  container.innerHTML = '';
  results.forEach((rule) => {
    const item = createElement('div', {
      className: `password-checklist__item ${rule.passed ? 'password-checklist__item--passed' : ''}`,
    }, [
      createElement('span', {
        className: 'password-checklist__icon',
        innerHTML: rule.passed ? icon('check') : icon('circle'),
      }),
      createElement('span', {
        className: 'password-checklist__label',
        textContent: rule.label,
      }),
    ]);
    container.appendChild(item);
  });
}

export function createPasswordField({ id, label, placeholder, required = true }) {
  const wrapper = createElement('div', { className: 'form-group password-field-wrapper' });

  const labelEl = createElement('label', { className: 'form-label', for: id, textContent: label });

  const inputGroup = createElement('div', { className: 'password-input-group' });

  const input = createElement('input', {
    className: 'form-input password-input',
    type: 'password',
    id,
    name: id,
    placeholder: placeholder || '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
    required: required ? 'required' : undefined,
    autocomplete: id === 'password' ? 'new-password' : 'current-password',
  });

  const toggleBtn = createElement('button', {
    className: 'password-toggle',
    type: 'button',
    tabindex: '-1',
    'aria-label': 'Toggle password visibility',
  });
  toggleBtn.innerHTML = `<svg class="password-toggle__icon password-toggle__icon--show" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><svg class="password-toggle__icon password-toggle__icon--hide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  toggleBtn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggleBtn.querySelector('.password-toggle__icon--show').style.display = isPassword ? 'none' : 'block';
    toggleBtn.querySelector('.password-toggle__icon--hide').style.display = isPassword ? 'block' : 'none';
    input.focus();
  });

  inputGroup.append(input, toggleBtn);

  const strengthContainer = createElement('div', { className: 'password-strength' });
  const checklistContainer = createElement('div', { className: 'password-checklist' });

  wrapper.append(labelEl, inputGroup, strengthContainer, checklistContainer);

  updateStrengthBar(strengthContainer, '');
  updateChecklist(checklistContainer, '');

  input.addEventListener('input', () => {
    updateStrengthBar(strengthContainer, input.value);
    updateChecklist(checklistContainer, input.value);
  });

  return { element: wrapper, input, isValid: () => isPasswordValid(input.value) };
}
