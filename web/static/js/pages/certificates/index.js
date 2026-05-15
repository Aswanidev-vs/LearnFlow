import { createElement, clearElement } from '../../utils/dom.js';
import { certificateService } from '../../services/index.js';
import { store } from '../../store/index.js';
import { renderEmptyState } from '../../components/ui/loading.js';
import { formatDate } from '../../utils/format.js';
import { icon } from '../../utils/icons.js';

export async function renderCertificatesPage(container) {
  clearElement(container);

  try {
    const certificates = await certificateService.getCertificates();
    store.setState('certificates.list', certificates);
    renderCertificates(container, certificates);
  } catch (error) {
    container.innerHTML = '<p class="error-text">Failed to load certificates.</p>';
  }
}

function renderCertificates(container, certificates) {
  clearElement(container);

  const page = createElement('div', { className: 'certificates-page' });

  const header = createElement('div', { className: 'certificates-page__header' }, [
    createElement('h1', { className: 'certificates-page__title', textContent: 'My Certificates' }),
    createElement('p', { className: 'certificates-page__subtitle', textContent: 'Your earned certifications and credentials.' }),
  ]);

  const list = createElement('div', { className: 'certificates-page__list' });

  if (certificates.length === 0) {
    list.appendChild(renderEmptyState("You haven't earned any certificates yet. Complete a course and pass the assessment to earn your first!", 'trophy'));
  } else {
    certificates.forEach((cert) => list.appendChild(renderCertificateCard(cert)));
  }

  page.append(header, list);
  container.appendChild(page);
}

function getCertUrl(cert) {
  const user = store.getState('auth.user') || {};
  const params = new URLSearchParams({
    name: user.fullName || user.email || 'Student',
    course: cert.courseName,
    score: String(cert.score),
    id: cert.credentialId,
    type: cert.type,
  });
  return `/api/v1/certificates/${cert.id}/download?${params}`;
}

function renderCertificateCard(cert) {
  const typeLabels = {
    course: 'Course Certificate',
    internship: 'Internship Certificate',
  };

  return createElement('div', { className: 'certificate-card card' }, [
    createElement('div', { className: 'certificate-card__badge' }, [
      createElement('div', { className: 'certificate-card__icon', innerHTML: icon('trophy') }),
      createElement('span', { className: `badge badge--${cert.type === 'course' ? 'success' : 'info'}`, textContent: typeLabels[cert.type] || cert.type }),
    ]),
    createElement('div', { className: 'certificate-card__content' }, [
      createElement('h3', { className: 'certificate-card__title', textContent: cert.courseName }),
      createElement('div', { className: 'certificate-card__details' }, [
        createElement('div', { className: 'certificate-card__detail' }, [
          createElement('span', { className: 'text-muted', textContent: 'Issued' }),
          createElement('span', { textContent: formatDate(cert.issuedAt) }),
        ]),
        createElement('div', { className: 'certificate-card__detail' }, [
          createElement('span', { className: 'text-muted', textContent: 'Score' }),
          createElement('span', { className: 'certificate-card__score', textContent: `${cert.score}/100` }),
        ]),
        createElement('div', { className: 'certificate-card__detail' }, [
          createElement('span', { className: 'text-muted', textContent: 'Credential ID' }),
          createElement('span', { className: 'certificate-card__credential', textContent: cert.credentialId }),
        ]),
      ]),
    ]),
    createElement('div', { className: 'certificate-card__actions' }, [
      createElement('button', {
        className: 'btn btn--outline',
        textContent: 'Preview',
        onClick: () => {
          const url = new URL(getCertUrl(cert), window.location.origin);
          url.searchParams.set('preview', '1');

          const a = document.createElement('a');
          a.href = url.toString();
          a.target = '_blank';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        },
      }),
      createElement('button', {
        className: 'btn btn--primary',
        textContent: 'Download PDF',
        onClick: async (e) => {
          const btn = e.currentTarget;
          const originalText = btn.textContent;
          btn.textContent = 'Generating...';
          btn.disabled = true;
          try {
            const res = await fetch(getCertUrl(cert), { credentials: 'same-origin' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate_${cert.credentialId}.pdf`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
          } catch (err) {
            console.error('PDF download error:', err);
          } finally {
            btn.textContent = originalText;
            btn.disabled = false;
          }
        },
      }),
      createElement('button', {
        className: 'btn btn--ghost',
        textContent: 'Share',
        onClick: () => {
          if (navigator.share) {
            navigator.share({
              title: `LearnFlow Certificate: ${cert.courseName}`,
              text: `I earned a certificate in ${cert.courseName} on LearnFlow!`,
              url: window.location.href,
            });
          } else {
            navigator.clipboard.writeText(window.location.href);
          }
        },
      }),
    ]),
  ]);
}
