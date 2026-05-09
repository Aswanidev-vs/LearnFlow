import { createElement } from '../../utils/dom.js';
import router from '../../core/router.js';
import { formatCurrency } from '../../utils/format.js';
import { icon } from '../../utils/icons.js';

export function renderCourseCard(course) {
  const card = createElement('div', { className: 'course-card' }, [
    createElement('div', { className: 'course-card__thumbnail' }, [
      createElement('div', {
        className: 'course-card__placeholder',
        innerHTML: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      }),
      course.level && createElement('span', { className: `course-card__badge course-card__badge--${course.level.toLowerCase()}`, textContent: course.level }),
    ]),
    createElement('div', { className: 'course-card__body' }, [
      createElement('span', { className: 'course-card__category', textContent: course.category }),
      createElement('h3', { className: 'course-card__title', textContent: course.title }),
      createElement('p', { className: 'course-card__description', textContent: course.description }),
      createElement('div', { className: 'course-card__meta' }, [
        createElement('span', { className: 'course-card__rating', textContent: `⭐ ${course.rating}` }),
        createElement('span', { className: 'course-card__students', textContent: `${(course.studentsCount / 1000).toFixed(1)}k students` }),
        createElement('span', { className: 'course-card__duration', textContent: course.duration }),
      ]),
      createElement('div', { className: 'course-card__footer' }, [
        createElement('div', { className: 'course-card__instructor' }, [
          createElement('div', { className: 'course-card__avatar avatar avatar--sm' }),
          createElement('span', { textContent: course.instructor.name }),
        ]),
        createElement('span', { className: 'course-card__price', textContent: course.enrolled ? 'Enrolled' : formatCurrency(course.price) }),
      ]),
      course.enrolled && course.progress > 0 && createElement('div', { className: 'course-card__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
          createElement('div', { className: 'progress-bar__fill', style: `width: ${course.progress}%` }),
        ]),
        createElement('span', { className: 'course-card__progress-text', textContent: `${course.progress}% complete` }),
      ]),
    ]),
  ]);

  card.addEventListener('click', () => router.navigate(`/courses/${course.id}`));
  return card;
}

export function renderGigCard(gig) {
  const card = createElement('div', { className: 'gig-card' }, [
    createElement('div', { className: 'gig-card__header' }, [
      createElement('div', { className: 'gig-card__client' }, [
        createElement('div', { className: 'avatar avatar--sm' }),
        createElement('div', {}, [
          createElement('span', { className: 'gig-card__client-name', textContent: gig.client.name }),
          gig.client.verified && createElement('span', { className: 'gig-card__verified', innerHTML: ` ${icon('check')} Verified` }),
        ]),
      ]),
      createElement('span', { className: `gig-card__status gig-card__status--${gig.status}`, textContent: gig.status }),
    ]),
    createElement('h3', { className: 'gig-card__title', textContent: gig.title }),
    createElement('p', { className: 'gig-card__description', textContent: gig.description }),
    createElement('div', { className: 'gig-card__skills' },
      gig.skills.map((skill) => createElement('span', { className: 'tag', textContent: skill }))
    ),
    createElement('div', { className: 'gig-card__footer' }, [
      createElement('span', { className: 'gig-card__budget', textContent: gig.budget.type === 'fixed' ? `${formatCurrency(gig.budget.min)} - ${formatCurrency(gig.budget.max)}` : `${formatCurrency(gig.budget.min)}/hr` }),
      createElement('span', { className: 'gig-card__duration', textContent: gig.duration }),
      createElement('span', { className: 'gig-card__proposals', textContent: `${gig.proposals} proposals` }),
    ]),
  ]);

  card.addEventListener('click', () => router.navigate(`/marketplace/${gig.id}`));
  return card;
}

export function renderStatCard(stat) {
  return createElement('div', { className: 'stat-card' }, [
    createElement('div', { className: 'stat-card__icon', innerHTML: icon(stat.icon) }),
    createElement('div', { className: 'stat-card__content' }, [
      createElement('span', { className: 'stat-card__value', textContent: stat.value }),
      createElement('span', { className: 'stat-card__label', textContent: stat.label }),
    ]),
  ]);
}

export function renderActivityItem(activity) {
  const icons = {
    lesson_completed: 'check',
    certificate_earned: 'trophy',
    assessment_submitted: 'pen',
    course_enrolled: 'books',
  };
  return createElement('div', { className: 'activity-item' }, [
    createElement('span', { className: 'activity-item__icon', innerHTML: icon(icons[activity.type] || 'pin') }),
    createElement('div', { className: 'activity-item__content' }, [
      createElement('p', { className: 'activity-item__title', textContent: activity.title }),
      createElement('span', { className: 'activity-item__time', textContent: formatRelativeTime(activity.timestamp) }),
    ]),
  ]);
}

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
