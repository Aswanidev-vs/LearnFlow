import { createElement, clearElement } from '../../utils/dom.js';
import { profileService } from '../../services/index.js';
import { store } from '../../store/index.js';
import { UIActions } from '../../store/actions.js';
import { renderFormField, renderButton } from '../../components/ui/forms.js';
import { formatDate } from '../../utils/format.js';
import { icon } from '../../utils/icons.js';

export async function renderProfilePage(container) {
  clearElement(container);

  try {
    const profile = await profileService.getProfile();
    store.setState('profile.data', profile);
    await renderProfile(container, profile);
  } catch (error) {
    container.innerHTML = '<p class="error-text">Failed to load profile.</p>';
  }
}

async function renderProfile(container, profile) {
  clearElement(container);

  const page = createElement('div', { className: 'profile-page' });

  // Use Clerk avatar if available
  const { store } = await import('../../store/index.js');
  const authUser = store.getState('auth.user');
  const avatarUrl = authUser?.imageUrl;

  const header = createElement('div', { className: 'profile-page__header' }, [
    createElement('div', { 
      className: 'profile-page__cover',
      style: profile.bannerColor ? `background: ${profile.bannerColor}` : ''
    }, [
      createElement('button', {
        className: 'btn btn--sm btn--glass profile-page__banner-btn',
        innerHTML: `${icon('image')} Change Banner`,
        onClick: () => {
          const colors = [
            'linear-gradient(135deg, #6366f1, #06b6d4)',
            'linear-gradient(135deg, #f43f5e, #fb923c)',
            'linear-gradient(135deg, #8b5cf6, #d946ef)',
            'linear-gradient(135deg, #10b981, #3b82f6)',
            '#1e293b'
          ];
          const currentIndex = colors.indexOf(profile.bannerColor || colors[0]);
          const nextIndex = (currentIndex + 1) % colors.length;
          profile.bannerColor = colors[nextIndex];
          store.setState('profile.data', { ...profile });
          renderProfile(container, profile); // This is fine without await in event handler if we don't care about sync
        }
      })
    ]),
    createElement('div', { className: 'profile-page__info' }, [
      createElement('div', { className: 'profile-page__avatar avatar avatar--xl' }, [
        avatarUrl 
          ? createElement('img', { src: avatarUrl, className: 'avatar__img' })
          : createElement('span', { textContent: profile.firstName?.charAt(0) || '?' }),
      ]),
      createElement('div', { className: 'profile-page__details' }, [
        createElement('h1', { className: 'profile-page__name', textContent: `${profile.firstName} ${profile.lastName}` }),
        createElement('p', { className: 'profile-page__bio', textContent: profile.bio }),
        createElement('div', { className: 'profile-page__meta' }, [
          createElement('span', { innerHTML: `${icon('mapPin')} ${profile.location}` }),
          createElement('span', { innerHTML: `${icon('calendar')} Joined ${formatDate(profile.joinedAt)}` }),
          profile.github && createElement('a', { 
            href: `https://github.com/${profile.github}`, 
            target: '_blank', 
            className: 'profile-page__meta-link',
            innerHTML: `${icon('github')} @${profile.github}` 
          }),
        ]),
      ]),
      createElement('button', {
        className: 'btn btn--outline',
        textContent: 'Edit Profile',
        onClick: () => renderProfileEdit(container, profile),
      }),
    ]),
  ]);

  const content = createElement('div', { className: 'profile-page__content' });

  const skillsSection = createElement('div', { className: 'profile-page__section card' }, [
    createElement('h2', { textContent: 'Skills' }),
    createElement('div', { className: 'tag-list' },
      profile.skills.map((skill) => createElement('span', { className: 'tag tag--lg', textContent: skill }))
    ),
  ]);

  const linksSection = createElement('div', { className: 'profile-page__section card' }, [
    createElement('h2', { textContent: 'Links' }),
    createElement('div', { className: 'profile-page__links' }, [
      profile.website && createElement('a', { className: 'profile-page__link', href: profile.website, target: '_blank', textContent: `🌐 ${profile.website}` }),
      profile.social.github && createElement('a', { className: 'profile-page__link', href: profile.social.github, target: '_blank', innerHTML: `${icon('github')} GitHub` }),
      profile.social.linkedin && createElement('a', { className: 'profile-page__link', href: profile.social.linkedin, target: '_blank', innerHTML: `${icon('briefcase')} LinkedIn` }),
    ]),
  ]);

  const statsSection = createElement('div', { className: 'profile-page__section card' }, [
    createElement('h2', { textContent: 'Stats' }),
    createElement('div', { className: 'profile-page__stats' }, [
      createProfileStat('books', '3', 'Courses Enrolled'),
      createProfileStat('check', '24', 'Lessons Completed'),
      createProfileStat('trophy', '1', 'Certificates'),
      createProfileStat('briefcase', '0', 'Gigs Completed'),
    ]),
  ]);

  content.append(skillsSection, linksSection, statsSection);
  page.append(header, content);
  container.appendChild(page);
}

function renderProfileEdit(container, profile) {
  clearElement(container);

  const page = createElement('div', { className: 'profile-page' }, [
    createElement('div', { className: 'profile-page__edit-header' }, [
      createElement('h1', { textContent: 'Edit Profile' }),
      createElement('button', {
        className: 'btn btn--ghost',
        textContent: 'Cancel',
        onClick: () => renderProfile(container, profile),
      }),
    ]),
    createElement('form', { className: 'profile-form card', id: 'profile-form' }, [
      createElement('div', { className: 'form-row' }, [
        renderFormField({ id: 'firstName', label: 'First Name', value: profile.firstName }),
        renderFormField({ id: 'lastName', label: 'Last Name', value: profile.lastName }),
      ]),
      renderFormField({ id: 'email', label: 'Email', type: 'email', value: profile.email }),
      renderFormField({ id: 'bio', label: 'Bio', value: profile.bio }),
      renderFormField({ id: 'location', label: 'Location', value: profile.location }),
      renderFormField({ id: 'website', label: 'Website', type: 'url', value: profile.website || '' }),
      renderFormField({ id: 'github', label: 'GitHub Username', value: profile.github || '' }),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Skills (comma-separated)' }),
        createElement('input', { className: 'form-input', type: 'text', id: 'skills', value: profile.skills.join(', ') }),
      ]),
      createElement('div', { className: 'form-actions' }, [
        createElement('button', {
          className: 'btn btn--ghost',
          type: 'button',
          textContent: 'Cancel',
          onClick: () => renderProfile(container, profile),
        }),
        createElement('button', { className: 'btn btn--primary', type: 'submit', textContent: 'Save Changes' }),
      ]),
    ]),
  ]);

  container.appendChild(page);

  const form = page.querySelector('#profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
      firstName: form.querySelector('#firstName').value,
      lastName: form.querySelector('#lastName').value,
      bio: form.querySelector('#bio').value,
      location: form.querySelector('#location').value,
      website: form.querySelector('#website').value,
      github: form.querySelector('#github').value,
      skills: form.querySelector('#skills').value.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      await profileService.updateProfile(formData);
      const updatedProfile = { ...profile, ...formData };
      store.setState('profile.data', updatedProfile);
      UIActions.addToast('Profile updated successfully!', 'success');
      renderProfile(container, updatedProfile);
    } catch (err) {
      UIActions.addToast('Failed to update profile.', 'error');
    }
  });
}

function createProfileStat(iconName, value, label) {
  return createElement('div', { className: 'profile-stat' }, [
    createElement('span', { className: 'profile-stat__icon', innerHTML: icon(iconName) }),
    createElement('span', { className: 'profile-stat__value', textContent: value }),
    createElement('span', { className: 'profile-stat__label', textContent: label }),
  ]);
}
