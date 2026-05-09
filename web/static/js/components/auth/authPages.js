import { createElement, clearElement } from '../../utils/dom.js';
import authService from '../../services/auth.js';
import router from '../../core/router.js';
import { AuthActions, UIActions } from '../../store/actions.js';
import { createPasswordField, isPasswordValid } from '../../components/ui/password.js';
import { icon } from '../../utils/icons.js';

function isDemoMode() {
  return !authService.clerk;
}

function handleOAuth(provider) {
  if (isDemoMode()) {
    AuthActions.setUser({
      id: `demo-${provider}`,
      email: `user@learnflow.dev`,
      firstName: provider === 'github' ? 'GitHub' : 'Google',
      lastName: 'User',
      fullName: `${provider} User`,
    });
    AuthActions.setToken('demo-token');
    router.navigate('/dashboard');
  } else {
    authService.signInWithOAuth(provider);
  }
}

export function renderLoginPage(container) {
  clearElement(container);

  const page = createElement('div', { className: 'auth-page' }, [
    createElement('div', { className: 'auth-page__left' }, [
      createElement('div', { className: 'auth-page__branding' }, [
        createElement('span', { className: 'auth-page__logo', innerHTML: icon('bolt') }),
        createElement('h1', { className: 'auth-page__title', textContent: 'LearnFlow' }),
        createElement('p', { className: 'auth-page__subtitle', textContent: 'Learn. Build. Get Hired.' }),
      ]),
      createElement('div', { className: 'auth-page__features' }, [
        createFeatureItem('books', 'Structured Learning', 'Expert-led courses with real-world projects'),
        createFeatureItem('robot', 'AI Assistant', '24/7 personalized learning support'),
        createFeatureItem('briefcase', 'Get Hired', 'Earn certifications and find freelance work'),
      ]),
    ]),
    createElement('div', { className: 'auth-page__right' }, [
      createElement('div', { className: 'auth-card' }, [
        createElement('h2', { className: 'auth-card__title', textContent: 'Welcome Back' }),
        createElement('p', { className: 'auth-card__subtitle', textContent: 'Sign in to continue your learning journey' }),

        createElement('div', { className: 'auth-card__oauth' }, [
          createElement('button', {
            className: 'btn btn--oauth btn--google',
            onClick: () => handleOAuth('google'),
          }, [createGoogleIcon(), createElement('span', { textContent: 'Continue with Google' })]),
          createElement('button', {
            className: 'btn btn--oauth btn--github',
            onClick: () => handleOAuth('github'),
          }, [createGitHubIcon(), createElement('span', { textContent: 'Continue with GitHub' })]),
        ]),

        createElement('div', { className: 'auth-card__divider' }, [
          createElement('span', { textContent: 'or sign in with email' }),
        ]),

        createElement('form', { className: 'auth-card__form', id: 'login-form' }, [
          createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label', for: 'email', textContent: 'Email' }),
            createElement('input', { className: 'form-input', type: 'email', id: 'email', placeholder: 'you@example.com', required: 'required' }),
          ]),
          (() => {
            const pwField = createPasswordField({ id: 'password', label: 'Password', placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' });
            return pwField.element;
          })(),
          createElement('div', { className: 'form-group form-group--row' }, [
            createElement('label', { className: 'form-checkbox' }, [
              createElement('input', { type: 'checkbox', id: 'remember' }),
              createElement('span', { textContent: 'Remember me' }),
            ]),
            createElement('a', { className: 'auth-card__forgot', href: '/reset-password', textContent: 'Forgot password?', onClick: (e) => { e.preventDefault(); router.navigate('/reset-password'); } }),
          ]),
          createElement('button', { className: 'btn btn--primary btn--full', type: 'submit', textContent: 'Sign In' }),
        ]),

        createElement('p', { className: 'auth-card__switch' }, [
          document.createTextNode("Don't have an account? "),
          createElement('a', { href: '/signup', textContent: 'Sign up', onClick: (e) => { e.preventDefault(); router.navigate('/signup'); } }),
        ]),
      ]),
    ]),
  ]);

  container.appendChild(page);

  page.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('#email').value;
    const password = e.target.querySelector('#password').value;

    if (!password) {
      UIActions.addToast('Please enter your password', 'error');
      return;
    }

    if (isDemoMode()) {
      AuthActions.setUser({ id: 'demo-user', email, firstName: 'Demo', lastName: 'User', fullName: email.split('@')[0] });
      AuthActions.setToken('demo-token');
      router.navigate('/dashboard');
      return;
    }

    try {
      await authService.signIn({ email, password });
      await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      router.navigate('/dashboard');
    } catch (err) {
      UIActions.addToast(err.message || 'Login failed', 'error');
    }
  });
}

export function renderSignupPage(container) {
  clearElement(container);

  const page = createElement('div', { className: 'auth-page' }, [
    createElement('div', { className: 'auth-page__left' }, [
      createElement('div', { className: 'auth-page__branding' }, [
        createElement('span', { className: 'auth-page__logo', innerHTML: icon('bolt') }),
        createElement('h1', { className: 'auth-page__title', textContent: 'LearnFlow' }),
        createElement('p', { className: 'auth-page__subtitle', textContent: 'Start your learning journey today' }),
      ]),
      createElement('div', { className: 'auth-page__features' }, [
        createFeatureItem('target', 'Structured Path', 'Follow curated learning paths designed by experts'),
        createFeatureItem('check', 'GitHub Assessments', 'Submit real projects and get AI-powered feedback'),
        createFeatureItem('trophy', 'Dual Certifications', 'Earn course and internship certificates'),
      ]),
    ]),
    createElement('div', { className: 'auth-page__right' }, [
      createElement('div', { className: 'auth-card' }, [
        createElement('h2', { className: 'auth-card__title', textContent: 'Create Account' }),
        createElement('p', { className: 'auth-card__subtitle', textContent: 'Join thousands of learners leveling up their skills' }),

        createElement('div', { className: 'auth-card__oauth' }, [
          createElement('button', {
            className: 'btn btn--oauth btn--google',
            onClick: () => handleOAuth('google'),
          }, [createGoogleIcon(), createElement('span', { textContent: 'Sign up with Google' })]),
          createElement('button', {
            className: 'btn btn--oauth btn--github',
            onClick: () => handleOAuth('github'),
          }, [createGitHubIcon(), createElement('span', { textContent: 'Sign up with GitHub' })]),
        ]),

        createElement('div', { className: 'auth-card__divider' }, [
          createElement('span', { textContent: 'or sign up with email' }),
        ]),

        createElement('form', { className: 'auth-card__form', id: 'signup-form' }, [
          createElement('div', { className: 'form-row' }, [
            createElement('div', { className: 'form-group' }, [
              createElement('label', { className: 'form-label', for: 'firstName', textContent: 'First Name' }),
              createElement('input', { className: 'form-input', type: 'text', id: 'firstName', placeholder: 'John', required: 'required' }),
            ]),
            createElement('div', { className: 'form-group' }, [
              createElement('label', { className: 'form-label', for: 'lastName', textContent: 'Last Name' }),
              createElement('input', { className: 'form-input', type: 'text', id: 'lastName', placeholder: 'Doe', required: 'required' }),
            ]),
          ]),
          createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label', for: 'email', textContent: 'Email' }),
            createElement('input', { className: 'form-input', type: 'email', id: 'email', placeholder: 'you@example.com', required: 'required' }),
          ]),
          (() => {
            const pwField = createPasswordField({ id: 'password', label: 'Password', placeholder: 'Create a strong password' });
            return pwField.element;
          })(),
          createElement('button', { className: 'btn btn--primary btn--full', type: 'submit', textContent: 'Create Account' }),
        ]),

        createElement('p', { className: 'auth-card__switch' }, [
          document.createTextNode('Already have an account? '),
          createElement('a', { href: '/login', textContent: 'Sign in', onClick: (e) => { e.preventDefault(); router.navigate('/login'); } }),
        ]),
      ]),
    ]),
  ]);

  container.appendChild(page);

  page.querySelector('#signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = e.target.querySelector('#firstName').value;
    const lastName = e.target.querySelector('#lastName').value;
    const email = e.target.querySelector('#email').value;
    const password = e.target.querySelector('#password').value;

    if (!isPasswordValid(password)) {
      UIActions.addToast('Password does not meet all requirements', 'error');
      return;
    }

    if (isDemoMode()) {
      AuthActions.setUser({ id: 'demo-user', email, firstName, lastName, fullName: `${firstName} ${lastName}` });
      AuthActions.setToken('demo-token');
      router.navigate('/dashboard');
      return;
    }

    try {
      await authService.signUp({ email, password, firstName, lastName });
      router.navigate('/dashboard');
    } catch (err) {
      UIActions.addToast(err.message || 'Signup failed', 'error');
    }
  });
}

export function renderResetPasswordPage(container) {
  clearElement(container);

  let step = 'email';

  const page = createElement('div', { className: 'auth-page' }, [
    createElement('div', { className: 'auth-page__left' }, [
      createElement('div', { className: 'auth-page__branding' }, [
        createElement('span', { className: 'auth-page__logo', innerHTML: icon('bolt') }),
        createElement('h1', { className: 'auth-page__title', textContent: 'LearnFlow' }),
        createElement('p', { className: 'auth-page__subtitle', textContent: 'Reset your password' }),
      ]),
      createElement('div', { className: 'auth-page__features' }, [
        createFeatureItem('lock', 'Secure Reset', 'We will send a reset link to your email'),
        createFeatureItem('check', 'Quick Process', 'Get back to learning in minutes'),
        createFeatureItem('shield', 'Account Protection', 'Your data stays safe throughout'),
      ]),
    ]),
    createElement('div', { className: 'auth-page__right' }, [
      createElement('div', { className: 'auth-card', id: 'reset-card' }),
    ]),
  ]);

  container.appendChild(page);

  const card = page.querySelector('#reset-card');

  function renderEmailStep() {
    card.innerHTML = '';
    card.append(
      createElement('h2', { className: 'auth-card__title', textContent: 'Forgot Password?' }),
      createElement('p', { className: 'auth-card__subtitle', textContent: "Enter your email and we'll send you a link to reset your password." }),
      createElement('form', { className: 'auth-card__form', id: 'reset-email-form' }, [
        createElement('div', { className: 'form-group' }, [
          createElement('label', { className: 'form-label', for: 'email', textContent: 'Email Address' }),
          createElement('input', { className: 'form-input', type: 'email', id: 'email', placeholder: 'you@example.com', required: 'required' }),
        ]),
        createElement('button', { className: 'btn btn--primary btn--full', type: 'submit', textContent: 'Send Reset Link' }),
      ]),
      createElement('p', { className: 'auth-card__switch' }, [
        document.createTextNode('Remember your password? '),
        createElement('a', { href: '/login', textContent: 'Sign in', onClick: (e) => { e.preventDefault(); router.navigate('/login'); } }),
      ]),
    );

    card.querySelector('#reset-email-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target.querySelector('#email').value;

      try {
        const res = await fetch('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        step = 'done';
        renderDoneStep(email);
      } catch (err) {
        if (isDemoMode()) {
          step = 'new-password';
          renderNewPasswordStep(email);
        } else {
          UIActions.addToast(err.message || 'Failed to send reset link', 'error');
        }
      }
    });
  }

  function renderNewPasswordStep(email) {
    card.innerHTML = '';
    card.append(
      createElement('h2', { className: 'auth-card__title', textContent: 'Set New Password' }),
      createElement('p', { className: 'auth-card__subtitle', textContent: `Enter a new password for ${email}` }),
      createElement('form', { className: 'auth-card__form', id: 'new-password-form' }, [
        (() => {
          const pwField = createPasswordField({ id: 'new-password', label: 'New Password', placeholder: 'Create a strong password' });
          return pwField.element;
        })(),
        (() => {
          const pwField = createPasswordField({ id: 'confirm-password', label: 'Confirm Password', placeholder: 'Re-enter your password' });
          return pwField.element;
        })(),
        createElement('button', { className: 'btn btn--primary btn--full', type: 'submit', textContent: 'Reset Password' }),
      ]),
    );

    card.querySelector('#new-password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPw = e.target.querySelector('#new-password').value;
      const confirmPw = e.target.querySelector('#confirm-password').value;

      if (!isPasswordValid(newPw)) {
        UIActions.addToast('Password does not meet all requirements', 'error');
        return;
      }

      if (newPw !== confirmPw) {
        UIActions.addToast('Passwords do not match', 'error');
        return;
      }

      try {
        const res = await fetch('/auth/reset-password/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: newPw }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reset failed');
        UIActions.addToast('Password reset successfully!', 'success');
        router.navigate('/login');
      } catch (err) {
        if (isDemoMode()) {
          UIActions.addToast('Password reset (demo mode)', 'success');
          router.navigate('/login');
        } else {
          UIActions.addToast(err.message || 'Failed to reset password', 'error');
        }
      }
    });
  }

  function renderDoneStep(email) {
    card.innerHTML = '';
    card.append(
      createElement('div', { style: 'text-align:center;margin-bottom:2rem;' }, [
        createElement('span', { style: 'font-size:3rem;display:block;margin-bottom:1rem;', innerHTML: icon('mail') }),
      ]),
      createElement('h2', { className: 'auth-card__title', style: 'text-align:center;', textContent: 'Check Your Email' }),
      createElement('p', { className: 'auth-card__subtitle', style: 'text-align:center;', textContent: `We sent a password reset link to ${email}. Click the link in the email to set a new password.` }),
      createElement('button', {
        className: 'btn btn--primary btn--full',
        textContent: 'Back to Sign In',
        onClick: () => router.navigate('/login'),
      }),
      createElement('p', { className: 'auth-card__switch', style: 'margin-top:1rem;' }, [
        document.createTextNode("Didn't receive the email? "),
        createElement('a', { href: '#', textContent: 'Try again', onClick: (e) => { e.preventDefault(); step = 'email'; renderEmailStep(); } }),
      ]),
    );
  }

  renderEmailStep();
}

function createFeatureItem(iconName, title, description) {
  return createElement('div', { className: 'auth-feature' }, [
    createElement('span', { className: 'auth-feature__icon', innerHTML: icon(iconName) }),
    createElement('div', {}, [
      createElement('h4', { className: 'auth-feature__title', textContent: title }),
      createElement('p', { className: 'auth-feature__description', textContent: description }),
    ]),
  ]);
}

function createGoogleIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.innerHTML = '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>';
  return svg;
}

function createGitHubIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.innerHTML = '<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>';
  return svg;
}
