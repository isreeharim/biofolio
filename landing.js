// Biofolio Landing Page Logic
import { 
  checkUsernameAvailability, 
  signUpUser, 
  signInUser, 
  resetPasswordForEmail, 
  getCurrentUser, 
  getCurrentProfile 
} from './supabase.js';

// DOM Selectors
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// State
let checkTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSessionCheck();
  initHeroHandleChecker();
  initHeroThemeSwitcher();
  initAuthModals();
});

// 1. Session Check & Header State
async function initSessionCheck() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const profile = await getCurrentProfile();
      const authNav = $('#authNavButtons');
      const displayName = profile?.display_name || user.email.split('@')[0];
      
      authNav.innerHTML = `
        <a href="index.html" class="btn-ghost">Studio</a>
        <a href="index.html" class="btn-primary">
          <span>Go to Studio</span>
          <span>→</span>
        </a>
      `;

      const bottomCta = $('#bottomCtaBtn');
      if (bottomCta) {
        bottomCta.textContent = 'Go to your Studio →';
        bottomCta.addEventListener('click', () => {
          window.location.href = 'index.html';
        });
      }
    }
  } catch (err) {
    console.warn('Session check error:', err);
  }
}

// 2. Hero Handle Claiming & Real-Time Availability
function initHeroHandleChecker() {
  const handleInput = $('#heroHandleInput');
  const claimForm = $('#heroClaimForm');
  const statusIcon = $('#handleStatusIcon');
  const feedback = $('#handleFeedback');

  if (!handleInput) return;

  handleInput.addEventListener('input', () => {
    const rawVal = handleInput.value.trim();
    const cleanVal = rawVal.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (handleInput.value !== cleanVal) {
      handleInput.value = cleanVal;
    }

    clearTimeout(checkTimeout);
    
    if (!cleanVal) {
      statusIcon.textContent = '';
      statusIcon.className = 'handle-status-icon';
      feedback.textContent = 'Pick your unique Biofolio address. Free forever.';
      feedback.className = 'handle-feedback';
      return;
    }

    if (cleanVal.length < 3) {
      statusIcon.textContent = '⚠️';
      statusIcon.className = 'handle-status-icon';
      feedback.textContent = 'Username must be at least 3 characters.';
      feedback.className = 'handle-feedback';
      return;
    }

    statusIcon.textContent = '⏳';
    feedback.textContent = 'Checking availability...';

    checkTimeout = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(cleanVal);
        if (res.available) {
          statusIcon.textContent = '✓';
          statusIcon.className = 'handle-status-icon available';
          feedback.textContent = `🎉 biofolio.site/${cleanVal} is available!`;
          feedback.className = 'handle-feedback status-available';
        } else {
          statusIcon.textContent = '✕';
          statusIcon.className = 'handle-status-icon taken';
          feedback.textContent = res.error === 'Reserved username' 
            ? `⚠️ biofolio.site/${cleanVal} is reserved.` 
            : `⚠️ biofolio.site/${cleanVal} is already taken. Try another name.`;
          feedback.className = 'handle-feedback status-taken';
        }
      } catch (err) {
        statusIcon.textContent = '';
        feedback.textContent = 'Could not verify username at the moment.';
      }
    }, 350);
  });

  claimForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cleanVal = handleInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanVal) return;

    // Prefill username in signup modal and open it
    const suUsername = $('#suUsername');
    if (suUsername) {
      suUsername.value = cleanVal;
    }
    openModal('signupModal');
  });
}

// 3. Hero Interactive Live Theme Switcher
function initHeroThemeSwitcher() {
  const switchers = $$('#heroThemeSwitchers .swatch-btn');
  const screen = $('#heroPhoneScreen');
  if (!screen) return;

  switchers.forEach(btn => {
    btn.addEventListener('click', () => {
      switchers.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const theme = btn.dataset.theme;
      screen.classList.remove('theme-cream', 'theme-lavender', 'theme-ink', 'theme-mint');
      screen.classList.add(`theme-${theme}`);
    });
  });
}

// 4. Modal Management & Auth Form Submissions
function initAuthModals() {
  // Triggers
  $('#loginNavBtn')?.addEventListener('click', () => openModal('loginModal'));
  $('#signupNavBtn')?.addEventListener('click', () => openModal('signupModal'));
  $('#bottomCtaBtn')?.addEventListener('click', () => {
    const heroInput = $('#heroHandleInput');
    if (heroInput && heroInput.value.trim()) {
      $('#suUsername').value = heroInput.value.trim();
    }
    openModal('signupModal');
  });

  // Switchers
  $('#switchToLogin')?.addEventListener('click', () => {
    closeModal('signupModal');
    openModal('loginModal');
  });

  $('#switchToSignup')?.addEventListener('click', () => {
    closeModal('loginModal');
    openModal('signupModal');
  });

  $('#forgotPasswordBtn')?.addEventListener('click', () => {
    closeModal('loginModal');
    openModal('forgotModal');
  });

  $('#forgotBackToLogin')?.addEventListener('click', () => {
    closeModal('forgotModal');
    openModal('loginModal');
  });

  // Close buttons
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) modal.classList.remove('show');
    });
  });

  $$('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('show');
    });
  });

  // Sign Up Form Submit
  const signupForm = $('#signupForm');
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = $('#signupError');
    const submitBtn = $('#signupSubmitBtn');
    errorBox.classList.remove('show');

    const displayName = $('#suDisplayName').value.trim();
    const username = $('#suUsername').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const email = $('#suEmail').value.trim();
    const password = $('#suPassword').value;

    if (!username || username.length < 3) {
      showError(errorBox, 'Username must be at least 3 characters.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating your portfolio...</span>';

      // Check availability first
      const check = await checkUsernameAvailability(username);
      if (!check.available) {
        throw new Error(check.error || 'Username is already taken. Please pick another.');
      }

      await signUpUser({ email, password, username, displayName });
      showToast('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (err) {
      showError(errorBox, err.message || 'Failed to sign up. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create my portfolio</span> <span class="arrow">→</span>';
    }
  });

  // Login Form Submit
  const loginForm = $('#loginForm');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = $('#loginError');
    const submitBtn = $('#loginSubmitBtn');
    errorBox.classList.remove('show');

    const email = $('#liEmail').value.trim();
    const password = $('#liPassword').value;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Signing in...</span>';

      await signInUser({ email, password });
      showToast('Signed in successfully! Redirecting...');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } catch (err) {
      showError(errorBox, err.message || 'Invalid email or password.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign in to Studio</span> <span class="arrow">→</span>';
    }
  });

  // Forgot Password Form Submit
  const forgotForm = $('#forgotForm');
  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = $('#forgotError');
    const successBox = $('#forgotSuccess');
    const submitBtn = $('#forgotSubmitBtn');
    errorBox.classList.remove('show');
    successBox.classList.remove('show');

    const email = $('#fpEmail').value.trim();

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending link...</span>';

      await resetPasswordForEmail(email);
      successBox.textContent = `Password reset email sent to ${email}. Check your inbox!`;
      successBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send reset link</span> <span class="arrow">→</span>';
    } catch (err) {
      showError(errorBox, err.message || 'Failed to send reset link.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send reset link</span> <span class="arrow">→</span>';
    }
  });
}

function openModal(id) {
  const modal = $(`#${id}`);
  if (modal) modal.classList.add('show');
}

function closeModal(id) {
  const modal = $(`#${id}`);
  if (modal) modal.classList.remove('show');
}

function showError(box, msg) {
  if (!box) return;
  box.textContent = msg;
  box.classList.add('show');
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
