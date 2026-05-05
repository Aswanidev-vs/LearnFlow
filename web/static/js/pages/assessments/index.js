import { createElement, clearElement } from '../../utils/dom.js';
import { assessmentService } from '../../services/index.js';
import { AssessmentActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderBadge } from '../../components/ui/forms.js';
import { renderEmptyState } from '../../components/ui/loading.js';
import { formatDate } from '../../utils/format.js';
import { UIActions } from '../../store/actions.js';
import AppConfig from '../../core/config.js';

export async function renderAssessmentsPage(container) {
  clearElement(container);

  try {
    const assessments = await assessmentService.getAssessments();
    AssessmentActions.setAssessments(assessments);
    renderAssessments(container, assessments);
  } catch (error) {
    container.innerHTML = '<p class="error-text">Failed to load assessments.</p>';
  }
}

function renderAssessments(container, assessments) {
  clearElement(container);

  const page = createElement('div', { className: 'assessments-page' });

  const header = createElement('div', { className: 'assessments-page__header' }, [
    createElement('h1', { className: 'assessments-page__title', textContent: 'Assessments' }),
    createElement('p', { className: 'assessments-page__subtitle', textContent: 'Submit your GitHub projects for AI-powered code review and scoring.' }),
  ]);

  const list = createElement('div', { className: 'assessments-page__list' });

  if (assessments.length === 0) {
    list.appendChild(renderEmptyState('No assessments available yet.', '📝'));
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

  return createElement('div', { className: 'assessment-card card' }, [
    createElement('div', { className: 'assessment-card__header' }, [
      createElement('div', {}, [
        createElement('span', { className: 'assessment-card__course', textContent: assessment.courseName }),
        createElement('h3', { className: 'assessment-card__title', textContent: assessment.title }),
      ]),
      renderBadge(status.label, status.variant),
    ]),
    createElement('p', { className: 'assessment-card__description', textContent: assessment.description }),
    createElement('div', { className: 'assessment-card__requirements' }, [
      createElement('h4', { textContent: 'Requirements:' }),
      createElement('ul', {},
        assessment.requirements.map((req) => createElement('li', { textContent: req }))
      ),
    ]),
    createElement('div', { className: 'assessment-card__footer' }, [
      createElement('div', { className: 'assessment-card__dates' }, [
        assessment.dueDate && createElement('span', { textContent: `Due: ${formatDate(assessment.dueDate)}` }),
        assessment.submittedAt && createElement('span', { textContent: `Submitted: ${formatDate(assessment.submittedAt)}` }),
      ]),
      assessment.score !== null && createElement('div', { className: `assessment-card__score ${assessment.score >= AppConfig.ASSESSMENT_PASS_SCORE ? 'assessment-card__score--pass' : 'assessment-card__score--fail'}` }, [
        createElement('span', { className: 'assessment-card__score-value', textContent: `${assessment.score}/100` }),
        createElement('span', { textContent: assessment.score >= AppConfig.ASSESSMENT_PASS_SCORE ? '✓ Passed' : '✕ Failed' }),
      ]),
    ]),
    assessment.status === 'not_submitted' && renderSubmissionForm(assessment),
  ]);
}

function renderSubmissionForm(assessment) {
  const form = createElement('form', { className: 'assessment-card__submit' }, [
    createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'GitHub Repository URL' }),
      createElement('input', {
        className: 'form-input',
        type: 'url',
        placeholder: 'https://github.com/username/repository',
        id: `github-url-${assessment.id}`,
        required: 'required',
      }),
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

      const list = form.closest('.assessments-page__list');
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
