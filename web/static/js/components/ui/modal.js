import { createElement } from '../../utils/dom.js';
import { store } from '../../store/index.js';
import { UIActions } from '../../store/actions.js';

export function renderModal() {
  const overlay = createElement('div', { className: 'modal-overlay hidden', id: 'modal-overlay' });
  const modal = createElement('div', { className: 'modal', id: 'modal' });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) UIActions.closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') UIActions.closeModal();
  });

  store.subscribe('ui.activeModal', (modalData) => {
    if (modalData) {
      overlay.classList.remove('hidden');
      renderModalContent(modal, modalData);
      requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
    } else {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(() => overlay.classList.add('hidden'), 200);
    }
  });

  return overlay;
}

function renderModalContent(container, { id, data }) {
  container.innerHTML = '';

  if (id === 'confirm') {
    container.appendChild(
      createElement('div', { className: 'modal__body' }, [
        createElement('h3', { className: 'modal__title', textContent: data?.title || 'Confirm' }),
        createElement('p', { className: 'modal__text', textContent: data?.message || 'Are you sure?' }),
      ])
    );
    container.appendChild(
      createElement('div', { className: 'modal__footer' }, [
        createElement('button', {
          className: 'btn btn--ghost',
          textContent: 'Cancel',
          onClick: () => UIActions.closeModal(),
        }),
        createElement('button', {
          className: 'btn btn--primary',
          textContent: data?.confirmText || 'Confirm',
          onClick: () => {
            data?.onConfirm?.();
            UIActions.closeModal();
          },
        }),
      ])
    );
  } else if (id === 'proposal') {
    container.appendChild(createProposalModal(data));
  }
}

function createProposalModal(data) {
  const form = createElement('form', { className: 'modal__form' });
  const body = createElement('div', { className: 'modal__body' }, [
    createElement('h3', { className: 'modal__title', textContent: 'Submit Proposal' }),
    createElement('p', { className: 'modal__subtitle', textContent: data?.gigTitle || '' }),
    createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', for: 'proposal-cover', textContent: 'Cover Letter' }),
      createElement('textarea', { className: 'form-textarea', id: 'proposal-cover', rows: '5', placeholder: "Explain why you're a great fit..." }),
    ]),
    createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', for: 'proposal-rate', textContent: 'Your Rate ($)' }),
      createElement('input', { className: 'form-input', type: 'number', id: 'proposal-rate', placeholder: 'Enter your rate' }),
    ]),
    createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', for: 'proposal-timeline', textContent: 'Estimated Timeline' }),
      createElement('input', { className: 'form-input', type: 'text', id: 'proposal-timeline', placeholder: 'e.g., 2 weeks' }),
    ]),
  ]);
  const footer = createElement('div', { className: 'modal__footer' }, [
    createElement('button', { className: 'btn btn--ghost', type: 'button', textContent: 'Cancel', onClick: () => UIActions.closeModal() }),
    createElement('button', { className: 'btn btn--primary', type: 'submit', textContent: 'Submit Proposal' }),
  ]);
  form.append(body, footer);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cover = form.querySelector('#proposal-cover').value;
    const rate = form.querySelector('#proposal-rate').value;
    const timeline = form.querySelector('#proposal-timeline').value;
    data?.onSubmit?.({ coverLetter: cover, rate: Number(rate), timeline });
    UIActions.closeModal();
  });

  return form;
}

export function openConfirmModal(title, message, onConfirm, confirmText = 'Confirm') {
  UIActions.openModal('confirm', { title, message, onConfirm, confirmText });
}

export function openProposalModal(gigTitle, onSubmit) {
  UIActions.openModal('proposal', { gigTitle, onSubmit });
}
