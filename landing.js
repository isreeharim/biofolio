// Biofolio Landing Page Controller
// Sign Up: 100% Email OTP Verification
// Sign In: Fast Email & Password
import { 
  checkUsernameAvailability, 
  sendEmailOtp,
  verifyEmailOtp,
  signInUser,
  resetPasswordForEmail,
  getCurrentUser, 
  getCurrentProfile,
  supabaseClient
} from './supabase.js';

// DOM Selectors
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// State
let checkTimeout = null;
let pendingSignup = {
  name: '',
  username: '',
  email: '',
  password: ''
};
let resendTimerInterval = null;

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
    openSignupModal(cleanVal);
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

// 4. Modal Management & Form Submissions
function initAuthModals() {
  // Nav buttons
  $('#loginNavBtn')?.addEventListener('click', openLoginModal);
  $('#signupNavBtn')?.addEventListener('click', () => openSignupModal());
  $('#bottomCtaBtn')?.addEventListener('click', () => {
    const heroInput = $('#heroHandleInput');
    const handle = heroInput ? heroInput.value.trim() : '';
    openSignupModal(handle);
  });

  // Switchers between modals
  $('#switchToLogin')?.addEventListener('click', () => {
    closeModal('signupModal');
    openLoginModal();
  });

  $('#switchToSignup')?.addEventListener('click', () => {
    closeModal('loginModal');
    openSignupModal();
  });

  $('#forgotPasswordBtn')?.addEventListener('click', () => {
    closeModal('loginModal');
    openModal('forgotModal');
  });

  $('#forgotBackToLogin')?.addEventListener('click', () => {
    closeModal('forgotModal');
    openLoginModal();
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

  // ================= SIGN UP FLOW (OTP) =================
  const signupReqForm = $('#signupRequestForm');
  signupReqForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = $('#signupRequestError');
    const submitBtn = $('#signupRequestBtn');
    errorBox.classList.remove('show');

    const name = $('#suDisplayName').value.trim();
    const rawUsername = $('#suUsername').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const email = $('#suEmail').value.trim();
    const password = $('#suPassword').value;

    if (rawUsername.length < 3) {
      showError(errorBox, 'Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      showError(errorBox, 'Password must be at least 6 characters.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying handle...</span>';

      // 1. Check availability
      const check = await checkUsernameAvailability(rawUsername);
      if (!check.available) {
        throw new Error(check.error || 'Username is already taken. Please pick another.');
      }

      submitBtn.innerHTML = '<span>Sending 6-digit OTP...</span>';

      // 2. Send Email OTP
      await sendEmailOtp({
        email,
        username: rawUsername,
        displayName: name
      });

      // Save pending signup data
      pendingSignup = { name, username: rawUsername, email, password };
      $('#suTargetEmail').textContent = email;

      // Switch to Step 2 (Verify OTP)
      $('#suStepRequest').style.display = 'none';
      $('#suStepVerify').style.display = 'block';
      clearOtpDigits();
      startResendCountdown();

      const firstDigit = $('.su-otp-digit', $('#signupVerifyForm'));
      if (firstDigit) firstDigit.focus();

      showToast(`Verification code sent to ${email}`);
    } catch (err) {
      showError(errorBox, err.message || 'Could not send verification code.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send 6-Digit OTP Code</span> <span class="arrow">→</span>';
    }
  });

  $('#suChangeEmailBtn')?.addEventListener('click', () => {
    $('#suStepVerify').style.display = 'none';
    $('#suStepRequest').style.display = 'block';
  });

  $('#suResendBtn')?.addEventListener('click', async () => {
    const resendBtn = $('#suResendBtn');
    if (resendBtn.disabled || !pendingSignup.email) return;
    try {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';
      await sendEmailOtp({
        email: pendingSignup.email,
        username: pendingSignup.username,
        displayName: pendingSignup.name
      });
      showToast('A new 6-digit code has been sent!');
      startResendCountdown();
    } catch (err) {
      showToast(`Resend failed: ${err.message}`);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  });

  // OTP Digit Navigation & Submit
  initOtpDigitInputs();

  const signupVerifyForm = $('#signupVerifyForm');
  signupVerifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSignupOtpVerification();
  });

  // ================= SIGN IN FLOW (PASSWORD) =================
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
        window.location.href = 'builder.html';
      }, 600);
    } catch (err) {
      showError(errorBox, err.message || 'Invalid email or password.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In to Studio</span> <span class="arrow">→</span>';
    }
  });

  // ================= FORGOT PASSWORD =================
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
      successBox.textContent = `Password reset link sent to ${email}. Check your inbox!`;
      successBox.classList.add('show');
    } catch (err) {
      showError(errorBox, err.message || 'Failed to send password reset link.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send Reset Link</span> <span class="arrow">→</span>';
    }
  });
}

function openSignupModal(prefilledHandle = '') {
  $('#suStepRequest').style.display = 'block';
  $('#suStepVerify').style.display = 'none';
  $('#signupRequestError').classList.remove('show');
  $('#signupVerifyError').classList.remove('show');
  
  if (prefilledHandle) {
    $('#suUsername').value = prefilledHandle;
  }
  openModal('signupModal');
  $('#suDisplayName')?.focus();
}

function openLoginModal() {
  $('#loginError').classList.remove('show');
  openModal('loginModal');
  $('#liEmail')?.focus();
}

function initOtpDigitInputs() {
  const digits = $$('.su-otp-digit');
  
  digits.forEach((input, idx) => {
    input.addEventListener('input', () => {
      const val = input.value.replace(/[^0-9]/g, '');
      input.value = val ? val[0] : '';
      input.classList.toggle('filled', !!input.value);

      if (val && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }

      const fullCode = digits.map(d => d.value).join('');
      if (fullCode.length === 6) {
        handleSignupOtpVerification();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        digits[idx - 1].focus();
      }
    });

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
        handleSignupOtpVerification();
      }
    });
  });
}

function clearOtpDigits() {
  $$('.su-otp-digit').forEach(d => {
    d.value = '';
    d.classList.remove('filled');
  });
}

async function handleSignupOtpVerification() {
  const digits = $$('.su-otp-digit');
  const token = digits.map(d => d.value).join('');
  const errorBox = $('#signupVerifyError');
  const submitBtn = $('#signupVerifyBtn');
  errorBox.classList.remove('show');

  if (token.length < 6) {
    showError(errorBox, 'Please enter all 6 digits of the code.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying &amp; setting up...</span>';

    // 1. Verify OTP code
    await verifyEmailOtp({
      email: pendingSignup.email,
      token: token
    });

    // 2. Set password for future email+password sign-in
    if (pendingSignup.password && supabaseClient) {
      try {
        await supabaseClient.auth.updateUser({
          password: pendingSignup.password
        });
      } catch (pwErr) {
        console.warn('Password update note:', pwErr);
      }
    }

    showToast('Portfolio created! Launching your Creator Studio...');
    
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
  const resendBtn = $('#suResendBtn');
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
