const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Navigation
$$('.nav-item').forEach(button => button.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.toggle('active', item === button));
  $$('.page').forEach(page => page.classList.toggle('active-page', page.id === button.dataset.page));
}));

// Editor tabs
$$('.editor-tab').forEach(button => button.addEventListener('click', () => {
  $$('.editor-tab').forEach(tab => tab.classList.toggle('active', tab === button));
  $$('.tab-content').forEach(tab => tab.classList.toggle('active', tab.id === `${button.dataset.tab}-tab`));
}));

// Live bio preview
const bio = $('#bio');
bio.addEventListener('input', () => {
  $('#previewBio').textContent = bio.value;
  $('.count').textContent = `${bio.value.length} / 160`;
});

// Theme selection
$$('.theme-card').forEach(card => card.addEventListener('click', () => {
  $$('.theme-card').forEach(item => item.classList.toggle('selected', item === card));
  const screen = $('#phoneScreen');
  screen.classList.remove('theme-cream', 'theme-lavender', 'theme-ink', 'theme-mint');
  screen.classList.add(`theme-${card.dataset.theme}`);
}));
$$('.font-choice').forEach(choice => choice.addEventListener('click', () => {
  $$('.font-choice').forEach(item => item.classList.toggle('selected', item === choice));
  const screen = $('#phoneScreen');
  screen.classList.remove('font-serif', 'font-sans');
  screen.classList.add(`font-${choice.dataset.font}`);
}));
$$('.button-style').forEach(choice => choice.addEventListener('click', () => {
  $$('.button-style').forEach(item => item.classList.toggle('selected', item === choice));
  const screen = $('#phoneScreen');
  screen.classList.remove('button-soft', 'button-sharp', 'button-outline');
  screen.classList.add(`button-${choice.dataset.button}`);
}));

// Draggable link ordering
let dragged;
const linksList = $('#linksList');
$$('.link-item').forEach(enableDrag);
function enableDrag(item) {
  item.addEventListener('dragstart', () => { dragged = item; item.classList.add('dragging'); });
  item.addEventListener('dragend', () => item.classList.remove('dragging'));
}
linksList.addEventListener('dragover', event => {
  event.preventDefault();
  const items = $$('.link-item:not(.dragging)', linksList);
  const next = items.find(item => event.clientY <= item.getBoundingClientRect().top + item.offsetHeight / 2);
  linksList.insertBefore(dragged, next || null);
  syncPreviewLinks();
});
function syncPreviewLinks() {
  $('#previewLinks').innerHTML = $$('.link-item', linksList).map(item => {
    const icon = $('.link-glyph', item).textContent;
    const title = $('strong', item).textContent;
    return `<a href="#"><span>${icon}</span> ${title} <b>↗</b></a>`;
  }).join('');
}

let newLinkCount = 0;
$('#addLink').addEventListener('click', () => {
  newLinkCount += 1;
  const link = document.createElement('article');
  link.className = 'link-item';
  link.draggable = true;
  link.innerHTML = `<span class="grip">⠿</span><span class="link-glyph purple">↗</span><div><strong>New link ${newLinkCount}</strong><small>Add a destination</small></div><button class="item-more">•••</button>`;
  linksList.append(link);
  enableDrag(link);
  syncPreviewLinks();
});

// Publishing / sharing
const modal = $('#modal');
$('#publishButton').addEventListener('click', () => modal.classList.add('show'));
$('#modalClose').addEventListener('click', () => modal.classList.remove('show'));
$('#doneButton').addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('show'); });
function showToast(message = 'Link copied to clipboard') {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}
$('#copyButton').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('https://biofolio.site/amelia'); } catch (_) {}
  showToast();
});
$('.share-card button').addEventListener('click', () => showToast());
$('#previewButton').addEventListener('click', () => {
  $('#phoneScreen').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Showing your live preview');
});
