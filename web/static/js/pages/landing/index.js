import { createElement, clearElement } from '../../utils/dom.js';
import router from '../../core/router.js';
import { icon } from '../../utils/icons.js';

export function renderLandingPage(container) {
  clearElement(container);

  const page = createElement('div', { className: 'public-app' });

  // --- Navbar ---
  const navbar = createElement('nav', { className: 'navbar', role: 'navigation', 'aria-label': 'Main navigation' }, [
    createElement('div', { className: 'navbar__left' }, [
      createElement('a', { className: 'navbar__brand', href: '/', 'aria-label': 'LearnFlow Home' }, [
        createElement('span', { className: 'navbar__brand-icon', innerHTML: icon('bolt') }),
        createElement('span', { textContent: 'LearnFlow' }),
      ]),
    ]),
    createElement('div', { className: 'navbar__right' }, [
      createElement('button', {
        className: 'btn btn--ghost',
        textContent: 'Sign In',
        onClick: () => router.navigate('/login'),
        'aria-label': 'Sign in to your account',
      }),
      createElement('button', {
        className: 'btn btn--primary',
        textContent: 'Get Started',
        onClick: () => router.navigate('/signup'),
        'aria-label': 'Create a new account',
      }),
    ]),
  ]);

  // --- Hero Section ---
  const hero = createElement('section', { className: 'landing-hero container', 'aria-labelledby': 'hero-title' }, [
    createElement('span', { className: 'landing-hero__badge', innerHTML: `${icon('rocket')} Next-Gen Learning Platform` }),
    createElement('h1', { className: 'landing-hero__title font-display', id: 'hero-title' }, [
      document.createTextNode('Learn to Code. '),
      createElement('span', { className: 'text-gradient', textContent: 'Build Real Projects.' }),
      createElement('br'),
      document.createTextNode('Get Hired.'),
    ]),
    createElement('p', { className: 'landing-hero__description', textContent: 'LearnFlow combines structured courses with GitHub-based assessments, AI-powered code reviews, and an integrated freelancing marketplace. Go from student to professional.' }),
    createElement('div', { className: 'landing-hero__actions' }, [
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
  ]);

  // --- Features Section ---
  const features = createElement('section', { className: 'landing-features container', 'aria-labelledby': 'features-title' }, [
    createElement('h2', { className: 'landing-features__title font-display', id: 'features-title', textContent: 'Why LearnFlow?' }),
    createElement('div', { className: 'landing-features__grid' }, [
      createFeatureCard('books', 'Structured Learning', 'Follow expert-designed curricula with video lessons, interactive exercises, and hands-on projects.'),
      createFeatureCard('check', 'GitHub Assessments', 'Submit real GitHub projects for evaluation. Get AI-powered code reviews with detailed feedback.'),
      createFeatureCard('robot', 'AI Assistant', 'Get 24/7 help from our AI tutor. Ask questions, get explanations, and receive personalized study plans.'),
      createFeatureCard('trophy', 'Dual Certifications', 'Earn both course completion and internship certificates to boost your resume.'),
      createFeatureCard('briefcase', 'Freelance Marketplace', 'Transition from learner to professional. Find gigs, build your portfolio, and earn while you learn.'),
      createFeatureCard('chart', 'Progress Tracking', 'Track your learning journey with detailed analytics, streaks, and weekly progress reports.'),
    ]),
  ]);

  // --- CTA Section ---
  const cta = createElement('section', { className: 'landing-features container', style: 'padding: var(--sp-16) 0;', 'aria-labelledby': 'cta-title' }, [
    createElement('div', {
      className: 'card',
      style: 'text-align: center; padding: var(--sp-16) var(--sp-8); background: linear-gradient(135deg, rgba(0,229,255,0.05), rgba(10,22,40,0.8)); border-color: rgba(0,229,255,0.15); box-shadow: var(--shadow-glow-lg);',
    }, [
      createElement('h2', { className: 'font-display text-3xl font-bold', id: 'cta-title', textContent: 'Ready to Start Your Journey?' }),
      createElement('p', { className: 'text-secondary text-lg', style: 'max-width: 500px; margin: var(--sp-4) auto var(--sp-6);', textContent: 'Join thousands of developers learning, building, and getting hired through LearnFlow.' }),
      createElement('button', {
        className: 'btn btn--primary btn--lg',
        textContent: 'Get Started for Free',
        onClick: () => router.navigate('/signup'),
      }),
    ]),
  ]);

  // --- Footer ---
  const footer = createElement('footer', { className: 'footer', role: 'contentinfo' }, [
    createElement('div', { className: 'footer__inner' }, [
      createElement('div', { className: 'footer__grid' }, [
        createElement('div', {}, [
          createElement('div', { className: 'footer__brand' }, [
            createElement('span', { className: 'navbar__brand-icon', innerHTML: icon('bolt') }),
            createElement('span', { textContent: 'LearnFlow' }),
          ]),
          createElement('p', { className: 'footer__description', textContent: 'LearnFlow combines structured courses with GitHub-based assessments, AI-powered code reviews, and an integrated freelancing marketplace.' }),
        ]),
        createElement('div', {}, [
          createElement('h4', { className: 'footer__heading', textContent: 'Platform' }),
          createElement('div', { className: 'footer__links' }, [
            createElement('a', { className: 'footer__link', href: '/courses', textContent: 'Courses' }),
            createElement('a', { className: 'footer__link', href: '/marketplace', textContent: 'Marketplace' }),
            createElement('a', { className: 'footer__link', href: '/certificates', textContent: 'Certificates' }),
            createElement('a', { className: 'footer__link', href: '/ai-assistant', textContent: 'AI Assistant' }),
          ]),
        ]),
        createElement('div', {}, [
          createElement('h4', { className: 'footer__heading', textContent: 'Company' }),
          createElement('div', { className: 'footer__links' }, [
            createElement('a', { className: 'footer__link', href: '#', textContent: 'About' }),
            createElement('a', { className: 'footer__link', href: '#', textContent: 'Blog' }),
            createElement('a', { className: 'footer__link', href: '#', textContent: 'Careers' }),
            createElement('a', { className: 'footer__link', href: '#', textContent: 'Contact' }),
          ]),
        ]),
        createElement('div', {}, [
          createElement('h4', { className: 'footer__heading', textContent: 'Legal' }),
          createElement('div', { className: 'footer__links' }, [
            createElement('a', { className: 'footer__link', href: '#', textContent: 'Privacy' }),
            createElement('a', { className: 'footer__link', href: '#', textContent: 'Terms' }),
            createElement('a', { className: 'footer__link', href: '#', textContent: 'Cookies' }),
          ]),
        ]),
      ]),
      createElement('div', { className: 'footer__bottom' }, [
        createElement('span', { textContent: '© 2026 LearnFlow. All rights reserved.' }),
        createElement('div', { className: 'footer__social' }, [
          createElement('a', { className: 'footer__social-link', href: '#', 'aria-label': 'GitHub', innerHTML: icon('github') }),
          createElement('a', { className: 'footer__social-link', href: '#', 'aria-label': 'Twitter', textContent: '𝕏' }),
        ]),
      ]),
    ]),
  ]);

  page.append(navbar, hero, features, cta, footer);
  container.appendChild(page);
}

function createFeatureCard(iconName, title, description) {
  return createElement('div', { className: 'feature-card', role: 'article' }, [
    createElement('span', { className: 'feature-card__icon', innerHTML: icon(iconName), 'aria-hidden': 'true' }),
    createElement('h3', { className: 'feature-card__title font-display', textContent: title }),
    createElement('p', { className: 'feature-card__description', textContent: description }),
  ]);
}
