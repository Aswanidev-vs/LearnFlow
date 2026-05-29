import { createElement, clearElement } from '../../utils/dom.js';
import router from '../../core/router.js';
import { icon } from '../../utils/icons.js';

export function renderLandingPage(container) {
  clearElement(container);

  const page = createElement('div', { className: 'landing' });

  const header = createElement('header', { className: 'landing__header' }, [
    createElement('div', { className: 'landing__nav container' }, [
      createElement('a', { className: 'landing__brand', href: '/' }, [
        createElement('span', { className: 'landing__brand-icon', innerHTML: icon('bolt') }),
        createElement('span', { textContent: 'LearnFlow' }),
      ]),
      createElement('div', { className: 'landing__actions' }, [
        createElement('button', {
          className: 'btn btn--ghost',
          textContent: 'Sign In',
          onClick: () => router.navigate('/login'),
        }),
        createElement('button', {
          className: 'btn btn--primary',
          textContent: 'Get Started',
          onClick: () => router.navigate('/signup'),
        }),
      ]),
    ]),
  ]);

  const hero = createElement('section', { className: 'landing__hero container' }, [
    createElement('div', { className: 'landing__hero-content' }, [
      createElement('span', { className: 'landing__badge', innerHTML: `${icon('rocket')} Next-Gen Learning Platform` }),
      createElement('h1', { className: 'landing__hero-title' }, [
        document.createTextNode('Learn to Code. '),
        createElement('span', { className: 'text-gradient', textContent: 'Build Real Projects.' }),
        createElement('br'),
        document.createTextNode('Get Hired.'),
      ]),
      createElement('p', { className: 'landing__hero-description', textContent: 'LearnFlow combines structured courses with GitHub-based assessments, AI-powered code reviews, and an integrated freelancing marketplace. Go from student to professional.' }),
      createElement('div', { className: 'landing__hero-actions' }, [
        createElement('button', {
          className: 'btn btn--primary btn--lg',
          textContent: 'Start Learning Free',
          onClick: () => router.navigate('/signup'),
        }),
        createElement('button', {
          className: 'btn btn--outline btn--lg',
          textContent: 'Browse Courses',
          onClick: () => router.navigate('/courses'),
        }),
      ]),
    ]),
  ]);

  const features = createElement('section', { className: 'landing__features container' }, [
    createElement('h2', { className: 'landing__section-title', textContent: 'Why LearnFlow?' }),
    createElement('div', { className: 'landing__features-grid' }, [
      createFeatureCard('books', 'Structured Learning', 'Follow expert-designed curricula with video lessons, interactive exercises, and hands-on projects.'),
      createFeatureCard('check', 'GitHub Assessments', 'Submit real GitHub projects for evaluation. Get AI-powered code reviews with detailed feedback.'),
      createFeatureCard('robot', 'AI Assistant', 'Get 24/7 help from our AI tutor. Ask questions, get explanations, and receive personalized study plans.'),
      createFeatureCard('trophy', 'Dual Certifications', 'Earn both course completion and internship certificates to boost your resume.'),
      createFeatureCard('briefcase', 'Freelance Marketplace', 'Transition from learner to professional. Find gigs, build your portfolio, and earn while you learn.'),
      createFeatureCard('chart', 'Progress Tracking', 'Track your learning journey with detailed analytics, streaks, and weekly progress reports.'),
    ]),
  ]);

  const cta = createElement('section', { className: 'landing__cta' }, [
    createElement('div', { className: 'container' }, [
      createElement('h2', { className: 'landing__cta-title', textContent: 'Ready to Start Your Journey?' }),
      createElement('p', { className: 'landing__cta-description', textContent: 'Join thousands of developers learning, building, and getting hired through LearnFlow.' }),
      createElement('button', {
        className: 'btn btn--primary btn--lg',
        textContent: 'Get Started for Free',
        onClick: () => router.navigate('/signup'),
      }),
    ]),
  ]);

  page.append(header, hero, features, cta);
  container.appendChild(page);
}

function createFeatureCard(iconName, title, description) {
  return createElement('div', { className: 'feature-card' }, [
    createElement('span', { className: 'feature-card__icon', innerHTML: icon(iconName) }),
    createElement('h3', { className: 'feature-card__title', textContent: title }),
    createElement('p', { className: 'feature-card__description', textContent: description }),
  ]);
}
