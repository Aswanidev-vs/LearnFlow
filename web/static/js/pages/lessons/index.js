import { createElement, clearElement } from '../../utils/dom.js';
import { courseService } from '../../services/index.js';
import { CourseActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderProgressBar } from '../../components/ui/forms.js';
import { throttle } from '../../utils/helpers.js';
import router from '../../core/router.js';
import AppConfig from '../../core/config.js';
import { icon } from '../../utils/icons.js';

export async function renderLessonPage(container, { courseId, lessonId }) {
  clearElement(container);

  try {
    const lesson = await courseService.getLesson(courseId, lessonId);
    const course = await courseService.getCourseById(courseId);

    if (!lesson || !course) {
      container.innerHTML = '<p class="text-secondary" role="alert">Lesson not found.</p>';
      return;
    }

    CourseActions.setCurrentLesson(lesson);
    return renderLesson(container, lesson, course);
  } catch (error) {
    container.innerHTML = '<p class="text-secondary" role="alert">Failed to load lesson.</p>';
  }
}

function navigateTo(path) {
  router.navigate(path);
}

function renderLesson(container, lesson, course) {
  clearElement(container);

  const cid = course.id;
  const lid = lesson.id;

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lid);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const page = createElement('div', { className: 'chat-page' });

  // --- Sidebar (Course Navigation) ---
  const sidebar = createElement('aside', {
    className: 'sidebar',
    role: 'navigation',
    'aria-label': 'Course lessons',
    style: 'top: var(--navbar-h); padding-top: var(--sp-6);',
  }, [
    createElement('div', { className: 'px-4 mb-4' }, [
      createElement('a', {
        className: 'text-secondary text-sm font-medium',
        href: `/courses/${cid}`,
        textContent: '← Back to Course',
        onClick: (e) => { e.preventDefault(); navigateTo(`/courses/${cid}`); },
        'aria-label': 'Go back to course overview',
      }),
      createElement('h3', { className: 'font-display font-semibold mt-2 mb-3 text-sm', textContent: course.title }),
      renderProgressBar(course.progress),
    ]),
    createElement('div', { className: 'sidebar__nav' },
      course.modules.map((mod) =>
        createElement('div', { className: 'px-4 mb-4' }, [
          createElement('h4', { className: 'text-xs font-semibold text-muted uppercase mb-2', style: 'letter-spacing: var(--tracking-widest);', textContent: mod.title }),
          createElement('ul', { className: 'sidebar__list' },
            mod.lessons.map((l) =>
              createElement('li', {}, [
                createElement('a', {
                  className: `sidebar__link ${l.id === lid ? 'sidebar__link--active' : ''}`,
                  onClick: (e) => { e.preventDefault(); navigateTo(`/courses/${cid}/lessons/${l.id}`); },
                  href: '#',
                  'aria-label': `${l.completed ? 'Completed: ' : ''}${l.title}`,
                }, [
                  createElement('span', { className: 'sidebar__icon', innerHTML: l.completed ? icon('check') : l.type === 'video' ? icon('play') : icon('file'), 'aria-hidden': 'true' }),
                  createElement('span', { textContent: l.title }),
                ])
              ])
            )
          ),
        ])
      )
    ),
  ]);

  // --- Main Content ---
  const main = createElement('div', { className: 'app__content', style: 'padding: var(--sp-8);' });

  if (lesson.type === 'video') {
    main.appendChild(
      createElement('div', { className: 'card mb-6', style: 'padding: 0; overflow: hidden;' }, [
        createElement('div', {
          className: 'video-placeholder',
          style: 'height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--space-800), var(--space-900));',
        }, [
          createElement('div', {
            className: 'video-placeholder__play',
            style: 'width: 80px; height: 80px; border-radius: 50%; background: var(--color-accent-muted); display: flex; align-items: center; justify-content: center; margin-bottom: var(--sp-4); box-shadow: var(--shadow-glow-lg);',
          }, [
            createElement('span', { innerHTML: icon('play'), style: 'font-size: var(--text-3xl); color: var(--cyan-400);' }),
          ]),
          createElement('p', { className: 'font-semibold', textContent: 'Video Player' }),
          createElement('p', { className: 'text-muted text-sm', textContent: 'Video streaming will be integrated with the Go backend.' }),
        ]),
      ])
    );
  }

  const content = createElement('div', { className: 'mb-8' }, [
    createElement('h1', { className: 'font-display text-3xl font-bold mb-3', textContent: lesson.title }),
    createElement('div', { className: 'flex items-center gap-3 text-sm text-muted mb-6' }, [
      createElement('span', { textContent: lesson.moduleName }),
      createElement('span', { textContent: '·' }),
      createElement('span', { textContent: `${Math.floor(lesson.duration / 60)} min` }),
      createElement('span', { innerHTML: lesson.type === 'video' ? icon('video') + ' Video' : icon('file') + ' Reading' }),
    ]),
    lesson.type === 'text' && createElement('div', { className: 'prose' }, [
      createElement('p', { textContent: 'This is the lesson content area. In the full implementation, lesson content will be fetched from the Go backend API and rendered here as structured HTML.' }),
      createElement('p', { textContent: 'The content would include formatted text, code snippets, images, and interactive elements depending on the lesson type.' }),
    ]),
  ]);

  const nav = createElement('div', { className: 'flex items-center justify-between pt-6 border-t', style: 'border-color: var(--border-default);' }, [
    prevLesson
      ? createElement('button', {
          className: 'btn btn--ghost',
          textContent: `← ${prevLesson.title}`,
          onClick: () => navigateTo(`/courses/${cid}/lessons/${prevLesson.id}`),
          'aria-label': `Previous lesson: ${prevLesson.title}`,
        })
      : createElement('div'),
    nextLesson
      ? createElement('button', {
          className: 'btn btn--primary',
          textContent: `${nextLesson.title} →`,
          onClick: () => navigateTo(`/courses/${cid}/lessons/${nextLesson.id}`),
          'aria-label': `Next lesson: ${nextLesson.title}`,
        })
      : createElement('button', {
          className: 'btn btn--primary',
          textContent: 'Complete Course',
          onClick: () => navigateTo(`/courses/${cid}`),
          'aria-label': 'Complete this course',
        }),
  ]);

  main.append(content, nav);
  page.append(sidebar, main);
  container.appendChild(page);

  const throttledProgress = throttle(async () => {
    await courseService.updateProgress(cid, lid, { lastPosition: Date.now() });
  }, AppConfig.VIDEO_RESUME_INTERVAL);

  window.addEventListener('scroll', throttledProgress);

  return () => {
    window.removeEventListener('scroll', throttledProgress);
  };
}
