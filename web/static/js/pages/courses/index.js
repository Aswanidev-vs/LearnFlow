import { createElement, clearElement } from '../../utils/dom.js';
import { courseService } from '../../services/index.js';
import { CourseActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderCourseCard } from '../../components/ui/cards.js';
import { renderSkeleton, renderPagination } from '../../components/ui/forms.js';
import { renderEmptyState } from '../../components/ui/loading.js';
import { debounce } from '../../utils/helpers.js';
import { icon } from '../../utils/icons.js';

export async function renderCoursesPage(container) {
  clearElement(container);
  container.appendChild(renderSkeleton(6, 'card'));

  try {
    const { courses, pagination } = await courseService.getCourses();
    CourseActions.setCourses(courses, pagination);
    renderCourses(container, courses, pagination);
  } catch (error) {
    container.innerHTML = '<p class="text-secondary" role="alert">Failed to load courses.</p>';
  }
}

function renderCourses(container, courses, pagination) {
  clearElement(container);

  const page = createElement('div', { className: 'page-container' });

  const header = createElement('div', { className: 'courses-header' }, [
    createElement('div', {}, [
      createElement('h1', { className: 'font-display text-3xl font-bold mb-2', textContent: 'Course Catalog' }),
      createElement('p', { className: 'text-secondary', textContent: 'Explore our expert-led courses and start building real-world skills.' }),
    ]),
  ]);

  const filters = createElement('div', { className: 'courses-filters', role: 'search', 'aria-label': 'Course filters' }, [
    createElement('div', { className: 'navbar__search', style: 'flex: 1; min-width: 240px;' }, [
      createElement('span', { className: 'navbar__search-icon', innerHTML: icon('search') || '🔍', 'aria-hidden': 'true' }),
      createElement('input', {
        className: 'navbar__search-input',
        type: 'search',
        placeholder: 'Search courses...',
        id: 'course-search',
        'aria-label': 'Search courses',
      }),
    ]),
    createElement('select', { className: 'form-select', id: 'category-filter', 'aria-label': 'Filter by category' }, [
      createElement('option', { value: '', textContent: 'All Categories' }),
      createElement('option', { value: 'Backend Development', textContent: 'Backend Development' }),
      createElement('option', { value: 'Frontend Development', textContent: 'Frontend Development' }),
      createElement('option', { value: 'Architecture', textContent: 'Architecture' }),
      createElement('option', { value: 'Data Science', textContent: 'Data Science' }),
      createElement('option', { value: 'DevOps', textContent: 'DevOps' }),
      createElement('option', { value: 'Security', textContent: 'Security' }),
    ]),
    createElement('select', { className: 'form-select', id: 'level-filter', 'aria-label': 'Filter by difficulty level' }, [
      createElement('option', { value: '', textContent: 'All Levels' }),
      createElement('option', { value: 'Beginner', textContent: 'Beginner' }),
      createElement('option', { value: 'Intermediate', textContent: 'Intermediate' }),
      createElement('option', { value: 'Advanced', textContent: 'Advanced' }),
    ]),
  ]);

  const grid = createElement('div', { className: 'courses-grid', role: 'list', 'aria-label': 'Course list' });

  if (courses.length === 0) {
    grid.appendChild(renderEmptyState('No courses found matching your criteria.'));
  } else {
    courses.forEach((course) => grid.appendChild(renderCourseCard(course)));
  }

  const paginationEl = renderPagination({
    page: pagination.page,
    totalPages: pagination.totalPages,
    onPageChange: () => handleFilter(),
  });

  page.append(header, filters, grid, paginationEl);
  container.appendChild(page);

  const searchInput = page.querySelector('#course-search');
  const categorySelect = page.querySelector('#category-filter');
  const levelSelect = page.querySelector('#level-filter');

  const handleFilter = debounce(async () => {
    const filters = {
      search: searchInput.value,
      category: categorySelect.value,
      level: levelSelect.value,
    };
    CourseActions.setFilters(filters);
    grid.innerHTML = '';
    grid.appendChild(renderSkeleton(6, 'card'));

    try {
      const { courses: filtered, pagination: pag } = await courseService.getCourses(filters);
      grid.innerHTML = '';
      if (filtered.length === 0) {
        grid.appendChild(renderEmptyState('No courses found matching your criteria.'));
      } else {
        filtered.forEach((c) => grid.appendChild(renderCourseCard(c)));
      }
    } catch (err) {
      grid.innerHTML = '<p class="text-secondary" role="alert">Failed to filter courses.</p>';
    }
  }, 300);

  searchInput.addEventListener('input', handleFilter);
  categorySelect.addEventListener('change', handleFilter);
  levelSelect.addEventListener('change', handleFilter);
}

export async function renderCourseDetailPage(container, courseId) {
  clearElement(container);
  container.appendChild(renderSkeleton(1, 'card'));

  try {
    const course = await courseService.getCourseById(courseId);
    if (!course) {
      container.appendChild(renderEmptyState('Course not found.', 'search'));
      return;
    }
    CourseActions.setCurrentCourse(course);
    renderCourseDetail(container, course);
  } catch (error) {
    container.innerHTML = '<p class="text-secondary" role="alert">Failed to load course details.</p>';
  }
}

function renderCourseDetail(container, course) {
  clearElement(container);

  const page = createElement('div', { className: 'page-container' });

  const hero = createElement('div', { style: 'margin-bottom: var(--sp-8);' }, [
    createElement('div', { className: 'container' }, [
      createElement('nav', { className: 'mb-4', 'aria-label': 'Breadcrumb' }, [
        createElement('a', {
          href: '/courses',
          className: 'text-secondary text-sm',
          textContent: '← Courses',
          onClick: (e) => { e.preventDefault(); history.back(); },
        }),
        createElement('span', { className: 'text-muted text-sm', textContent: ` / ${course.title}` }),
      ]),
      createElement('h1', { className: 'font-display text-3xl font-bold mb-2', textContent: course.title }),
      createElement('p', { className: 'text-secondary mb-4', style: 'max-width: 700px;', textContent: course.description }),
      createElement('div', { className: 'flex items-center gap-4 mb-4 flex-wrap' }, [
        createElement('span', { className: 'text-accent font-semibold text-sm', textContent: `⭐ ${course.rating}` }),
        createElement('span', { className: 'text-muted text-sm', textContent: `${(course.studentsCount / 1000).toFixed(1)}k students` }),
        createElement('span', { className: 'text-muted text-sm', textContent: course.duration }),
        createElement('span', { className: 'text-muted text-sm', textContent: `${course.lessonsCount} lessons` }),
        createElement('span', { className: `badge badge--${course.level.toLowerCase()}`, textContent: course.level }),
      ]),
      createElement('div', { className: 'flex items-center gap-2 text-sm text-secondary' }, [
        createElement('div', { className: 'avatar avatar--sm' }),
        createElement('span', { textContent: `By ${course.instructor.name}` }),
      ]),
    ]),
  ]);

  const content = createElement('div', { className: 'course-detail container' });

  const sidebar = createElement('div', { className: 'course-detail__sidebar' }, [
    createElement('div', { className: 'card', style: 'padding: var(--sp-6);' }, [
      createElement('div', {
        className: 'font-display text-2xl font-bold text-accent mb-4',
        textContent: course.enrolled ? 'Enrolled' : `$${course.price}`,
      }),
      course.enrolled
        ? createElement('button', {
            className: 'btn btn--primary btn--full',
            textContent: 'Continue Learning',
            onClick: () => {
              const firstIncomplete = course.modules
                .flatMap((m) => m.lessons)
                .find((l) => !l.completed);
              if (firstIncomplete) {
                window.location.href = `/courses/${course.id}/lessons/${firstIncomplete.id}`;
              }
            },
          })
        : createElement('button', {
            className: 'btn btn--primary btn--full',
            textContent: 'Enroll Now',
            onClick: async () => {
              try {
                await courseService.enrollCourse(course.id);
                course.enrolled = true;
                renderCourseDetail(container, course);
              } catch (err) {
                // handle error
              }
            },
          }),
      course.enrolled && course.progress > 0 && createElement('div', { className: 'mt-4' }, [
        createElement('div', { className: 'progress-bar mb-2' }, [
          createElement('div', { className: 'progress-bar__fill', style: `width: ${course.progress}%` }),
        ]),
        createElement('span', { className: 'text-muted text-sm', textContent: `${course.progress}% complete` }),
      ]),
      createElement('div', { className: 'mt-6' }, [
        createElement('h4', { className: 'font-semibold mb-2 text-sm', textContent: 'This course includes:' }),
        createElement('ul', { className: 'flex flex-col gap-2' }, [
          createElement('li', { className: 'text-secondary text-sm', textContent: `${course.lessonsCount} video lessons` }),
          createElement('li', { className: 'text-secondary text-sm', textContent: 'Hands-on projects' }),
          createElement('li', { className: 'text-secondary text-sm', textContent: 'GitHub-based assessment' }),
          createElement('li', { className: 'text-secondary text-sm', textContent: 'Certificate of completion' }),
          createElement('li', { className: 'text-secondary text-sm', textContent: 'Lifetime access' }),
        ]),
      ]),
    ]),
    createElement('div', { className: 'card mt-4', style: 'padding: var(--sp-6);' }, [
      createElement('h4', { className: 'font-semibold mb-3 text-sm', textContent: 'Tags' }),
      createElement('div', { className: 'flex flex-wrap gap-2' },
        course.tags.map((tag) => createElement('span', { className: 'tag', textContent: tag }))
      ),
    ]),
  ]);

  const curriculum = createElement('div', {}, [
    createElement('h2', { className: 'font-display text-2xl font-bold mb-6', textContent: 'Curriculum' }),
    createElement('div', { className: 'flex flex-col gap-4' },
      course.modules.map((mod, i) =>
        createElement('div', { className: 'card', style: 'padding: var(--sp-5);' }, [
          createElement('div', { className: 'flex items-center justify-between mb-3' }, [
            createElement('h3', { className: 'font-display font-semibold', textContent: `Module ${i + 1}: ${mod.title}` }),
            createElement('span', { className: 'badge badge--info', textContent: `${mod.lessons.length} lessons` }),
          ]),
          createElement('ul', { className: 'flex flex-col gap-1' },
            mod.lessons.map((lesson) =>
              createElement('li', {
                className: `flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${lesson.completed ? '' : 'hover:bg-muted'}`,
                onClick: () => {
                  if (course.enrolled) {
                    window.location.href = `/courses/${course.id}/lessons/${lesson.id}`;
                  }
                },
                role: 'link',
                tabIndex: 0,
                'aria-label': `${lesson.completed ? 'Completed: ' : ''}${lesson.title} - ${formatLessonDuration(lesson.duration)}`,
              }, [
                createElement('span', {
                  className: lesson.completed ? 'text-accent' : 'text-muted',
                  innerHTML: lesson.completed ? icon('check') : lesson.type === 'video' ? icon('play') : icon('file'),
                  'aria-hidden': 'true',
                }),
                createElement('span', { className: `flex-1 text-sm ${lesson.completed ? 'text-secondary' : ''}`, textContent: lesson.title }),
                createElement('span', { className: 'text-muted text-xs', textContent: formatLessonDuration(lesson.duration) }),
              ])
            )
          ),
        ])
      )
    ),
  ]);

  content.append(curriculum, sidebar);
  page.append(hero, content);
  container.appendChild(page);
}

function formatLessonDuration(seconds) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}
