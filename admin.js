// Biofolio Admin Portal Controller
import {
  signInUser,
  signOutUser,
  getCurrentUser,
  getCurrentProfile,
  getAdminStats,
  getAdminUsers,
  toggleUserSuspension,
  deleteUserAccount,
  getAdminPortfolios,
  togglePortfolioPublish,
  deletePortfolio,
  getAdminReports,
  updateReportStatus
} from './supabase.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// State
let allUsers = [];
let allPortfolios = [];
let allReports = [];
let pendingDestructiveAction = null;

document.addEventListener('DOMContentLoaded', async () => {
  initAdminAuth();
  setupTabs();
  setupFilters();
  setupDestructiveModal();
  $('#refreshDataBtn')?.addEventListener('click', loadAllAdminData);
  $('#adminLogoutBtn')?.addEventListener('click', handleLogout);
});

// 1. Admin Authentication & Gating
async function initAdminAuth() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const profile = await getCurrentProfile();
      if (profile && profile.role === 'admin') {
        grantAdminAccess(profile);
        return;
      }
    }
  } catch (err) {
    console.warn('Auth check error:', err);
  }

  // Show login screen
  $('#adminAuthScreen').style.display = 'flex';
  $('#adminShell').style.display = 'none';

  let adminOtpMode = false;
  let adminPendingEmail = '';

  const loginForm = $('#adminLoginForm');
  const otpVerifyForm = $('#adminOtpVerifyForm');
  const toggleBtn = $('#adminToggleOtpBtn');
  const authSub = $('#adminAuthSub');
  const passField = $('#adminPasswordField');
  const submitBtn = $('#adminLoginBtn');

  toggleBtn?.addEventListener('click', () => {
    adminOtpMode = !adminOtpMode;
    toggleBtn.textContent = adminOtpMode ? 'Use Password Sign In 🔑' : 'Use Email OTP Code ✉';
    passField.style.display = adminOtpMode ? 'none' : 'flex';
    submitBtn.innerHTML = adminOtpMode ? '<span>Send Admin OTP Code</span> <span class="arrow">→</span>' : '<span>Authenticate Admin</span> <span class="arrow">→</span>';
    authSub.textContent = adminOtpMode ? 'Enter your admin email to receive a 6-digit verification code.' : 'Sign in with an authorized administrator account.';
    $('#adminAuthError').classList.remove('show');
    $('#adminOtpError').classList.remove('show');
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#adminEmail').value.trim();
    const password = $('#adminPassword').value;
    const errorBox = $('#adminAuthError');

    errorBox.classList.remove('show');

    if (adminOtpMode) {
      // Send OTP code to admin email
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending magic code...</span>';
        await window.BiofolioSupabase.sendEmailOtp({ email });
        
        adminPendingEmail = email;
        loginForm.style.display = 'none';
        otpVerifyForm.style.display = 'flex';
        authSub.textContent = `Enter the 6-digit code sent to ${email}`;
        
        const firstDigit = $('.admin-otp-digit', otpVerifyForm);
        if (firstDigit) firstDigit.focus();
      } catch (err) {
        errorBox.textContent = err.message || 'Failed to send admin OTP.';
        errorBox.classList.add('show');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Admin OTP Code</span> <span class="arrow">→</span>';
      }
      return;
    }

    // Password login
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying credentials...</span>';

      await signInUser({ email, password });
      const profile = await getCurrentProfile();

      if (profile && profile.role === 'admin') {
        grantAdminAccess(profile);
      } else {
        throw new Error('Access denied. This account does not have administrator privileges.');
      }
    } catch (err) {
      errorBox.textContent = err.message || 'Authentication failed.';
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Authenticate Admin</span> <span class="arrow">→</span>';
    }
  });

  // Admin OTP digit auto-navigation
  const adminDigits = $$('.admin-otp-digit');
  adminDigits.forEach((digit, idx) => {
    digit.addEventListener('input', () => {
      const val = digit.value.replace(/[^0-9]/g, '');
      digit.value = val ? val[0] : '';
      if (val && idx < adminDigits.length - 1) adminDigits[idx + 1].focus();
      const code = adminDigits.map(d => d.value).join('');
      if (code.length === 6) verifyAdminOtp(code);
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !digit.value && idx > 0) {
        adminDigits[idx - 1].focus();
      }
    });

    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (!pasted) return;
      pasted.split('').slice(0, 6).forEach((c, i) => {
        if (adminDigits[i]) adminDigits[i].value = c;
      });
      const code = adminDigits.map(d => d.value).join('');
      if (code.length === 6) verifyAdminOtp(code);
    });
  });

  async function verifyAdminOtp(token) {
    const errorBox = $('#adminOtpError');
    const otpBtn = $('#adminOtpVerifyBtn');
    errorBox.classList.remove('show');

    try {
      otpBtn.disabled = true;
      otpBtn.innerHTML = '<span>Verifying OTP...</span>';
      await window.BiofolioSupabase.verifyEmailOtp({ email: adminPendingEmail, token });
      const profile = await getCurrentProfile();
      if (profile && profile.role === 'admin') {
        grantAdminAccess(profile);
      } else {
        throw new Error('Access denied. This account is not an administrator.');
      }
    } catch (err) {
      errorBox.textContent = err.message || 'Invalid verification code.';
      errorBox.classList.add('show');
      otpBtn.disabled = false;
      otpBtn.innerHTML = '<span>Verify OTP &amp; Enter Portal</span> <span class="arrow">→</span>';
    }
  }

  otpVerifyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = adminDigits.map(d => d.value).join('');
    if (token.length < 6) {
      $('#adminOtpError').textContent = 'Please enter all 6 digits.';
      $('#adminOtpError').classList.add('show');
      return;
    }
    verifyAdminOtp(token);
  });
}

function grantAdminAccess(profile) {
  $('#adminAuthScreen').style.display = 'none';
  $('#adminShell').style.display = 'flex';
  $('#adminProfileName').textContent = profile.display_name;
  $('#adminProfileEmail').textContent = `@${profile.username}`;
  loadAllAdminData();
}

async function handleLogout() {
  await signOutUser();
  window.location.reload();
}

// 2. Load All Data
async function loadAllAdminData() {
  showToast('Refreshing system data...');
  try {
    const [stats, users, portfolios, reports] = await Promise.all([
      getAdminStats(),
      getAdminUsers(),
      getAdminPortfolios(),
      getAdminReports()
    ]);

    allUsers = users || [];
    allPortfolios = portfolios || [];
    allReports = reports || [];

    renderStats(stats);
    renderRecentUsers();
    renderOverviewReports();
    renderUsersTable();
    renderPortfoliosTable();
    renderReportsTable();
  } catch (err) {
    console.error('Failed to load admin data:', err);
    showToast('Error loading live data from cloud.');
  }
}

// 3. Render Stats & Overview
function renderStats(stats) {
  $('#statTotalUsers').textContent = (stats.users || allUsers.length).toLocaleString();
  $('#statTotalPortfolios').textContent = (stats.portfolios || allPortfolios.length).toLocaleString();
  $('#statTotalViews').textContent = (stats.views || 0).toLocaleString();
  
  const pendingCount = allReports.filter(r => r.status === 'pending').length;
  $('#statPendingReports').textContent = pendingCount;
  $('#sidebarReportBadge').textContent = pendingCount;
  $('#sidebarReportBadge').style.display = pendingCount > 0 ? 'inline-block' : 'none';
}

function renderRecentUsers() {
  const tbody = $('#recentUsersTable tbody');
  if (!tbody) return;

  const recent = allUsers.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center muted">No users registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(u => `
    <tr>
      <td><strong>${escapeHtml(u.display_name)}</strong></td>
      <td><code>@${escapeHtml(u.username)}</code></td>
      <td><span class="badge-role ${u.role}">${u.role}</span></td>
      <td class="muted">${formatDate(u.created_at)}</td>
    </tr>
  `).join('');
}

function renderOverviewReports() {
  const feed = $('#overviewReportsList');
  if (!feed) return;

  const pending = allReports.filter(r => r.status === 'pending').slice(0, 4);
  if (pending.length === 0) {
    feed.innerHTML = '<p class="empty-msg">No pending content flags. Everything is clean!</p>';
    return;
  }

  feed.innerHTML = pending.map(r => `
    <div class="report-card-item">
      <strong>Portfolio: ${escapeHtml(r.portfolio?.slug || 'Unknown')}</strong>
      <p>${escapeHtml(r.reason)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="badge-status pending">Pending</span>
        <button class="btn-action-sm" onclick="window.__adminSwitchToReports()">Review →</button>
      </div>
    </div>
  `).join('');
}

// 4. Users Table & Actions
function renderUsersTable() {
  const tbody = $('#usersTableBody');
  if (!tbody) return;

  const search = $('#userSearchInput')?.value.toLowerCase().trim() || '';
  const roleFilter = $('#userRoleFilter')?.value || 'all';
  const statusFilter = $('#userStatusFilter')?.value || 'all';

  const filtered = allUsers.filter(u => {
    const matchSearch = u.display_name.toLowerCase().includes(search) || u.username.toLowerCase().includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'suspended' ? u.is_suspended : !u.is_suspended);
    return matchSearch && matchRole && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">No matching users found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <strong>${escapeHtml(u.display_name)}</strong>
        <div class="muted" style="font-size:0.8rem;">${escapeHtml(u.headline || 'No title')}</div>
      </td>
      <td><code>@${escapeHtml(u.username)}</code></td>
      <td><span class="badge-role ${u.role}">${u.role}</span></td>
      <td>
        <span class="badge-status ${u.is_suspended ? 'suspended' : 'active'}">
          ${u.is_suspended ? 'Suspended' : 'Active'}
        </span>
      </td>
      <td class="muted">${formatDate(u.created_at)}</td>
      <td>
        <div class="table-actions">
          <a href="portfolio.html?u=${u.username}" target="_blank" class="btn-action-sm" title="View live portfolio">View ↗</a>
          <button class="btn-action-sm" data-action="toggle-suspend" data-id="${u.id}" data-suspended="${u.is_suspended}">
            ${u.is_suspended ? 'Unsuspend' : 'Suspend'}
          </button>
          <button class="btn-action-sm btn-danger" data-action="delete-user" data-id="${u.id}" data-name="${escapeHtml(u.username)}">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  attachUserActionListeners();
}

function attachUserActionListeners() {
  $$('[data-action="toggle-suspend"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.id;
      const isSuspended = btn.dataset.suspended === 'true';
      const newStatus = !isSuspended;

      try {
        btn.disabled = true;
        await toggleUserSuspension(userId, newStatus);
        showToast(newStatus ? 'User suspended' : 'User unsuspended');
        loadAllAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  $$('[data-action="delete-user"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.id;
      const username = btn.dataset.name;

      openDestructiveModal({
        title: `Delete User @${username}`,
        description: `This will permanently remove @${username}'s account, portfolios, and associated data. This action cannot be undone.`,
        matchTarget: username,
        onConfirm: async () => {
          await deleteUserAccount(userId);
          showToast(`User @${username} deleted.`);
          loadAllAdminData();
        }
      });
    });
  });
}

// 5. Portfolios Table & Moderation Actions
function renderPortfoliosTable() {
  const tbody = $('#portfoliosTableBody');
  if (!tbody) return;

  const search = $('#portfolioSearchInput')?.value.toLowerCase().trim() || '';
  const statusFilter = $('#portfolioStatusFilter')?.value || 'all';

  const filtered = allPortfolios.filter(p => {
    const matchSearch = p.slug.toLowerCase().includes(search) || (p.title || '').toLowerCase().includes(search);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'published' ? p.is_published : !p.is_published);
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">No portfolios found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>
        <strong>biofolio.site/${escapeHtml(p.slug)}</strong>
        <div class="muted" style="font-size:0.8rem;">${escapeHtml(p.title || '')}</div>
      </td>
      <td>
        ${escapeHtml(p.profile?.display_name || 'Anonymous')}
        <div class="muted" style="font-size:0.8rem;">@${escapeHtml(p.profile?.username || '')}</div>
      </td>
      <td><code>${p.theme?.palette || 'cream'} / ${p.theme?.font || 'serif'}</code></td>
      <td>${(p.sections || []).length} sections</td>
      <td>
        <span class="badge-status ${p.is_published ? 'published' : 'draft'}">
          ${p.is_published ? 'Published' : 'Draft'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <a href="portfolio.html?u=${p.slug}" target="_blank" class="btn-action-sm">View ↗</a>
          <button class="btn-action-sm" data-action="toggle-publish" data-id="${p.id}" data-published="${p.is_published}">
            ${p.is_published ? 'Takedown' : 'Publish'}
          </button>
          <button class="btn-action-sm btn-danger" data-action="delete-portfolio" data-id="${p.id}" data-slug="${escapeHtml(p.slug)}">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  attachPortfolioActionListeners();
}

function attachPortfolioActionListeners() {
  $$('[data-action="toggle-publish"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const isPublished = btn.dataset.published === 'true';
      const newStatus = !isPublished;

      try {
        btn.disabled = true;
        await togglePortfolioPublish(id, newStatus);
        showToast(newStatus ? 'Portfolio published' : 'Portfolio taken down');
        loadAllAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  $$('[data-action="delete-portfolio"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const slug = btn.dataset.slug;

      openDestructiveModal({
        title: `Delete Portfolio /${slug}`,
        description: `This will permanently remove the portfolio page and all its content blocks.`,
        matchTarget: slug,
        onConfirm: async () => {
          await deletePortfolio(id);
          showToast(`Portfolio /${slug} deleted.`);
          loadAllAdminData();
        }
      });
    });
  });
}

// 6. Reports Moderation Table
function renderReportsTable() {
  const tbody = $('#reportsTableBody');
  if (!tbody) return;

  const statusFilter = $('#reportStatusFilter')?.value || 'all';
  const filtered = allReports.filter(r => {
    return statusFilter === 'all' || r.status === statusFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">No reports in this view.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <strong>biofolio.site/${escapeHtml(r.portfolio?.slug || 'deleted')}</strong>
        <div class="muted" style="font-size:0.8rem;">By @${escapeHtml(r.portfolio?.profile?.username || 'unknown')}</div>
      </td>
      <td>
        <div>${escapeHtml(r.reason)}</div>
        ${r.admin_notes ? `<small class="muted">Admin note: ${escapeHtml(r.admin_notes)}</small>` : ''}
      </td>
      <td class="muted">${escapeHtml(r.reported_by_email || 'Anonymous')}</td>
      <td><span class="badge-status ${r.status}">${r.status}</span></td>
      <td class="muted">${formatDate(r.created_at)}</td>
      <td>
        <div class="table-actions">
          ${r.portfolio ? `<a href="portfolio.html?u=${r.portfolio.slug}" target="_blank" class="btn-action-sm">Inspect ↗</a>` : ''}
          ${r.status === 'pending' ? `
            <button class="btn-action-sm" data-action="dismiss-report" data-id="${r.id}">Dismiss</button>
            <button class="btn-action-sm btn-danger" data-action="action-report" data-id="${r.id}" data-pid="${r.portfolio_id}">Takedown</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  attachReportActionListeners();
}

function attachReportActionListeners() {
  $$('[data-action="dismiss-report"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        await updateReportStatus(btn.dataset.id, 'dismissed', 'Dismissed by admin');
        showToast('Report marked as dismissed.');
        loadAllAdminData();
      } catch (err) {
        showToast(`Error: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  $$('[data-action="action-report"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        await updateReportStatus(btn.dataset.id, 'actioned', 'Portfolio taken down for policy violation');
        if (btn.dataset.pid) {
          await togglePortfolioPublish(btn.dataset.pid, false);
        }
        showToast('Report actioned and portfolio taken down.');
        loadAllAdminData();
      } catch (err) {
        showToast(`Error: ${err.message}`);
        btn.disabled = false;
      }
    });
  });
}

// 7. Navigation & Tabs
function setupTabs() {
  const tabs = $$('.admin-nav-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      $$('.admin-tab-pane').forEach(p => p.classList.remove('active'));
      $(`#tab-${target}`)?.classList.add('active');

      const titles = {
        overview: ['System Overview', 'Live metrics, user growth, and content health.'],
        users: ['User Management', 'Search, moderate, and manage creator accounts.'],
        portfolios: ['Portfolio Moderation', 'Review public portfolios and publication status.'],
        reports: ['Content Moderation Queue', 'Review reported content and enforce platform safety.']
      };

      if (titles[target]) {
        $('#currentTabHeading').textContent = titles[target][0];
        $('#currentTabSub').textContent = titles[target][1];
      }
    });
  });

  $('#viewAllUsersBtn')?.addEventListener('click', () => switchTab('users'));
  $('#viewAllReportsBtn')?.addEventListener('click', () => switchTab('reports'));
  window.__adminSwitchToReports = () => switchTab('reports');
}

function switchTab(name) {
  const targetBtn = $(`.admin-nav-item[data-tab="${name}"]`);
  if (targetBtn) targetBtn.click();
}

function setupFilters() {
  $('#userSearchInput')?.addEventListener('input', renderUsersTable);
  $('#userRoleFilter')?.addEventListener('change', renderUsersTable);
  $('#userStatusFilter')?.addEventListener('change', renderUsersTable);

  $('#portfolioSearchInput')?.addEventListener('input', renderPortfoliosTable);
  $('#portfolioStatusFilter')?.addEventListener('change', renderPortfoliosTable);

  $('#reportStatusFilter')?.addEventListener('change', renderReportsTable);
}

// 8. Destructive Confirmation Modal
function setupDestructiveModal() {
  const modal = $('#destructiveModal');
  const input = $('#destructiveInput');
  const confirmBtn = $('#confirmDestructiveBtn');
  const cancelBtn = $('#cancelDestructiveBtn');
  const closeBtn = $('#destructiveClose');

  input?.addEventListener('input', () => {
    if (!pendingDestructiveAction) return;
    const match = input.value.trim().toLowerCase() === pendingDestructiveAction.matchTarget.toLowerCase();
    confirmBtn.disabled = !match;
  });

  cancelBtn?.addEventListener('click', closeDestructiveModal);
  closeBtn?.addEventListener('click', closeDestructiveModal);

  confirmBtn?.addEventListener('click', async () => {
    if (!pendingDestructiveAction) return;
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';
      await pendingDestructiveAction.onConfirm();
      closeDestructiveModal();
    } catch (err) {
      showToast(`Action failed: ${err.message}`);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Permanently Delete';
    }
  });
}

function openDestructiveModal({ title, description, matchTarget, onConfirm }) {
  const modal = $('#destructiveModal');
  const titleEl = $('#destructiveTitle');
  const descEl = $('#destructiveDesc');
  const targetEl = $('#destructiveMatchTarget');
  const input = $('#destructiveInput');
  const confirmBtn = $('#confirmDestructiveBtn');

  pendingDestructiveAction = { matchTarget, onConfirm };

  titleEl.textContent = title;
  descEl.textContent = description;
  targetEl.textContent = matchTarget;
  input.value = '';
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Permanently Delete';

  modal.classList.add('show');
  input.focus();
}

function closeDestructiveModal() {
  const modal = $('#destructiveModal');
  modal.classList.remove('show');
  pendingDestructiveAction = null;
}

// Utility Helpers
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}
