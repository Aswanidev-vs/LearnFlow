import { createElement, clearElement } from '../../utils/dom.js';
import { courseService } from '../../services/index.js';
import { CourseActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderProgressBar } from '../../components/ui/forms.js';
import { throttle } from '../../utils/helpers.js';
import AppConfig from '../../core/config.js';

export async function renderLessonPage(container, { courseId, lessonId }) {
  clearElement(container);

  try {
    const lesson = await courseService.getLesson(courseId, lessonId);
    const course = await courseService.getCourseById(courseId);

    if (!lesson || !course) {
      container.innerHTML = '<p class="error-text">Lesson not found.</p>';
      return;
    }

    CourseActions.setCurrentLesson(lesson);
    renderLesson(container, lesson, course);
  } catch (error) {
    container.innerHTML = '<p class="error-text">Failed to load lesson.</p>';
  }
}

function renderLesson(container, lesson, course) {
  clearElement(container);

  const cid = course.id;
  const lid = lesson.id;

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lid);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const page = createElement('div', { className: 'lesson-viewer' });

  const sidebar = createElement('aside', { className: 'lesson-viewer__sidebar' }, [
    createElement('div', { className: 'lesson-viewer__course-info' }, [
      createElement('a', { className: 'lesson-viewer__back', href: `/courses/${cid}`, textContent: '← Back to Course' }),
      createElement('h3', { className: 'lesson-viewer__course-title', textContent: course.title }),
      renderProgressBar(course.progress),
    ]),
    createElement('div', { className: 'lesson-viewer__nav' },
      course.modules.map((mod) =>
        createElement('div', { className: 'lesson-viewer__module' }, [
          createElement('h4', { className: 'lesson-viewer__module-title', textContent: mod.title }),
          createElement('ul', {},
            mod.lessons.map((l) =>
              createElement('li', {
                className: `lesson-viewer__lesson-link ${l.id === lid ? 'lesson-viewer__lesson-link--active' : ''} ${l.completed ? 'lesson-viewer__lesson-link--completed' : ''}`,
                onClick: () => window.location.href = `/courses/${cid}/lessons/${l.id}`,
              }, [
                createElement('span', { textContent: l.completed ? '✓ ' : l.type === 'video' ? '▶ ' : '📄 ' }),
                createElement('span', { textContent: l.title }),
              ])
            )
          ),
        ])
      )
    ),
  ]);

  const main = createElement('div', { className: 'lesson-viewer__main' });

  if (lesson.type === 'video') {
    main.appendChild(
      createElement('div', { className: 'lesson-viewer__video' }, [
        createElement('div', { className: 'video-placeholder' }, [
          createElement('div', { className: 'video-placeholder__play' }, [
            createElement('span', { textContent: '▶' }),
          ]),
          createElement('p', { textContent: 'Video Player Placeholder' }),
          createElement('p', { className: 'text-muted', textContent: 'Video streaming will be integrated with the Go backend.' }),
        ]),
      ])
    );
  }

  const content = createElement('div', { className: 'lesson-viewer__content' }, [
    createElement('h1', { className: 'lesson-viewer__title', textContent: lesson.title }),
    createElement('div', { className: 'lesson-viewer__meta' }, [
      createElement('span', { textContent: lesson.moduleName }),
      createElement('span', { textContent: `· ${Math.floor(lesson.duration / 60)} min` }),
      createElement('span', { textContent: lesson.type === 'video' ? '📹 Video' : '📄 Reading' }),
    ]),
    lesson.type === 'text' && createElement('div', { className: 'lesson-viewer__body prose' }, [
      createElement('p', { textContent: 'This is the lesson content area. In the full implementation, lesson content will be fetched from the Go backend API and rendered here as structured HTML.' }),
      createElement('p', { textContent: 'The content would include formatted text, code snippets, images, and interactive elements depending on the lesson type.' }),
    ]),
  ]);

  const nav = createElement('div', { className: 'lesson-viewer__navigation' }, [
    prevLesson
      ? createElement('button', {
          className: 'btn btn--ghost',
          textContent: `← ${prevLesson.title}`,
          onClick: () => window.location.href = `/courses/${cid}/lessons/${prevLesson.id}`,
        })
      : createElement('div'),
    nextLesson
      ? createElement('button', {
          className: 'btn btn--primary',
          textContent: `${nextLesson.title} →`,
          onClick: () => window.location.href = `/courses/${cid}/lessons/${nextLesson.id}`,
        })
      : createElement('button', {
          className: 'btn btn--primary',
          textContent: 'Complete Course',
          onClick: () => window.location.href = `/courses/${cid}`,
        }),
  ]);

  main.append(content, nav);
  page.append(sidebar, main);
  container.appendChild(page);

  const throttledProgress = throttle(async () => {
    await courseService.updateProgress(cid, lid, { lastPosition: Date.now() });
  }, AppConfig.VIDEO_RESUME_INTERVAL);

  window.addEventListener('scroll', throttledProgress);
}
