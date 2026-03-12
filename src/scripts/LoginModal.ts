// src/scripts/LoginModal.ts

class LoginModal {
  private overlay: HTMLElement | null;
  private modal: HTMLElement | null;
  private closeBtn: HTMLElement | null;
  private togglePasswordBtn: HTMLElement | null;
  private passwordInput: HTMLInputElement | null;
  private form: HTMLFormElement | null;
  private forgotView: HTMLElement | null;
  private forgotLink: HTMLElement | null;
  private backToLoginBtn: HTMLElement | null;
  private forgotForm: HTMLFormElement | null;

  constructor() {
    this.overlay = document.getElementById('login-modal-overlay');
    this.modal = this.overlay?.querySelector('.login-modal') ?? null;
    this.closeBtn = document.getElementById('login-modal-close');
    this.togglePasswordBtn = document.getElementById('toggle-password');
    this.passwordInput = document.getElementById('login-password') as HTMLInputElement | null;
    this.form = document.getElementById('login-modal-form') as HTMLFormElement | null;
    this.forgotView = document.getElementById('forgot-password-view');
    this.forgotLink = document.getElementById('forgot-password-link');
    this.backToLoginBtn = document.getElementById('back-to-login');
    this.forgotForm = document.getElementById('forgot-password-form') as HTMLFormElement | null;

    if (this.overlay) {
      // Remove inline display:none (FOUC guard) so CSS transitions work
      this.overlay.style.removeProperty('display');
      this.init();
    }
  }

  private init() {
    // Open triggers – desktop login button
    const loginBtn = document.querySelector('.header__btn--login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.open());
    }

    // Open triggers – mobile user icon
    const userBtn = document.querySelector('.header__user-btn');
    if (userBtn) {
      userBtn.addEventListener('click', () => this.open());
    }

    // Open triggers – kebab menu login link
    const kebabLogin = document.querySelector('.header__kebab-item[href="#"]');
    if (kebabLogin) {
      // Only target the one with "Login" text
      const kebabItems = document.querySelectorAll('.header__kebab-item');
      kebabItems.forEach(item => {
        if (item.textContent?.trim() === 'Login') {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            this.open();
          });
        }
      });
    }

    // Close triggers
    this.closeBtn?.addEventListener('click', () => this.close());

    this.overlay!.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay!.classList.contains('is-open')) {
        this.close();
      }
    });

    // Toggle password visibility
    this.togglePasswordBtn?.addEventListener('click', () => this.togglePassword());

    // Prevent form submission (no login logic)
    this.form?.addEventListener('submit', (e) => e.preventDefault());

    // Forgot password view
    this.forgotLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showForgot();
    });

    this.backToLoginBtn?.addEventListener('click', () => this.showLogin());

    this.forgotForm?.addEventListener('submit', (e) => e.preventDefault());
  }

  open() {
    this.overlay!.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Focus first input
    const emailInput = document.getElementById('login-email') as HTMLInputElement | null;
    setTimeout(() => emailInput?.focus(), 300);
  }

  close() {
    this.overlay!.classList.remove('is-open');
    document.body.style.overflow = '';
    // Reset to login view on close
    this.showLogin();
  }

  private showForgot() {
    this.modal?.classList.add('show-forgot');
    this.forgotView?.classList.add('is-active');
    const forgotEmail = document.getElementById('forgot-email') as HTMLInputElement | null;
    setTimeout(() => forgotEmail?.focus(), 100);
  }

  private showLogin() {
    this.modal?.classList.remove('show-forgot');
    this.forgotView?.classList.remove('is-active');
  }

  private togglePassword() {
    if (!this.passwordInput || !this.togglePasswordBtn) return;

    const icon = this.togglePasswordBtn.querySelector('.material-symbols-outlined');
    if (this.passwordInput.type === 'password') {
      this.passwordInput.type = 'text';
      if (icon) icon.textContent = 'visibility';
    } else {
      this.passwordInput.type = 'password';
      if (icon) icon.textContent = 'visibility_off';
    }
  }
}

export const initLoginModal = () => {
  new LoginModal();
};
