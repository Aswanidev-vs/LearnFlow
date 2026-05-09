import { createElement } from '../../utils/dom.js';
import { icon } from '../../utils/icons.js';

export function renderFooter(container) {
  const footer = createElement('footer', { className: 'footer' }, [
    createElement('div', { className: 'footer__inner container' }, [
      createElement('div', { className: 'footer__brand' }, [
        createElement('span', { className: 'footer__logo', innerHTML: icon('bolt') }),
        createElement('span', { className: 'footer__name', textContent: 'LearnFlow' }),
        createElement('p', { className: 'footer__tagline', textContent: 'Learn. Build. Get Hired.' }),
      ]),
      createElement('div', { className: 'footer__links' }, [
        createElement('div', { className: 'footer__col' }, [
          createElement('h4', { className: 'footer__heading', textContent: 'Platform' }),
          createElement('a', { href: '/courses', textContent: 'Courses' }),
          createElement('a', { href: '/marketplace', textContent: 'Marketplace' }),
          createElement('a', { href: '/certificates', textContent: 'Certificates' }),
        ]),
        createElement('div', { className: 'footer__col' }, [
          createElement('h4', { className: 'footer__heading', textContent: 'Company' }),
          createElement('a', { href: '#', textContent: 'About' }),
          createElement('a', { href: '#', textContent: 'Blog' }),
          createElement('a', { href: '#', textContent: 'Careers' }),
        ]),
        createElement('div', { className: 'footer__col' }, [
          createElement('h4', { className: 'footer__heading', textContent: 'Support' }),
          createElement('a', { href: '#', textContent: 'Help Center' }),
          createElement('a', { href: '#', textContent: 'Terms' }),
          createElement('a', { href: '#', textContent: 'Privacy' }),
        ]),
      ]),
    ]),
    createElement('div', { className: 'footer__bottom container' }, [
      createElement('p', { textContent: `© ${new Date().getFullYear()} LearnFlow. All rights reserved.` }),
    ]),
  ]);

  container.appendChild(footer);
  return footer;
}
