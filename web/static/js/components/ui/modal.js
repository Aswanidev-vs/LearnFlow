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
  form.innerHTML = `
    <div class="modal__body">
      <h3 class="modal__title">Submit Proposal</h3>
      <p class="modal__subtitle">${data?.gigTitle || ''}</p>
      <div class="form-group">
        <label class="form-label" for="proposal-cover">Cover Letter</label>
        <textarea class="form-textarea" id="proposal-cover" rows="5" placeholder="Explain why you're a great fit..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="proposal-rate">Your Rate ($)</label>
        <input class="form-input" type="number" id="proposal-rate" placeholder="Enter your rate" />
      </div>
      <div class="form-group">
        <label class="form-label" for="proposal-timeline">Estimated Timeline</label>
        <input class="form-input" type="text" id="proposal-timeline" placeholder="e.g., 2 weeks" />
      </div>
    </div>
    <div class="modal__footer">
      <button type="button" class="btn btn--ghost" id="proposal-cancel">Cancel</button>
      <button type="submit" class="btn btn--primary">Submit Proposal</button>
    </div>
  `;

  form.querySelector('#proposal-cancel').addEventListener('click', () => UIActions.closeModal());
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
