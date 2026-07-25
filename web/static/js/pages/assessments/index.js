import { createElement, clearElement } from '../../utils/dom.js';
import { assessmentService } from '../../services/index.js';
import { AssessmentActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderBadge } from '../../components/ui/forms.js';
import { renderEmptyState } from '../../components/ui/loading.js';
import { formatDate } from '../../utils/format.js';
import { UIActions } from '../../store/actions.js';
import AppConfig from '../../core/config.js';
import { icon } from '../../utils/icons.js';

export async function renderAssessmentsPage(container) {
  clearElement(container);

  try {
    const assessments = await assessmentService.getAssessments();
    AssessmentActions.setAssessments(assessments);
    renderAssessments(container, assessments);
  } catch (error) {
    container.innerHTML = '<p class="text-secondary" role="alert">Failed to load assessments.</p>';
  }
}

function renderAssessments(container, assessments) {
  clearElement(container);

  const page = createElement('div', { className: 'page-container' });

  const header = createElement('div', { className: 'mb-6' }, [
    createElement('h1', { className: 'font-display text-3xl font-bold mb-2', textContent: 'Assessments' }),
    createElement('p', { className: 'text-secondary', textContent: 'Submit your GitHub projects for AI-powered code review and scoring.' }),
  ]);

  const list = createElement('div', { className: 'flex flex-col gap-6', role: 'list', 'aria-label': 'Assessment list' });

  if (assessments.length === 0) {
    list.appendChild(renderEmptyState('No assessments available yet.', 'pen'));
  } else {
    assessments.forEach((assessment) => list.appendChild(renderAssessmentCard(assessment)));
  }

  page.append(header, list);
  container.appendChild(page);
}

function renderAssessmentCard(assessment) {
  const statusMap = {
    not_submitted: { label: 'Not Submitted', variant: 'default' },
    submitted: { label: 'Under Review', variant: 'warning' },
    reviewed: { label: 'Reviewed', variant: 'info' },
    passed: { label: 'Passed', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
  };

  const status = statusMap[assessment.status] || statusMap.not_submitted;

  return createElement('div', { className: 'card', role: 'listitem', 'aria-label': `Assessment: ${assessment.title}` }, [
    createElement('div', { className: 'flex items-center justify-between mb-3' }, [
      createElement('div', {}, [
        createElement('span', { className: 'text-xs text-accent font-semibold uppercase', style: 'letter-spacing: var(--tracking-widest);', textContent: assessment.courseName }),
        createElement('h3', { className: 'font-display text-xl font-semibold mt-1', textContent: assessment.title }),
      ]),
      renderBadge(status.label, status.variant),
    ]),
    createElement('p', { className: 'text-secondary text-sm mb-4', textContent: assessment.description }),
    createElement('div', { className: 'card mb-4', style: 'padding: var(--sp-4); background: var(--bg-muted);' }, [
      createElement('h4', { className: 'text-xs font-semibold text-muted uppercase mb-2', style: 'letter-spacing: var(--tracking-widest);', textContent: 'Requirements:' }),
      createElement('ul', { className: 'flex flex-col gap-2' },
        assessment.requirements.map((req) => createElement('li', { className: 'text-secondary text-sm', textContent: req }))
      ),
    ]),
    createElement('div', { className: 'flex items-center justify-between pt-4', style: 'border-top: 1px solid var(--border-default);' }, [
      createElement('div', { className: 'flex items-center gap-4 text-sm text-muted' }, [
        assessment.dueDate && createElement('span', { textContent: `Due: ${formatDate(assessment.dueDate)}` }),
        assessment.submittedAt && createElement('span', { textContent: `Submitted: ${formatDate(assessment.submittedAt)}` }),
      ]),
      assessment.score !== null && createElement('div', {
        className: `badge ${assessment.score >= AppConfig.ASSESSMENT_PASS_SCORE ? 'badge--success' : 'badge--error'}`,
      }, [
        createElement('span', { textContent: `${assessment.score}/100 ` }),
        createElement('span', { innerHTML: assessment.score >= AppConfig.ASSESSMENT_PASS_SCORE ? `${icon('check')} Passed` : '✕ Failed' }),
      ]),
    ]),
    assessment.status === 'not_submitted' && renderSubmissionForm(assessment),
  ]);
}

function renderSubmissionForm(assessment) {
  const form = createElement('form', { className: 'mt-6 pt-6', style: 'border-top: 1px solid var(--border-default);' }, [
    createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', htmlFor: `github-url-${assessment.id}`, textContent: 'GitHub Repository URL' }),
      createElement('input', {
        className: 'form-input',
        type: 'url',
        placeholder: 'https://github.com/username/repository',
        id: `github-url-${assessment.id}`,
        required: 'required',
        'aria-describedby': `github-hint-${assessment.id}`,
      }),
      createElement('p', { className: 'text-muted text-xs mt-2', id: `github-hint-${assessment.id}`, textContent: 'Paste the full URL to your GitHub repository.' }),
    ]),
    createElement('button', {
      className: 'btn btn--primary',
      type: 'submit',
      textContent: 'Submit for Review',
    }),
  ]);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector(`#github-url-${assessment.id}`);
    const githubUrl = input.value;

    if (!githubUrl.includes('github.com')) {
      UIActions.addToast('Please enter a valid GitHub URL', 'error');
      return;
    }

    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      await assessmentService.submitAssessment(assessment.id, githubUrl);
      assessment.status = 'submitted';
      assessment.githubUrl = githubUrl;
      assessment.submittedAt = Date.now();
      UIActions.addToast('Assessment submitted successfully!', 'success');

      const list = form.closest('[role="list"]');
      if (list) {
        list.innerHTML = '';
        const assessments = store.getState('assessments.list');
        assessments.forEach((a) => list.appendChild(renderAssessmentCard(a)));
      }
    } catch (err) {
      UIActions.addToast('Failed to submit assessment', 'error');
      btn.disabled = false;
      btn.textContent = 'Submit for Review';
    }
  });

  return form;
}
