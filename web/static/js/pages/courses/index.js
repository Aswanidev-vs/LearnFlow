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
    container.innerHTML = '<p class="error-text">Failed to load courses.</p>';
  }
}

function renderCourses(container, courses, pagination) {
  clearElement(container);

  const page = createElement('div', { className: 'courses-page' });

  const header = createElement('div', { className: 'courses-page__header' }, [
    createElement('h1', { className: 'courses-page__title', textContent: 'Course Catalog' }),
    createElement('p', { className: 'courses-page__subtitle', textContent: 'Explore our expert-led courses and start building real-world skills.' }),
  ]);

  const filters = createElement('div', { className: 'courses-page__filters' }, [
    createElement('div', { className: 'search-input' }, [
      createElement('input', {
        className: 'form-input',
        type: 'text',
        placeholder: 'Search courses...',
        id: 'course-search',
      }),
    ]),
    createElement('select', { className: 'form-select', id: 'category-filter' }, [
      createElement('option', { value: '', textContent: 'All Categories' }),
      createElement('option', { value: 'Backend Development', textContent: 'Backend Development' }),
      createElement('option', { value: 'Frontend Development', textContent: 'Frontend Development' }),
      createElement('option', { value: 'Architecture', textContent: 'Architecture' }),
      createElement('option', { value: 'Data Science', textContent: 'Data Science' }),
      createElement('option', { value: 'DevOps', textContent: 'DevOps' }),
      createElement('option', { value: 'Security', textContent: 'Security' }),
    ]),
    createElement('select', { className: 'form-select', id: 'level-filter' }, [
      createElement('option', { value: '', textContent: 'All Levels' }),
      createElement('option', { value: 'Beginner', textContent: 'Beginner' }),
      createElement('option', { value: 'Intermediate', textContent: 'Intermediate' }),
      createElement('option', { value: 'Advanced', textContent: 'Advanced' }),
    ]),
  ]);

  const grid = createElement('div', { className: 'courses-page__grid' });

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
      grid.innerHTML = '<p class="error-text">Failed to filter courses.</p>';
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
    container.innerHTML = '<p class="error-text">Failed to load course details.</p>';
  }
}

function renderCourseDetail(container, course) {
  clearElement(container);

  const page = createElement('div', { className: 'course-detail' });

  const hero = createElement('div', { className: 'course-detail__hero' }, [
    createElement('div', { className: 'container' }, [
      createElement('div', { className: 'course-detail__breadcrumb' }, [
        createElement('a', { href: '/courses', textContent: 'Courses', onClick: (e) => { e.preventDefault(); history.back(); } }),
        createElement('span', { textContent: ' / ' }),
        createElement('span', { textContent: course.title }),
      ]),
      createElement('h1', { className: 'course-detail__title', textContent: course.title }),
      createElement('p', { className: 'course-detail__description', textContent: course.description }),
      createElement('div', { className: 'course-detail__meta' }, [
        createElement('span', { textContent: `⭐ ${course.rating}` }),
        createElement('span', { textContent: `${(course.studentsCount / 1000).toFixed(1)}k students` }),
        createElement('span', { textContent: course.duration }),
        createElement('span', { textContent: `${course.lessonsCount} lessons` }),
        createElement('span', { className: `badge badge--${course.level.toLowerCase()}`, textContent: course.level }),
      ]),
      createElement('div', { className: 'course-detail__instructor' }, [
        createElement('div', { className: 'avatar avatar--sm' }),
        createElement('span', { textContent: `By ${course.instructor.name}` }),
      ]),
    ]),
  ]);

  const content = createElement('div', { className: 'course-detail__content container' });

  const sidebar = createElement('div', { className: 'course-detail__sidebar' }, [
    createElement('div', { className: 'course-detail__enroll card' }, [
      createElement('div', { className: 'course-detail__price', textContent: course.enrolled ? 'Enrolled' : `$${course.price}` }),
      course.enrolled
        ? createElement('button', {
            className: 'btn btn--primary btn--full',
            textContent: 'Continue Learning',
            onClick: () => {
              const firstIncomplete = course.modules
                .flatMap((m) => m.lessons)
                .find((l) => !l.completed);
              if (firstIncomplete) {
                const module = course.modules.find((m) => m.lessons.includes(firstIncomplete));
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
      course.enrolled && course.progress > 0 && createElement('div', { className: 'course-detail__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
          createElement('div', { className: 'progress-bar__fill', style: `width: ${course.progress}%` }),
        ]),
        createElement('span', { textContent: `${course.progress}% complete` }),
      ]),
      createElement('div', { className: 'course-detail__includes' }, [
        createElement('h4', { textContent: 'This course includes:' }),
        createElement('ul', {}, [
          createElement('li', { textContent: `${course.lessonsCount} video lessons` }),
          createElement('li', { textContent: 'Hands-on projects' }),
          createElement('li', { textContent: 'GitHub-based assessment' }),
          createElement('li', { textContent: 'Certificate of completion' }),
          createElement('li', { textContent: 'Lifetime access' }),
        ]),
      ]),
    ]),
    createElement('div', { className: 'course-detail__tags card' }, [
      createElement('h4', { textContent: 'Tags' }),
      createElement('div', { className: 'tag-list' },
        course.tags.map((tag) => createElement('span', { className: 'tag', textContent: tag }))
      ),
    ]),
  ]);

  const curriculum = createElement('div', { className: 'course-detail__curriculum' }, [
    createElement('h2', { className: 'course-detail__section-title', textContent: 'Curriculum' }),
    createElement('div', { className: 'course-detail__modules' },
      course.modules.map((mod, i) =>
        createElement('div', { className: 'module' }, [
          createElement('div', { className: 'module__header' }, [
            createElement('h3', { className: 'module__title', textContent: `Module ${i + 1}: ${mod.title}` }),
            createElement('span', { className: 'module__count', textContent: `${mod.lessons.length} lessons` }),
          ]),
          createElement('ul', { className: 'module__lessons' },
            mod.lessons.map((lesson) =>
              createElement('li', {
                className: `lesson-item ${lesson.completed ? 'lesson-item--completed' : ''}`,
                onClick: () => {
                  if (course.enrolled) {
                    window.location.href = `/courses/${course.id}/lessons/${lesson.id}`;
                  }
                },
              }, [
                createElement('span', { className: 'lesson-item__icon', innerHTML: lesson.completed ? icon('check') : lesson.type === 'video' ? icon('play') : icon('file') }),
                createElement('span', { className: 'lesson-item__title', textContent: lesson.title }),
                createElement('span', { className: 'lesson-item__duration', textContent: formatLessonDuration(lesson.duration) }),
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
