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
    container.innerHTML = '<p class="error-text">Failed to load dashboard data.</p>';
  }
}

function renderDashboard(container, data) {
  clearElement(container);

  const page = createElement('div', { className: 'dashboard' });

  const header = createElement('div', { className: 'dashboard__header' }, [
    createElement('div', {}, [
      createElement('h1', { className: 'dashboard__title', textContent: 'Dashboard' }),
      createElement('p', { className: 'dashboard__greeting', textContent: `Welcome back! Here's your learning overview.` }),
    ]),
    createElement('button', {
      className: 'btn btn--primary',
      textContent: 'Browse Courses',
      onClick: () => router.navigate('/courses'),
    }),
  ]);

  const statsGrid = createElement('div', { className: 'dashboard__stats' }, [
    renderStatCard({ icon: 'books', value: data.stats.enrolledCourses, label: 'Enrolled Courses' }),
    renderStatCard({ icon: 'check', value: data.stats.completedLessons, label: 'Lessons Completed' }),
    renderStatCard({ icon: 'trophy', value: data.stats.certificates, label: 'Certificates' }),
    renderStatCard({ icon: 'fire', value: `${data.stats.streak} days`, label: 'Learning Streak' }),
  ]);

  const content = createElement('div', { className: 'dashboard__content' });

  const progressSection = createElement('div', { className: 'dashboard__section' }, [
    createElement('h2', { className: 'dashboard__section-title', textContent: 'Course Progress' }),
    createElement('div', { className: 'dashboard__progress-list' },
      data.progress.map((p) =>
        createElement('div', {
          className: 'dashboard__progress-item card',
          onClick: () => router.navigate(`/courses/${p.courseId}`),
        }, [
          createElement('div', { className: 'dashboard__progress-info' }, [
            createElement('h3', { textContent: p.title }),
            createElement('span', { className: 'text-muted', textContent: `${p.completedLessons}/${p.totalLessons} lessons` }),
          ]),
          renderProgressBar(p.progress),
        ])
      )
    ),
  ]);

  const activitySection = createElement('div', { className: 'dashboard__section' }, [
    createElement('h2', { className: 'dashboard__section-title', textContent: 'Recent Activity' }),
    createElement('div', { className: 'dashboard__activity-list' },
      data.recentActivity.map((activity) => renderActivityItem(activity))
    ),
  ]);

  const quickActions = createElement('div', { className: 'dashboard__section' }, [
    createElement('h2', { className: 'dashboard__section-title', textContent: 'Quick Actions' }),
    createElement('div', { className: 'dashboard__actions-grid' }, [
      createActionCard('robot', 'Ask AI Assistant', 'Get help with any topic', '/ai-assistant'),
      createActionCard('check', 'View Assessments', 'Check your submissions', '/assessments'),
      createActionCard('briefcase', 'Browse Gigs', 'Find freelance work', '/marketplace'),
      createActionCard('trophy', 'My Certificates', 'View earned certificates', '/certificates'),
    ]),
  ]);

  content.append(progressSection, activitySection, quickActions);
  page.append(header, statsGrid, content);
  container.appendChild(page);
}

function createActionCard(iconName, title, description, path) {
  return createElement('div', {
    className: 'action-card card',
    onClick: () => router.navigate(path),
  }, [
    createElement('span', { className: 'action-card__icon', innerHTML: icon(iconName) }),
    createElement('h3', { className: 'action-card__title', textContent: title }),
    createElement('p', { className: 'action-card__description', textContent: description }),
  ]);
}
