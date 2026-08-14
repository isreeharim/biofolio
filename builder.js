// Biofolio Studio Builder Controller
import { 
  getCurrentUser, 
  getCurrentProfile, 
  getUserPortfolio, 
  signOutUser,
  uploadMedia,
  logAnalyticsEvent
} from './supabase.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let currentUser = null;
let currentProfile = null;
let currentPortfolio = null;
let saveDebounceTimer = null;
let currentAvatarUrl = null;

// Projects state
let projects = [
  {
    id: 'proj-1',
    title: 'Biofolio Site Builder',
    subtitle: 'No-code portfolio builder · 2026',
    description: 'Built a lightning-fast portfolio generator with live previews, curated aesthetics, and real-time custom styling.',
    url: 'https://biofolio.site',
    image_url: '',
    tags: ['Web', 'UI/UX', 'SaaS']
  },
  {
    id: 'proj-2',
    title: 'Minimal Design System',
    subtitle: 'Open-source UI Kit',
    description: 'A collection of tactile, accessible interface components built with modern CSS tokens and zero dependencies.',
    url: 'https://example.com/design-system',
    image_url: '',
    tags: ['Figma', 'CSS', 'Open Source']
  }
];

// Local fallback state if working offline / without auth
const defaultProfile = {
  name: 'Amelia Parker',
  role: 'Product designer & illustrator',
  bio: 'Designing thoughtful digital experiences with a soft spot for bold ideas, good type, and a perfectly brewed flat white.',
  theme: 'cream',
  font: 'serif',
  button: 'soft',
  avatar_url: '',
  links: [
    { id: 'link-1', title: 'Selected Case Studies', url: 'https://example.com/work', icon: '◫' },
    { id: 'link-2', title: 'Design Work on Instagram', url: 'https://instagram.com/amelia', icon: '◎' },
    { id: 'link-3', title: 'Connect on LinkedIn', url: 'https://linkedin.com/in/ameliaparker', icon: 'in' }
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  await initStudio();
  setupNavigation();
  setupEditorTabs();
  setupLivePreviewBindings();
  setupThemeCustomizers();
  setupDraggableLinks();
  setupProjectsManagement();
  setupAvatarUpload();
  setupProfileModal();
  setupPublishModal();
  setupSignOut();
});

async function initStudio() {
  try {
    currentUser = await getCurrentUser();
    if (currentUser) {
      currentProfile = await getCurrentProfile();
      currentPortfolio = await getUserPortfolio(currentUser.id);
      
      // Update UI with real user data
      if (currentProfile) {
        $('#sidebarName').textContent = currentProfile.display_name;
        $('#sidebarUsername').textContent = `@${currentProfile.username}`;
        $('#topbarDomain').textContent = `${currentProfile.username}.biofolio.site`;
        $('#modalShareUrl').textContent = `biofolio.site/${currentProfile.username}`;
        
        currentAvatarUrl = currentProfile.avatar_url || '';
        renderAvatar(currentProfile.display_name, currentAvatarUrl);
        
        $('#profileName').textContent = currentProfile.display_name;
        $('#previewName').textContent = currentProfile.display_name;
        $('#profileRole').textContent = currentProfile.headline || 'Creator & Builder';
        $('#previewRole').textContent = currentProfile.headline || 'Creator & Builder';
        
        if (currentProfile.bio) {
          $('#bio').value = currentProfile.bio;
          $('#previewBio').textContent = currentProfile.bio;
          $('.count').textContent = `${currentProfile.bio.length} / 160`;
        }

        const viewLiveLink = $('#viewLiveLink');
        if (viewLiveLink) {
          viewLiveLink.href = `portfolio.html?u=${currentProfile.username}`;
        }
      }

      if (currentPortfolio) {
        // Apply theme
        const themeConfig = currentPortfolio.theme || {};
        applyTheme(themeConfig.palette || 'cream', themeConfig.font || 'serif', themeConfig.button || 'soft');
        
        // Render links from portfolio sections
        const linkSection = currentPortfolio.sections?.find(s => s.section_type === 'links');
        if (linkSection && linkSection.items?.length > 0) {
          renderLinksList(linkSection.items);
        }

        // Render projects from portfolio sections
        const projectSection = currentPortfolio.sections?.find(s => s.section_type === 'projects');
        if (projectSection && projectSection.items?.length > 0) {
          projects = projectSection.items.map(it => ({
            id: it.id,
            title: it.title,
            subtitle: it.subtitle || '',
            description: it.description || '',
            url: it.url || '',
            image_url: it.image_url || '',
            tags: it.tags || []
          }));
        }
        renderProjectsList();
      }
    } else {
      // Offline / Demo Mode with LocalStorage
      loadLocalState();
    }
  } catch (err) {
    console.warn('Error loading studio data from cloud, using local fallback:', err);
    loadLocalState();
  }
}

function getInitials(name = '') {
  return name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'BF';
}

function renderAvatar(name, avatarUrl) {
  const initials = getInitials(name);
  const elements = [$('#sidebarAvatar'), $('#profileInitials'), $('#previewInitials')];

  elements.forEach(el => {
    if (!el) return;
    if (avatarUrl) {
      el.innerHTML = `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" />`;
    } else {
      el.textContent = initials;
    }
  });

  const removeBtn = $('#removePhotoBtn');
  if (removeBtn) {
    removeBtn.style.display = avatarUrl ? 'inline-block' : 'none';
  }
}

function loadLocalState() {
  const local = JSON.parse(localStorage.getItem('biofolio-profile') || 'null') || defaultProfile;
  $('#profileName').textContent = local.name;
  $('#previewName').textContent = local.name;
  $('#profileRole').textContent = local.role;
  $('#previewRole').textContent = local.role;
  $('#bio').value = local.bio;
  $('#previewBio').textContent = local.bio;
  $('.count').textContent = `${local.bio.length} / 160`;
  
  currentAvatarUrl = local.avatar_url || '';
  renderAvatar(local.name, currentAvatarUrl);
  
  applyTheme(local.theme || 'cream', local.font || 'serif', local.button || 'soft');

  if (local.projects && local.projects.length > 0) {
    projects = local.projects;
  }
  renderProjectsList();
}

function applyTheme(palette, font, button) {
  const screen = $('#phoneScreen');
  if (!screen) return;
  screen.className = `phone-screen theme-${palette} font-${font} button-${button}`;
  
  $$('.theme-card').forEach(c => c.classList.toggle('selected', c.dataset.theme === palette));
  $$('.font-choice').forEach(c => c.classList.toggle('selected', c.dataset.font === font));
  $$('.button-style').forEach(c => c.classList.toggle('selected', c.dataset.button === button));
}

// 1. Navigation
function setupNavigation() {
  $$('.nav-item').forEach(button => button.addEventListener('click', () => {
    $$('.nav-item').forEach(item => item.classList.toggle('active', item === button));
    $$('.page').forEach(page => page.classList.toggle('active-page', page.id === button.dataset.page));
  }));
}

// 2. Editor tabs (Content / Design)
function setupEditorTabs() {
  $$('.editor-tab').forEach(button => button.addEventListener('click', () => {
    $$('.editor-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    $$('.tab-content').forEach(tab => tab.classList.toggle('active', tab.id === `${button.dataset.tab}-tab`));
  }));
}

// 3. Live Preview Bindings
function setupLivePreviewBindings() {
  const bio = $('#bio');
  bio?.addEventListener('input', () => {
    $('#previewBio').textContent = bio.value;
    $('.count').textContent = `${bio.value.length} / 160`;
    triggerAutoSave();
  });

  $('#previewButton')?.addEventListener('click', () => {
    $('#phoneScreen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Showing your live mobile preview');
  });

  $('#openLiveBtn')?.addEventListener('click', () => {
    const username = currentProfile?.username || 'amelia';
    window.open(`portfolio.html?u=${username}`, '_blank');
  });
}

// 4. Look & Feel Customizers
function setupThemeCustomizers() {
  $$('.theme-card').forEach(card => card.addEventListener('click', () => {
    $$('.theme-card').forEach(item => item.classList.toggle('selected', item === card));
    const screen = $('#phoneScreen');
    screen.classList.remove('theme-cream', 'theme-lavender', 'theme-ink', 'theme-mint');
    screen.classList.add(`theme-${card.dataset.theme}`);
    triggerAutoSave();
  }));

  $$('.font-choice').forEach(choice => choice.addEventListener('click', () => {
    $$('.font-choice').forEach(item => item.classList.toggle('selected', item === choice));
    const screen = $('#phoneScreen');
    screen.classList.remove('font-serif', 'font-sans');
    screen.classList.add(`font-${choice.dataset.font}`);
    triggerAutoSave();
  }));

  $$('.button-style').forEach(choice => choice.addEventListener('click', () => {
    $$('.button-style').forEach(item => item.classList.toggle('selected', item === choice));
    const screen = $('#phoneScreen');
    screen.classList.remove('button-soft', 'button-sharp', 'button-outline');
    screen.classList.add(`button-${choice.dataset.button}`);
    triggerAutoSave();
  }));
}

// 5. Draggable Links List
function setupDraggableLinks() {
  const linksList = $('#linksList');
  if (!linksList) return;

  $$('.link-item', linksList).forEach(enableDrag);

  linksList.addEventListener('dragover', event => {
    event.preventDefault();
    const items = $$('.link-item:not(.dragging)', linksList);
    const next = items.find(item => event.clientY <= item.getBoundingClientRect().top + item.offsetHeight / 2);
    linksList.insertBefore(window.__draggedItem, next || null);
    syncPreviewLinks();
    triggerAutoSave();
  });
}

function enableDrag(item) {
  item.addEventListener('dragstart', () => {
    window.__draggedItem = item;
    item.classList.add('dragging');
  });
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
  });
}

function syncPreviewLinks() {
  const linksList = $('#linksList');
  const previewLinks = $('#previewLinks');
  if (!linksList || !previewLinks) return;

  previewLinks.innerHTML = $$('.link-item', linksList).map(item => {
    const icon = $('.link-glyph', item)?.textContent || '↗';
    const title = $('strong', item)?.textContent || 'Link';
    return `<a href="#"><span>${icon}</span> ${title} <b>↗</b></a>`;
  }).join('');
}

function renderLinksList(items) {
  const linksList = $('#linksList');
  if (!linksList) return;
  linksList.innerHTML = items.map((item, idx) => `
    <article class="link-item" draggable="true" data-id="${item.id}">
      <span class="grip">⠿</span>
      <span class="link-glyph ${idx % 3 === 0 ? 'purple' : idx % 3 === 1 ? 'orange' : 'blue'}">${item.icon || '↗'}</span>
      <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.url || 'Destination')}</small></div>
      <button class="item-more">•••</button>
    </article>
  `).join('');
  
  $$('.link-item', linksList).forEach(enableDrag);
  syncPreviewLinks();
}

// 6. Direct Avatar Image Upload System
function setupAvatarUpload() {
  const fileInput = $('#avatarFileInput');
  const changeBtn = $('#changePhotoBtn');
  const removeBtn = $('#removePhotoBtn');
  const avatarWrap = $('#profileInitials');

  changeBtn?.addEventListener('click', () => fileInput?.click());
  avatarWrap?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB');
      return;
    }

    showToast('Uploading profile photo...');
    try {
      if (currentUser && window.BiofolioSupabase?.client) {
        const publicUrl = await uploadMedia(file, 'avatars');
        currentAvatarUrl = publicUrl;
      } else {
        // Local base64 data preview fallback
        const reader = new FileReader();
        reader.onload = (re) => {
          currentAvatarUrl = re.target.result;
          renderAvatar($('#profileName').textContent, currentAvatarUrl);
          triggerAutoSave();
        };
        reader.readAsDataURL(file);
        return;
      }

      renderAvatar($('#profileName').textContent, currentAvatarUrl);
      triggerAutoSave();
      showToast('Profile photo updated successfully!');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast(`Upload failed: ${err.message}`);
    }
  });

  removeBtn?.addEventListener('click', () => {
    currentAvatarUrl = '';
    renderAvatar($('#profileName').textContent, '');
    triggerAutoSave();
    showToast('Photo removed.');
  });
}

// 7. Featured Projects Management & Thumbnail Uploads
function setupProjectsManagement() {
  renderProjectsList();

  const addBtn = $('#addProjectBtn');
  const modal = $('#projectModal');
  const closeBtn = $('#projectClose');
  const form = $('#projectForm');
  const thumbInput = $('#projImageFileInput');
  const uploadZone = $('#projUploadZone');
  const removeThumbBtn = $('#removeProjThumbBtn');

  addBtn?.addEventListener('click', () => {
    openProjectModal(null);
  });

  closeBtn?.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  uploadZone?.addEventListener('click', (e) => {
    if (e.target !== removeThumbBtn) {
      thumbInput?.click();
    }
  });

  thumbInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }

    showToast('Uploading project thumbnail...');
    try {
      let thumbUrl = '';
      if (currentUser && window.BiofolioSupabase?.client) {
        thumbUrl = await uploadMedia(file, 'portfolio-media');
      } else {
        const reader = new FileReader();
        reader.onload = (re) => {
          setProjectModalThumb(re.target.result);
        };
        reader.readAsDataURL(file);
        return;
      }

      setProjectModalThumb(thumbUrl);
      showToast('Thumbnail uploaded!');
    } catch (err) {
      showToast(`Thumbnail upload failed: ${err.message}`);
    }
  });

  removeThumbBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setProjectModalThumb('');
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idInput = $('#projIdInput').value;
    const title = $('#projTitle').value.trim();
    const subtitle = $('#projSubtitle').value.trim();
    const description = $('#projDesc').value.trim();
    const url = $('#projUrl').value.trim();
    const imageUrl = $('#projImageUrl').value.trim();
    const tagsRaw = $('#projTags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (idInput) {
      // Edit existing
      const existing = projects.find(p => p.id === idInput);
      if (existing) {
        existing.title = title;
        existing.subtitle = subtitle;
        existing.description = description;
        existing.url = url;
        existing.image_url = imageUrl;
        existing.tags = tags;
      }
    } else {
      // Add new
      const newProj = {
        id: `proj-${Date.now()}`,
        title,
        subtitle,
        description,
        url,
        image_url: imageUrl,
        tags
      };
      projects.push(newProj);
    }

    modal.classList.remove('show');
    renderProjectsList();
    triggerAutoSave();
    showToast(idInput ? 'Project updated' : 'Project added');
  });
}

function setProjectModalThumb(url) {
  const hiddenInput = $('#projImageUrl');
  const previewWrap = $('#projUploadPreview');
  const placeholder = $('#projUploadPlaceholder');
  const img = $('#projPreviewImg');

  if (hiddenInput) hiddenInput.value = url || '';

  if (url) {
    if (img) img.src = url;
    if (previewWrap) previewWrap.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  } else {
    if (img) img.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }
}

function openProjectModal(project = null) {
  const modal = $('#projectModal');
  const titleEl = $('#projectModalTitle');
  const idInput = $('#projIdInput');
  const titleInput = $('#projTitle');
  const subtitleInput = $('#projSubtitle');
  const descInput = $('#projDesc');
  const urlInput = $('#projUrl');
  const tagsInput = $('#projTags');

  if (project) {
    titleEl.textContent = 'Edit Project';
    idInput.value = project.id;
    titleInput.value = project.title || '';
    subtitleInput.value = project.subtitle || '';
    descInput.value = project.description || '';
    urlInput.value = project.url || '';
    tagsInput.value = (project.tags || []).join(', ');
    setProjectModalThumb(project.image_url || '');
  } else {
    titleEl.textContent = 'Add New Project';
    idInput.value = '';
    titleInput.value = '';
    subtitleInput.value = '';
    descInput.value = '';
    urlInput.value = '';
    tagsInput.value = '';
    setProjectModalThumb('');
  }

  modal.classList.add('show');
  titleInput.focus();
}

function renderProjectsList() {
  const container = $('#projectsList');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px;border:1px dashed #e4dfda;border-radius:10px;color:#918c95;font-size:12px;">
        No projects added yet. Click <strong>+ Add project</strong> to showcase your work.
      </div>
    `;
    syncPreviewProjects();
    return;
  }

  container.innerHTML = projects.map(proj => `
    <article class="project-builder-item" draggable="true" data-id="${proj.id}">
      <span class="grip">⠿</span>
      <div class="project-thumb-preview">
        ${proj.image_url ? `<img src="${escapeHtml(proj.image_url)}" alt="thumb" />` : '◫'}
      </div>
      <div class="project-builder-info">
        <strong>${escapeHtml(proj.title)}</strong>
        ${proj.subtitle ? `<span class="project-sub-txt">${escapeHtml(proj.subtitle)}</span>` : ''}
        ${proj.description ? `<p class="project-desc-txt">${escapeHtml(proj.description)}</p>` : ''}
        ${proj.tags && proj.tags.length ? `
          <div class="project-tags-row">
            ${proj.tags.map(t => `<span class="tag-pill-sm">${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="project-actions-btns">
        <button type="button" class="btn-icon-action" data-action="edit-proj" data-id="${proj.id}" title="Edit project">✎</button>
        <button type="button" class="btn-icon-action delete" data-action="delete-proj" data-id="${proj.id}" title="Delete project">🗑</button>
      </div>
    </article>
  `).join('');

  // Enable drag & drop for projects list
  $$('.project-builder-item', container).forEach(item => {
    item.addEventListener('dragstart', () => {
      window.__draggedProject = item;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const items = $$('.project-builder-item:not(.dragging)', container);
    const next = items.find(item => e.clientY <= item.getBoundingClientRect().top + item.offsetHeight / 2);
    container.insertBefore(window.__draggedProject, next || null);

    // Reorder state array according to DOM
    const newOrderIds = $$('.project-builder-item', container).map(el => el.dataset.id);
    projects.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
    syncPreviewProjects();
    triggerAutoSave();
  });

  // Attach action buttons
  $$('[data-action="edit-proj"]', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const proj = projects.find(p => p.id === btn.dataset.id);
      if (proj) openProjectModal(proj);
    });
  });

  $$('[data-action="delete-proj"]', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      projects = projects.filter(p => p.id !== btn.dataset.id);
      renderProjectsList();
      triggerAutoSave();
      showToast('Project removed');
    });
  });

  syncPreviewProjects();
}

function syncPreviewProjects() {
  const previewEl = $('#previewProjects');
  if (!previewEl) return;

  if (projects.length === 0) {
    previewEl.innerHTML = '';
    return;
  }

  previewEl.innerHTML = `
    <div style="font-size:9px;font-weight:700;letter-spacing:0.5px;opacity:0.6;margin:10px 0 6px;">FEATURED PROJECTS</div>
    ${projects.map(proj => `
      <div class="preview-project-card">
        ${proj.image_url ? `<img class="preview-project-thumb" src="${escapeHtml(proj.image_url)}" alt="cover" />` : ''}
        <div class="preview-project-header">
          <strong>${escapeHtml(proj.title)}</strong>
          ${proj.url ? `<a href="#" class="preview-project-link">Visit ↗</a>` : ''}
        </div>
        ${proj.subtitle ? `<div class="preview-project-sub">${escapeHtml(proj.subtitle)}</div>` : ''}
        ${proj.tags && proj.tags.length ? `
          <div class="preview-project-tags">
            ${proj.tags.map(t => `<span class="preview-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  `;
}

// 8. Profile & Link Editor Modal
function setupProfileModal() {
  const editorModal = $('#editorModal');
  const editorForm = $('#editorForm');
  const fields = $('#modalFields');

  function openEditor(mode) {
    editorForm.dataset.mode = mode;
    const isProfile = mode === 'profile';
    $('#editorEyebrow').textContent = isProfile ? 'YOUR PROFILE' : 'NEW DESTINATION';
    $('#editorTitle').textContent = isProfile ? 'Edit your profile' : 'Add a link';
    $('#editorSubmit').textContent = isProfile ? 'Save changes' : 'Add link';

    if (isProfile) {
      const curName = $('#profileName').textContent;
      const curRole = $('#profileRole').textContent;
      const curBio = $('#bio').value;
      fields.innerHTML = `
        <div class="modal-field"><label>Name</label><input required name="name" value="${escapeHtml(curName)}"></div>
        <div class="modal-field"><label>What you do</label><input required name="role" value="${escapeHtml(curRole)}"></div>
        <div class="modal-field"><label>Short bio</label><textarea required name="bio" maxlength="160">${escapeHtml(curBio)}</textarea></div>
      `;
    } else {
      fields.innerHTML = `
        <div class="modal-field"><label>Link title</label><input required name="title" placeholder="e.g. My portfolio case study"></div>
        <div class="modal-field"><label>URL</label><input required name="url" type="url" placeholder="https://"></div>
      `;
    }
    editorModal.classList.add('show');
  }

  function closeEditor() {
    editorModal.classList.remove('show');
  }

  $$('.profile-edit-trigger').forEach(b => b.addEventListener('click', () => openEditor('profile')));
  
  $('#addLink')?.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
    openEditor('link');
  });

  $('#editorClose')?.addEventListener('click', closeEditor);
  editorModal?.addEventListener('click', (e) => {
    if (e.target === editorModal) closeEditor();
  });

  editorForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(editorForm);
    if (editorForm.dataset.mode === 'profile') {
      const name = data.get('name').trim();
      const role = data.get('role').trim();
      const bio = data.get('bio').trim();

      $('#profileName').textContent = name;
      $('#previewName').textContent = name;
      $('#profileRole').textContent = role;
      $('#previewRole').textContent = role;
      $('#bio').value = bio;
      $('#previewBio').textContent = bio;
      $('.count').textContent = `${bio.length} / 160`;

      renderAvatar(name, currentAvatarUrl);
    } else {
      const title = data.get('title').trim();
      const url = data.get('url').trim();
      const link = document.createElement('article');
      link.className = 'link-item';
      link.draggable = true;
      link.innerHTML = `<span class="grip">⠿</span><span class="link-glyph purple">↗</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(url)}</small></div><button class="item-more">•••</button>`;
      $('#linksList')?.append(link);
      enableDrag(link);
      syncPreviewLinks();
    }

    closeEditor();
    triggerAutoSave();
    showToast('Changes applied');
  });
}

// 9. Publishing & Sharing Modal
function setupPublishModal() {
  const modal = $('#modal');
  $('#publishButton')?.addEventListener('click', async () => {
    modal.classList.add('show');
    showToast('Portfolio published live to the web!');
    
    // Save is_published to Supabase if connected
    if (window.BiofolioSupabase?.client && currentPortfolio) {
      try {
        await window.BiofolioSupabase.client
          .from('portfolios')
          .update({ is_published: true, updated_at: new Date().toISOString() })
          .eq('id', currentPortfolio.id);
      } catch (err) {
        console.warn('Publish update error:', err);
      }
    }
  });

  $('#modalClose')?.addEventListener('click', () => modal.classList.remove('show'));
  $('#doneButton')?.addEventListener('click', () => modal.classList.remove('show'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

  $('#copyButton')?.addEventListener('click', async () => {
    const slug = currentProfile?.username || 'amelia';
    const url = `${window.location.origin}/portfolio.html?u=${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {}
    showToast('Link copied to clipboard!');
  });
}

// 10. Sign Out
function setupSignOut() {
  $('#signOutBtn')?.addEventListener('click', async () => {
    await signOutUser();
    showToast('Signed out. Returning to home...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  });
}

// 11. Auto-save Engine
function triggerAutoSave() {
  const indicator = $('#saveStateIndicator');
  if (indicator) {
    indicator.innerHTML = '<span class="pulse" style="display:inline-block;width:8px;height:8px;background:#f59e0b;border-radius:50%;margin-right:6px;"></span> Saving changes...';
  }

  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    await savePortfolioData();
    if (indicator) {
      indicator.innerHTML = '<span class="check">✓</span> All changes saved';
    }
  }, 600);
}

async function savePortfolioData() {
  const selectedTheme = $('.theme-card.selected')?.dataset.theme || 'cream';
  const selectedFont = $('.font-choice.selected')?.dataset.font || 'serif';
  const selectedButton = $('.button-style.selected')?.dataset.button || 'soft';

  const name = $('#profileName')?.textContent || 'Amelia Parker';
  const role = $('#profileRole')?.textContent || 'Product designer';
  const bio = $('#bio')?.value || '';

  const linksData = $$('.link-item', $('#linksList')).map(item => ({
    title: $('strong', item)?.textContent || 'Link',
    url: $('small', item)?.textContent || '#',
    icon: $('.link-glyph', item)?.textContent || '↗'
  }));

  // Local storage backup
  const localData = {
    name,
    role,
    bio,
    avatar_url: currentAvatarUrl,
    theme: selectedTheme,
    font: selectedFont,
    button: selectedButton,
    links: linksData,
    projects: projects
  };
  localStorage.setItem('biofolio-profile', JSON.stringify(localData));

  // Cloud Supabase sync
  if (window.BiofolioSupabase?.client && currentUser && currentPortfolio) {
    try {
      const client = window.BiofolioSupabase.client;
      
      // 1. Update Profile (including avatar_url)
      await client.from('profiles').update({
        display_name: name,
        headline: role,
        bio: bio,
        avatar_url: currentAvatarUrl || null,
        updated_at: new Date().toISOString()
      }).eq('id', currentUser.id);

      // 2. Update Portfolio Theme
      await client.from('portfolios').update({
        theme: { palette: selectedTheme, font: selectedFont, button: selectedButton },
        updated_at: new Date().toISOString()
      }).eq('id', currentPortfolio.id);

      // 3. Sync Sections & Items
      // Upsert Links section
      let linkSec = currentPortfolio.sections?.find(s => s.section_type === 'links');
      if (!linkSec) {
        const { data: newSec } = await client.from('portfolio_sections').insert({
          portfolio_id: currentPortfolio.id,
          section_type: 'links',
          title: 'Featured Links',
          sort_order: 0
        }).select().single();
        linkSec = newSec;
      }

      // Upsert Projects section
      let projSec = currentPortfolio.sections?.find(s => s.section_type === 'projects');
      if (!projSec) {
        const { data: newSec } = await client.from('portfolio_sections').insert({
          portfolio_id: currentPortfolio.id,
          section_type: 'projects',
          title: 'Featured Projects',
          sort_order: 1
        }).select().single();
        projSec = newSec;
      }

      // Sync Projects Items
      if (projSec) {
        // Clear and rewrite project items
        await client.from('portfolio_items').delete().eq('section_id', projSec.id);
        if (projects.length > 0) {
          const itemsToInsert = projects.map((p, idx) => ({
            section_id: projSec.id,
            title: p.title,
            subtitle: p.subtitle || null,
            description: p.description || null,
            url: p.url || null,
            image_url: p.image_url || null,
            tags: p.tags || [],
            sort_order: idx
          }));
          await client.from('portfolio_items').insert(itemsToInsert);
        }
      }

    } catch (err) {
      console.warn('Cloud sync error:', err);
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message = 'Changes saved') {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}
