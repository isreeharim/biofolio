// Biofolio Public Portfolio Hydration & Analytics
import { 
  getPublicPortfolio, 
  logAnalyticsEvent 
} from './supabase.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const defaults = {
  name: 'Amelia Parker',
  role: 'Product designer & illustrator',
  bio: 'Designing thoughtful digital experiences with a soft spot for bold ideas, good type, and a perfectly brewed flat white.',
  theme: 'cream',
  font: 'serif',
  button: 'soft',
  links: [
    { title: 'My work', url: 'https://example.com', icon: '◫' },
    { title: 'Instagram', url: 'https://instagram.com', icon: '◎' },
    { title: 'LinkedIn', url: 'https://linkedin.com', icon: 'in' }
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userSlug = urlParams.get('u') || urlParams.get('user') || 'amelia';
  let portfolioData = null;

  try {
    if (window.BiofolioSupabase?.client) {
      portfolioData = await getPublicPortfolio(userSlug);
    }
  } catch (err) {
    console.warn('Could not fetch public portfolio from cloud, checking local storage:', err);
  }

  if (portfolioData) {
    hydrateCloudPortfolio(portfolioData);
    // Log Page View Event
    logAnalyticsEvent(portfolioData.id, 'page_view');
  } else {
    // Fallback to local storage or defaults
    hydrateLocalPortfolio();
  }

  setupShareButton();
  setupReportModal(portfolioData?.id);
});

function getInitials(name = '') {
  return name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'BF';
}

function hydrateCloudPortfolio(portfolio) {
  const profile = portfolio.profile || {};
  const theme = portfolio.theme || { palette: 'cream', font: 'serif', button: 'soft' };
  
  const displayName = profile.display_name || portfolio.title || 'Creator';
  const role = profile.headline || '';
  const bio = profile.bio || '';
  
  document.title = `${displayName} — Biofolio`;
  
  const avatarEl = $('#publicInitials');
  if (profile.avatar_url) {
    avatarEl.innerHTML = `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  } else {
    avatarEl.textContent = getInitials(displayName);
  }

  $('#publicName').textContent = displayName;
  $('#publicRole').textContent = role;
  $('#publicBio').textContent = bio;

  const container = $('#publicPortfolio');
  container.className = `public-portfolio theme-${theme.palette || 'cream'} font-${theme.font || 'serif'} button-${theme.button || 'soft'}`;

  // Render Sections (Links & Projects)
  const sectionsEl = $('#publicSections');
  sectionsEl.innerHTML = '';

  const sections = portfolio.sections || [];
  sections.forEach(section => {
    if (!section.is_visible) return;

    if (section.section_type === 'links') {
      const linksWrap = document.createElement('div');
      linksWrap.className = 'public-links';
      
      const items = section.items || [];
      linksWrap.innerHTML = items.map(item => `
        <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noreferrer" data-item-id="${item.id}" class="tracked-link">
          <span>${item.icon || '↗'}</span>
          ${escapeHtml(item.title)}
          <b>Open</b>
        </a>
      `).join('');

      sectionsEl.appendChild(linksWrap);
    } else if (section.section_type === 'projects') {
      const projWrap = document.createElement('div');
      projWrap.className = 'public-projects-list';
      if (section.title) {
        projWrap.innerHTML = `<h3 class="section-divider-title">${escapeHtml(section.title)}</h3>`;
      }
      
      const items = section.items || [];
      items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'public-project-card';
        itemEl.innerHTML = `
          ${item.image_url ? `<img class="public-project-thumb" src="${escapeHtml(item.image_url)}" alt="thumbnail" />` : ''}
          <div class="project-header">
            <h4>${escapeHtml(item.title)}</h4>
            ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" data-item-id="${item.id}" class="tracked-link project-link">Visit ↗</a>` : ''}
          </div>
          ${item.subtitle ? `<p class="project-sub">${escapeHtml(item.subtitle)}</p>` : ''}
          ${item.description ? `<p class="project-desc">${escapeHtml(item.description)}</p>` : ''}
          ${item.tags && item.tags.length ? `<div class="project-tags">${item.tags.map(t => `<span class="p-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        `;
        projWrap.appendChild(itemEl);
      });

      sectionsEl.appendChild(projWrap);
    }
  });

  // Attach click analytics to all tracked links
  $$('.tracked-link').forEach(link => {
    link.addEventListener('click', () => {
      const itemId = link.dataset.itemId || null;
      logAnalyticsEvent(portfolio.id, 'link_click', itemId);
    });
  });
}

function hydrateLocalPortfolio() {
  const local = JSON.parse(localStorage.getItem('biofolio-profile') || 'null') || defaults;
  document.title = `${local.name} — Biofolio`;
  
  const avatarEl = $('#publicInitials');
  if (local.avatar_url) {
    avatarEl.innerHTML = `<img src="${escapeHtml(local.avatar_url)}" alt="${escapeHtml(local.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  } else {
    avatarEl.textContent = getInitials(local.name);
  }

  $('#publicName').textContent = local.name;
  $('#publicRole').textContent = local.role;
  $('#publicBio').textContent = local.bio;
  
  const container = $('#publicPortfolio');
  container.className = `public-portfolio theme-${local.theme || 'cream'} font-${local.font || 'serif'} button-${local.button || 'soft'}`;

  const sectionsEl = $('#publicSections');
  if (sectionsEl) {
    sectionsEl.innerHTML = '';

    // Render Links
    const linksWrap = document.createElement('div');
    linksWrap.className = 'public-links';
    linksWrap.innerHTML = (local.links || []).map(link => `
      <a href="${escapeHtml(link.url || '#')}" target="_blank" rel="noreferrer">
        <span>${link.icon || '↗'}</span>
        ${escapeHtml(link.title)}
        <b>Open</b>
      </a>
    `).join('');
    sectionsEl.appendChild(linksWrap);

    // Render Projects if available
    if (local.projects && local.projects.length > 0) {
      const projWrap = document.createElement('div');
      projWrap.className = 'public-projects-list';
      projWrap.innerHTML = `<h3 class="section-divider-title">Featured Projects</h3>`;
      
      local.projects.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'public-project-card';
        itemEl.innerHTML = `
          ${item.image_url ? `<img class="public-project-thumb" src="${escapeHtml(item.image_url)}" alt="thumbnail" />` : ''}
          <div class="project-header">
            <h4>${escapeHtml(item.title)}</h4>
            ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" class="project-link">Visit ↗</a>` : ''}
          </div>
          ${item.subtitle ? `<p class="project-sub">${escapeHtml(item.subtitle)}</p>` : ''}
          ${item.description ? `<p class="project-desc">${escapeHtml(item.description)}</p>` : ''}
          ${item.tags && item.tags.length ? `<div class="project-tags">${item.tags.map(t => `<span class="p-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        `;
        projWrap.appendChild(itemEl);
      });

      sectionsEl.appendChild(projWrap);
    }
  }
}

function setupShareButton() {
  $('#shareProfileBtn')?.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url
        });
        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {}
    showToast('Portfolio link copied to clipboard!');
  });
}

function setupReportModal(portfolioId) {
  const modal = $('#reportModal');
  const btn = $('#reportContentBtn');
  const close = $('#reportClose');
  const form = $('#reportForm');

  if (!btn || !modal) return;

  btn.addEventListener('click', () => modal.classList.add('show'));
  close?.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = $('#reportReason').value;
    const email = $('#reportEmail').value.trim();
    const notes = $('#reportNotes').value.trim();
    const submitBtn = $('#reportSubmitBtn');
    const successBox = $('#reportSuccess');
    const errorBox = $('#reportError');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting report...';

      if (window.BiofolioSupabase?.client && portfolioId) {
        await window.BiofolioSupabase.client.from('content_reports').insert({
          portfolio_id: portfolioId,
          reported_by_email: email || null,
          reason: `${reason}: ${notes}`.trim()
        });
      }

      successBox.textContent = 'Thank you. Your report has been submitted for admin review.';
      successBox.classList.add('show');
      errorBox.classList.remove('show');
      
      setTimeout(() => {
        modal.classList.remove('show');
        successBox.classList.remove('show');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';
      }, 2000);
    } catch (err) {
      errorBox.textContent = 'Failed to submit report. Please try again.';
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Report';
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}
