import { createElement, clearElement } from '../../utils/dom.js';
import { marketplaceService } from '../../services/index.js';
import { MarketplaceActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import { renderGigCard } from '../../components/ui/cards.js';
import { renderSkeleton, renderPagination } from '../../components/ui/forms.js';
import { renderEmptyState } from '../../components/ui/loading.js';
import { openProposalModal } from '../../components/ui/modal.js';
import { UIActions } from '../../store/actions.js';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/format.js';
import { debounce } from '../../utils/helpers.js';
import { icon } from '../../utils/icons.js';

export async function renderMarketplacePage(container) {
  clearElement(container);
  container.appendChild(renderSkeleton(3, 'card'));

  try {
    const { gigs, pagination } = await marketplaceService.getGigs();
    MarketplaceActions.setGigs(gigs, pagination);
    renderMarketplace(container, gigs, pagination);
  } catch (error) {
    container.innerHTML = '<p class="error-text">Failed to load marketplace.</p>';
  }
}

function renderMarketplace(container, gigs, pagination) {
  clearElement(container);

  const page = createElement('div', { className: 'marketplace-page' });

  const header = createElement('div', { className: 'marketplace-page__header' }, [
    createElement('div', {}, [
      createElement('h1', { className: 'marketplace-page__title', textContent: 'Freelance Marketplace' }),
      createElement('p', { className: 'marketplace-page__subtitle', textContent: 'Find projects, submit proposals, and build your professional portfolio.' }),
    ]),
  ]);

  const filters = createElement('div', { className: 'marketplace-page__filters' }, [
    createElement('input', {
      className: 'form-input',
      type: 'text',
      placeholder: 'Search gigs...',
      id: 'gig-search',
    }),
    createElement('select', { className: 'form-select', id: 'budget-filter' }, [
      createElement('option', { value: '', textContent: 'All Budgets' }),
      createElement('option', { value: 'under-1000', textContent: 'Under $1,000' }),
      createElement('option', { value: '1000-5000', textContent: '$1,000 - $5,000' }),
      createElement('option', { value: 'over-5000', textContent: 'Over $5,000' }),
    ]),
  ]);

  const gigList = createElement('div', { className: 'marketplace-page__list' });

  if (gigs.length === 0) {
    gigList.appendChild(renderEmptyState('No gigs available matching your criteria.', 'briefcase'));
  } else {
    gigs.forEach((gig) => gigList.appendChild(renderGigCard(gig)));
  }

  page.append(header, filters, gigList);
  container.appendChild(page);

  const searchInput = page.querySelector('#gig-search');
  const handleSearch = debounce(async () => {
    const search = searchInput.value;
    gigList.innerHTML = '';
    gigList.appendChild(renderSkeleton(3, 'card'));
    try {
      const { gigs: filtered } = await marketplaceService.getGigs({ search });
      gigList.innerHTML = '';
      if (filtered.length === 0) {
        gigList.appendChild(renderEmptyState('No gigs found.', 'briefcase'));
      } else {
        filtered.forEach((g) => gigList.appendChild(renderGigCard(g)));
      }
    } catch (err) {
      gigList.innerHTML = '<p class="error-text">Failed to search gigs.</p>';
    }
  }, 300);

  searchInput.addEventListener('input', handleSearch);
}

export async function renderGigDetailPage(container, gigId) {
  clearElement(container);
  container.appendChild(renderSkeleton(1, 'card'));

  try {
    const gig = await marketplaceService.getGigById(gigId);
    if (!gig) {
      container.appendChild(renderEmptyState('Gig not found.', 'search'));
      return;
    }
    MarketplaceActions.setCurrentGig(gig);
    renderGigDetail(container, gig);
  } catch (error) {
    container.innerHTML = '<p class="error-text">Failed to load gig details.</p>';
  }
}

function renderGigDetail(container, gig) {
  clearElement(container);

  const page = createElement('div', { className: 'gig-detail' }, [
    createElement('div', { className: 'gig-detail__header' }, [
      createElement('button', {
        className: 'btn btn--ghost',
        textContent: '← Back to Marketplace',
        onClick: () => history.back(),
      }),
    ]),
    createElement('div', { className: 'gig-detail__content' }, [
      createElement('div', { className: 'gig-detail__main' }, [
        createElement('div', { className: 'gig-detail__client card' }, [
          createElement('div', { className: 'gig-detail__client-info' }, [
            createElement('div', { className: 'avatar avatar--lg' }),
            createElement('div', {}, [
              createElement('h3', { textContent: gig.client.name }),
              gig.client.verified && createElement('span', { className: 'badge badge--success', innerHTML: `${icon('check')} Verified Client` }),
            ]),
          ]),
        ]),
        createElement('h1', { className: 'gig-detail__title', textContent: gig.title }),
        createElement('div', { className: 'gig-detail__meta' }, [
          createElement('span', { textContent: `Posted ${formatRelativeTime(gig.postedAt)}` }),
          createElement('span', { textContent: `${gig.proposals} proposals` }),
          createElement('span', { className: `badge badge--${gig.status === 'open' ? 'success' : 'default'}`, textContent: gig.status }),
        ]),
        createElement('div', { className: 'gig-detail__description prose' }, [
          createElement('h3', { textContent: 'Project Description' }),
          createElement('p', { textContent: gig.description }),
        ]),
        createElement('div', { className: 'gig-detail__skills' }, [
          createElement('h3', { textContent: 'Required Skills' }),
          createElement('div', { className: 'tag-list' },
            gig.skills.map((skill) => createElement('span', { className: 'tag', textContent: skill }))
          ),
        ]),
      ]),
      createElement('div', { className: 'gig-detail__sidebar' }, [
        createElement('div', { className: 'gig-detail__budget card' }, [
          createElement('h3', { textContent: 'Budget' }),
          createElement('p', { className: 'gig-detail__budget-value', textContent: gig.budget.type === 'fixed' ? `${formatCurrency(gig.budget.min)} - ${formatCurrency(gig.budget.max)}` : `${formatCurrency(gig.budget.min)} - ${formatCurrency(gig.budget.max)}/hr` }),
          createElement('p', { className: 'text-muted', textContent: gig.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate' }),
        ]),
        createElement('div', { className: 'gig-detail__info card' }, [
          createElement('div', { className: 'gig-detail__info-item' }, [
            createElement('span', { className: 'text-muted', textContent: 'Duration' }),
            createElement('span', { textContent: gig.duration }),
          ]),
          createElement('div', { className: 'gig-detail__info-item' }, [
            createElement('span', { className: 'text-muted', textContent: 'Proposals' }),
            createElement('span', { textContent: `${gig.proposals} received` }),
          ]),
        ]),
        gig.status === 'open' && createElement('button', {
          className: 'btn btn--primary btn--full',
          textContent: 'Submit Proposal',
          onClick: () => {
            openProposalModal(gig.title, async (proposal) => {
              try {
                await marketplaceService.submitProposal(gig.id, proposal);
                UIActions.addToast('Proposal submitted successfully!', 'success');
              } catch (err) {
                UIActions.addToast('Failed to submit proposal.', 'error');
              }
            });
          },
        }),
      ]),
    ]),
  ]);

  container.appendChild(page);
}
