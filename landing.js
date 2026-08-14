// Biofolio Landing Page - 100% Passwordless Email OTP Authentication
import { 
  checkUsernameAvailability, 
  sendEmailOtp,
  verifyEmailOtp,
  getCurrentUser, 
  getCurrentProfile 
} from './supabase.js';

// DOM Selectors
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// State
let checkTimeout = null;
let currentAuthMode = 'signup'; // 'signup' | 'login'
let pendingEmail = '';
let resendTimerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSessionCheck();
  initHeroHandleChecker();
  initHeroThemeSwitcher();
  initOtpAuthSystem();
});

// 1. Session Check & Header State
async function initSessionCheck() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const profile = await getCurrentProfile();
      const authNav = $('#authNavButtons');
      const displayName = profile?.display_name || user.email.split('@')[0];
      
      if (authNav) {
        authNav.innerHTML = `
          <a href="builder.html" class="btn-ghost">Studio</a>
          <a href="builder.html" class="btn-primary">
            <span>Go to Studio</span>
            <span>→</span>
          </a>
        `;
      }

      const bottomCta = $('#bottomCtaBtn');
      if (bottomCta) {
        bottomCta.textContent = 'Go to your Studio →';
        bottomCta.addEventListener('click', () => {
          window.location.href = 'builder.html';
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
    openOtpModal('signup', cleanVal);
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

// 4. 100% Passwordless Email OTP Authentication System
function initOtpAuthSystem() {
  const modal = $('#otpAuthModal');
  const closeBtn = $('#otpClose');
  const toggleModeBtn = $('#otpToggleModeBtn');
  const changeEmailBtn = $('#otpChangeEmailBtn');
  const resendBtn = $('#otpResendBtn');

  // Nav buttons
  $('#loginNavBtn')?.addEventListener('click', () => openOtpModal('login'));
  $('#signupNavBtn')?.addEventListener('click', () => openOtpModal('signup'));
  $('#bottomCtaBtn')?.addEventListener('click', () => {
    const heroInput = $('#heroHandleInput');
    const handle = heroInput ? heroInput.value.trim() : '';
    openOtpModal('signup', handle);
  });

  // Close modal
  closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  // Toggle Signup / Login Mode
  toggleModeBtn?.addEventListener('click', () => {
    openOtpModal(currentAuthMode === 'signup' ? 'login' : 'signup');
  });

  // Change email in verify step
  changeEmailBtn?.addEventListener('click', () => {
    $('#otpStepVerify').style.display = 'none';
    $('#otpStepRequest').style.display = 'block';
  });

  // Resend OTP code
  resendBtn?.addEventListener('click', async () => {
    if (resendBtn.disabled || !pendingEmail) return;
    try {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';
      await sendEmailOtp({ email: pendingEmail });
      showToast('A new 6-digit code has been sent!');
      startResendCountdown();
    } catch (err) {
      showToast(`Resend failed: ${err.message}`);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  });

  // STEP 1: Request OTP Form
  const requestForm = $('#otpRequestForm');
  requestForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = $('#otpRequestError');
    const submitBtn = $('#otpRequestSubmitBtn');
    errorBox.classList.remove('show');

    const email = $('#otpEmail').value.trim();
    const name = $('#otpName').value.trim();
    const rawUsername = $('#otpUsername').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (!email) return;

    if (currentAuthMode === 'signup' && rawUsername) {
      if (rawUsername.length < 3) {
        showError(errorBox, 'Username must be at least 3 characters.');
        return;
      }

      // Check handle availability
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Checking handle...</span>';
      try {
        const check = await checkUsernameAvailability(rawUsername);
        if (!check.available) {
          throw new Error(check.error || 'Username is already taken. Please pick another.');
        }
      } catch (err) {
        showError(errorBox, err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send 6-Digit Code</span> <span class="arrow">→</span>';
        return;
      }
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending magic code...</span>';

      await sendEmailOtp({
        email,
        username: currentAuthMode === 'signup' ? rawUsername : undefined,
        displayName: currentAuthMode === 'signup' ? name : undefined
      });

      pendingEmail = email;
      $('#otpTargetEmail').textContent = email;

      // Switch to Step 2
      $('#otpStepRequest').style.display = 'none';
      $('#otpStepVerify').style.display = 'block';
      clearOtpDigits();
      startResendCountdown();

      // Focus first box
      const firstDigit = $('.otp-digit', $('#otpVerifyForm'));
      if (firstDigit) firstDigit.focus();

      showToast(`6-digit code sent to ${email}`);
    } catch (err) {
      showError(errorBox, err.message || 'Could not send verification code. Please check your email.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send 6-Digit Code</span> <span class="arrow">→</span>';
    }
  });

  // STEP 2: OTP Digit Inputs & Form Submit
  initOtpDigitInputs();

  const verifyForm = $('#otpVerifyForm');
  verifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleOtpVerification();
  });
}

function openOtpModal(mode = 'signup', prefilledHandle = '') {
  currentAuthMode = mode;
  const modal = $('#otpAuthModal');
  const eyebrow = $('#otpModalEyebrow');
  const title = $('#otpModalTitle');
  const sub = $('#otpModalSub');
  const nameField = $('#otpNameField');
  const usernameField = $('#otpUsernameField');
  const togglePrompt = $('#otpTogglePrompt');
  const toggleBtn = $('#otpToggleModeBtn');
  const usernameInput = $('#otpUsername');
  const submitBtn = $('#otpRequestSubmitBtn');

  // Reset to Step 1
  $('#otpStepRequest').style.display = 'block';
  $('#otpStepVerify').style.display = 'none';
  $('#otpRequestError').classList.remove('show');
  $('#otpVerifyError').classList.remove('show');

  if (mode === 'signup') {
    eyebrow.textContent = 'CREATE ACCOUNT';
    title.textContent = 'Start your Biofolio';
    sub.textContent = 'Enter your email to receive a secure 6-digit login code. No passwords required.';
    nameField.style.display = 'flex';
    usernameField.style.display = 'flex';
    togglePrompt.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Sign In with OTP';
    submitBtn.innerHTML = '<span>Send 6-Digit Code</span> <span class="arrow">→</span>';

    if (prefilledHandle) {
      usernameInput.value = prefilledHandle;
    }
  } else {
    eyebrow.textContent = 'WELCOME BACK';
    title.textContent = 'Sign In to Biofolio';
    sub.textContent = 'Enter your email and we’ll send you a 6-digit magic code to access your studio.';
    nameField.style.display = 'none';
    usernameField.style.display = 'none';
    togglePrompt.textContent = 'Don’t have an account?';
    toggleBtn.textContent = 'Create one free';
    submitBtn.innerHTML = '<span>Send 6-Digit Code</span> <span class="arrow">→</span>';
  }

  modal.classList.add('show');
  const firstInput = mode === 'signup' ? ($('#otpName') || $('#otpEmail')) : $('#otpEmail');
  if (firstInput) firstInput.focus();
}

function initOtpDigitInputs() {
  const digits = $$('.otp-digit');
  
  digits.forEach((input, idx) => {
    // Input handling
    input.addEventListener('input', (e) => {
      const val = input.value.replace(/[^0-9]/g, '');
      input.value = val ? val[0] : '';
      input.classList.toggle('filled', !!input.value);

      if (val && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }

      // If all filled, auto-submit
      const fullCode = digits.map(d => d.value).join('');
      if (fullCode.length === 6) {
        handleOtpVerification();
      }
    });

    // Keydown (Backspace navigation)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        digits[idx - 1].focus();
      }
    });

    // Paste handling (paste entire 6-digit code)
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (!pasted) return;

      const chars = pasted.split('').slice(0, 6);
      chars.forEach((char, i) => {
        if (digits[i]) {
          digits[i].value = char;
          digits[i].classList.add('filled');
        }
      });

      if (chars.length < 6) {
        digits[chars.length].focus();
      } else {
        digits[5].focus();
        handleOtpVerification();
      }
    });
  });
}

function clearOtpDigits() {
  $$('.otp-digit').forEach(d => {
    d.value = '';
    d.classList.remove('filled');
  });
}

async function handleOtpVerification() {
  const digits = $$('.otp-digit');
  const token = digits.map(d => d.value).join('');
  const errorBox = $('#otpVerifyError');
  const submitBtn = $('#otpVerifySubmitBtn');
  errorBox.classList.remove('show');

  if (token.length < 6) {
    showError(errorBox, 'Please enter all 6 digits of the code.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying code...</span>';

    await verifyEmailOtp({
      email: pendingEmail,
      token: token
    });

    showToast('Authenticated! Launching your Creator Studio...');
    
    setTimeout(() => {
      window.location.href = 'builder.html';
    }, 600);
  } catch (err) {
    showError(errorBox, err.message || 'Invalid or expired code. Please try again.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Verify &amp; Launch Studio</span> <span class="arrow">→</span>';
  }
}

function startResendCountdown() {
  const resendBtn = $('#otpResendBtn');
  if (!resendBtn) return;

  clearInterval(resendTimerInterval);
  let seconds = 30;
  resendBtn.disabled = true;
  resendBtn.textContent = `Resend in (${seconds}s)`;

  resendTimerInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(resendTimerInterval);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    } else {
      resendBtn.textContent = `Resend in (${seconds}s)`;
    }
  }, 1000);
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
