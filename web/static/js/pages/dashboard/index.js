import { createElement, clearElement } from '../../utils/dom.js';
import { dashboardService } from '../../services/index.js';
import { DashboardActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderStatCard, renderActivityItem } from '../../components/ui/cards.js';
import { renderProgressBar, renderSkeleton } from '../../components/ui/forms.js';
import router from '../../core/router.js';
import { formatRelativeTime } from '../../utils/format.js';
import { icon } from '../../utils/icons.js';

export async function renderDashboardPage(container) {
  clearElement(container);
  container.appendChild(renderSkeleton(4, 'card'));

  try {
    const data = await dashboardService.getDashboardData();
    DashboardActions.setStats(data.stats);
    DashboardActions.setRecentActivity(data.recentActivity);
    DashboardActions.setProgress(data.progress);
    renderDashboard(container, data);
  } catch (error) {
    container.innerHTML = '<p class="text-secondary" role="alert">Failed to load dashboard data.</p>';
  }
}

function renderDashboard(container, data) {
  clearElement(container);

  const page = createElement('div', { className: 'page-container' });

  const header = createElement('div', { className: 'dashboard-header' }, [
    createElement('div', {}, [
      createElement('h1', { className: 'dashboard-header__title font-display', textContent: 'Dashboard' }),
      createElement('p', { className: 'dashboard-header__subtitle', textContent: `Welcome back! Here's your learning overview.` }),
    ]),
    createElement('button', {
      className: 'btn btn--primary',
      textContent: 'Browse Courses',
      onClick: () => router.navigate('/courses'),
      'aria-label': 'Browse available courses',
    }),
  ]);

  const statsGrid = createElement('div', { className: 'dashboard-stats' }, [
    renderStatCard({ icon: 'books', value: data.stats.enrolledCourses, label: 'Enrolled Courses' }),
    renderStatCard({ icon: 'check', value: data.stats.completedLessons, label: 'Lessons Completed' }),
    renderStatCard({ icon: 'trophy', value: data.stats.certificates, label: 'Certificates' }),
    renderStatCard({ icon: 'fire', value: `${data.stats.streak} days`, label: 'Learning Streak' }),
  ]);

  const contentGrid = createElement('div', { className: 'dashboard-grid' });

  const leftColumn = createElement('div', { className: 'flex flex-col gap-6' });

  // --- Course Progress Section ---
  const progressSection = createElement('div', { className: 'card' }, [
    createElement('h2', { className: 'font-display text-xl font-semibold mb-4', textContent: 'Course Progress' }),
    createElement('div', { className: 'flex flex-col gap-4' },
      data.progress.map((p) =>
        createElement('div', {
          className: 'card card--interactive',
          onClick: () => router.navigate(`/courses/${p.courseId}`),
          role: 'link',
          tabIndex: 0,
          'aria-label': `Continue course: ${p.title}`,
        }, [
          createElement('div', { className: 'flex items-center justify-between mb-2' }, [
            createElement('h3', { className: 'font-semibold', textContent: p.title }),
            createElement('span', { className: 'text-muted text-sm', textContent: `${p.completedLessons}/${p.totalLessons} lessons` }),
          ]),
          renderProgressBar(p.progress),
        ])
      )
    ),
  ]);

  // --- Quick Actions Section ---
  const quickActions = createElement('div', { className: 'card' }, [
    createElement('h2', { className: 'font-display text-xl font-semibold mb-4', textContent: 'Quick Actions' }),
    createElement('div', { className: 'dashboard-stats', style: 'grid-template-columns: repeat(2, 1fr);' }, [
      createActionCard('robot', 'Ask AI Assistant', 'Get help with any topic', '/ai-assistant'),
      createActionCard('check', 'View Assessments', 'Check your submissions', '/assessments'),
      createActionCard('briefcase', 'Browse Gigs', 'Find freelance work', '/marketplace'),
      createActionCard('trophy', 'My Certificates', 'View earned certificates', '/certificates'),
    ]),
  ]);

  leftColumn.append(progressSection, quickActions);

  // --- Activity Section (right column) ---
  const activitySection = createElement('div', { className: 'card' }, [
    createElement('h2', { className: 'font-display text-xl font-semibold mb-4', textContent: 'Recent Activity' }),
    createElement('div', {},
      data.recentActivity.length > 0
        ? data.recentActivity.map((activity) => renderActivityItem(activity))
        : createElement('div', { className: 'empty-state', style: 'padding: var(--sp-8);' }, [
            createElement('span', { className: 'empty-state__icon', innerHTML: icon('clock') }),
            createElement('p', { className: 'empty-state__message', textContent: 'No activity yet' }),
            createElement('p', { className: 'empty-state__description', textContent: 'Start a course to see your progress here.' }),
          ])
    ),
  ]);

  contentGrid.append(leftColumn, activitySection);
  page.append(header, statsGrid, contentGrid);
  container.appendChild(page);
}

function createActionCard(iconName, title, description, path) {
  return createElement('div', {
    className: 'action-card',
    onClick: () => router.navigate(path),
    role: 'link',
    tabIndex: 0,
    'aria-label': `${title}: ${description}`,
  }, [
    createElement('span', { className: 'action-card__icon', innerHTML: icon(iconName), 'aria-hidden': 'true' }),
    createElement('h3', { className: 'action-card__title font-display', textContent: title }),
    createElement('p', { className: 'action-card__description', textContent: description }),
  ]);
}
