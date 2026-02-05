/**
 * QR Code Handler Component
 * Manages QR code functionality for the business card
 * 
 * Features:
 * - QR code button click handling
 * - Placeholder for future QR code generation
 * - Accessibility support
 */

class QRCodeHandler {
  constructor() {
    this.qrCodeButton = document.getElementById('qr-code');
    this.qrModal = document.getElementById('qr-modal');
    this.qrModalClose = document.querySelector('.qr-modal-close');
    this.qrModalOverlay = document.querySelector('.qr-modal-overlay');
    this.qrDownloadBtn = document.getElementById('qr-download-btn');
    this.appCard = document.getElementById('app-card');
    this.lastFocusedElement = null;
    this.focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    this.init();
  }

  /**
   * Initialize QR code functionality
   */
  init() {
    if (this.qrCodeButton) {
      this.qrCodeButton.addEventListener('click', (e) => this.handleQRCodeClick(e));
    }
    
    if (this.qrModalClose) {
      this.qrModalClose.addEventListener('click', (e) => this.closeModal(e));
    }
    
    if (this.qrModalOverlay) {
      this.qrModalOverlay.addEventListener('click', (e) => this.closeModal(e));
    }
    
    if (this.qrDownloadBtn) {
      this.qrDownloadBtn.addEventListener('click', (e) => this.handleDownloadClick(e));
      // Add touch event handlers to ensure button returns to default state on touch devices
      this.initQRDownloadButtonTouchHandlers();
    }
    
    // Global key handler (Escape + focus trap when modal is active)
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Handle console panel interactions to prevent unwanted focus states
    this.initConsoleInteractionHandlers();
  }

  /**
   * Handle QR code button click
   * @param {Event} e - Click event
   */
  handleQRCodeClick(e) {
    e.preventDefault();
    this.showQRModal();
  }

  /**
   * Show QR code modal
   */
  showQRModal() {
    if (this.qrModal) {
      // Store focus to restore on close
      this.lastFocusedElement = document.activeElement;

      this.qrModal.classList.add('active');
      this.qrModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling

      // Hide background content from assistive tech while modal is open
      if (this.appCard) {
        this.appCard.setAttribute('aria-hidden', 'true');
      }

      // Move focus into the modal (close button is a safe first target)
      window.setTimeout(() => {
        if (this.qrModalClose) this.qrModalClose.focus();
      }, 0);
    }
  }

  /**
   * Close QR code modal
   * @param {Event} e - Click event
   */
  closeModal(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (this.qrModal) {
      // Clear focus from modal close button to prevent aria-hidden warning
      if (this.qrModalClose && document.activeElement === this.qrModalClose) {
        this.qrModalClose.blur();
      }
      
      // Clear focus from QR button to prevent persistent hover effect
      if (this.qrCodeButton && document.activeElement === this.qrCodeButton) {
        this.qrCodeButton.blur();
      }
      
      // Clear focus from QR download button and reset to default state
      if (this.qrDownloadBtn) {
        this.resetQRDownloadButtonState();
      }
      
      this.qrModal.classList.remove('active');
      this.qrModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore scrolling

      // Restore background accessibility
      if (this.appCard) {
        this.appCard.removeAttribute('aria-hidden');
      }

      // Restore focus to whatever triggered the modal (or QR button fallback)
      const restoreTarget = this.lastFocusedElement || this.qrCodeButton;
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        window.setTimeout(() => restoreTarget.focus(), 0);
      }

      // UX polish: if the pointer is still over the QR button (common when user clicks
      // QR then presses Escape), the button can appear "hovered" immediately after close.
      // We suppress hover effects until the pointer actually leaves the button.
      if (restoreTarget === this.qrCodeButton && this.qrCodeButton) {
        this.suppressHoverUntilPointerLeaves(this.qrCodeButton);
      }
    }
  }

  /**
   * Handle keyboard events
   * @param {Event} e - Keyboard event
   */
  handleKeydown(e) {
    if (!this.qrModal || !this.qrModal.classList.contains('active')) return;

    // Escape closes the modal
    if (e.key === 'Escape') {
      this.closeModal(e);
      return;
    }

    // Trap focus within the modal when using Tab/Shift+Tab
    if (e.key === 'Tab') {
      this.trapFocus(e);
    }
  }

  /**
   * Keep keyboard focus inside the modal while it's open.
   * @param {KeyboardEvent} e
   */
  trapFocus(e) {
    if (!this.qrModal) return;

    const focusables = Array.from(this.qrModal.querySelectorAll(this.focusableSelector))
      // Filter out elements that are not visible (defensive)
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // If Shift+Tab on first, loop to last
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    // If Tab on last, loop to first
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Temporarily disable hover styling on an element until the next mouse move.
   * Prevents "hover flash" after closing overlays/modals with the pointer resting
   * on the trigger element.
   * @param {HTMLElement} el
   */
  suppressHoverUntilPointerLeaves(el) {
    if (!el || !el.classList) return;
    el.classList.add('suppress-hover');

    const clear = () => el.classList.remove('suppress-hover');

    // Clear only once the pointer leaves the trigger. This guarantees the
    // element won't look hovered while the cursor is resting on it.
    el.addEventListener('pointerleave', clear, { once: true });
    // Fallback for older browsers/environments
    el.addEventListener('mouseleave', clear, { once: true });
  }

  /**
   * Handle download button click
   * @param {Event} e - Click event
   */
  handleDownloadClick(e) {
    e.preventDefault();
    this.downloadQRCode();
  }

  /**
   * Reset QR download button to default state
   * Forces black background and white text using inline styles to override any hover state
   */
  resetQRDownloadButtonState() {
    if (!this.qrDownloadBtn) return;
    
    // Blur to remove focus state
    this.qrDownloadBtn.blur();
    
    // Explicitly set inline styles to force default state (overrides CSS hover)
    this.qrDownloadBtn.style.backgroundColor = '#000000';
    this.qrDownloadBtn.style.color = '#ffffff';
    this.qrDownloadBtn.style.transform = 'none';
    this.qrDownloadBtn.style.boxShadow = 'none';
  }

  /**
   * Download QR code image
   */
  downloadQRCode() {
    // Store original text outside try-catch for proper scope
    const originalText = this.qrDownloadBtn.innerHTML;
    
    // Immediately reset button to default state (removes hover/focus state on touch devices)
    this.resetQRDownloadButtonState();
    
    try {
      // Show loading state
      this.qrDownloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading...';
      this.qrDownloadBtn.disabled = true;
      // Maintain default black background even when disabled
      this.resetQRDownloadButtonState();

      // Create download link directly (no CORS issues)
      const link = document.createElement('a');
      link.href = 'assets/MYQR.png';
      link.download = 'Emma-Wilson-QR-Code.png';
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success state briefly
      this.qrDownloadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Downloaded!';
      setTimeout(() => {
        this.qrDownloadBtn.innerHTML = originalText;
        this.qrDownloadBtn.disabled = false;
        // Force button to return to default state after timeout
        this.resetQRDownloadButtonState();
      }, 2000);

    } catch (error) {
      console.error('Download failed:', error);
      
      // Show error state
      this.qrDownloadBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Error';
      setTimeout(() => {
        this.qrDownloadBtn.innerHTML = originalText;
        this.qrDownloadBtn.disabled = false;
        // Force button to return to default state after timeout
        this.resetQRDownloadButtonState();
      }, 2000);
    }
  }
  
  /**
   * Initialize touch event handlers for QR download button
   * Ensures button returns to default state on touch devices
   */
  initQRDownloadButtonTouchHandlers() {
    if (!this.qrDownloadBtn) return;
    
    // Handle touchstart - clear any existing focus and reset state
    this.qrDownloadBtn.addEventListener('touchstart', (e) => {
      // Reset to default state immediately on touch
      this.resetQRDownloadButtonState();
    }, { passive: true });
    
    // Handle touchend - ensure button returns to default state
    this.qrDownloadBtn.addEventListener('touchend', (e) => {
      // Reset to default state after touch interaction
      setTimeout(() => {
        this.resetQRDownloadButtonState();
      }, 100);
    }, { passive: true });
    
    // Handle touchcancel - ensure button returns to default state
    this.qrDownloadBtn.addEventListener('touchcancel', (e) => {
      this.resetQRDownloadButtonState();
    }, { passive: true });
    
    // Handle click - ensure button returns to default state after click
    this.qrDownloadBtn.addEventListener('click', (e) => {
      // Reset to default state after click interaction
      setTimeout(() => {
        this.resetQRDownloadButtonState();
      }, 100);
    });
  }

  /**
   * Initialize console interaction handlers to prevent unwanted focus states
   */
  initConsoleInteractionHandlers() {
    const getActionableEl = (target) => {
      if (!target || typeof target.closest !== 'function') return null;
      return target.closest('.contact-button, .contact-primary, .contact-action, .social-icon');
    };

    const blurActionable = (target) => {
      const actionable = getActionableEl(target);
      if (!actionable) return;

      // Blur the actionable element (if focusable) and any focused element inside the row.
      if (typeof actionable.blur === 'function') actionable.blur();

      const row = actionable.closest('.contact-button, .contact-item');
      if (row && typeof row.querySelectorAll === 'function') {
        row.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])').forEach((el) => {
          if (document.activeElement === el && typeof el.blur === 'function') el.blur();
        });
      }
    };

    // Handle visibility change (console open/close)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible (console closed), remove focus from all buttons
        this.clearAllButtonFocus();
      }
    });

    // Handle window focus events
    window.addEventListener('focus', () => {
      // Small delay to ensure console is fully closed or user returned from new tab
      setTimeout(() => {
        this.clearAllButtonFocus();
      }, 100);
    });

    // Handle mouse events to ensure proper hover behavior (desktop)
    document.addEventListener('mouseover', (e) => {
      // Clear any existing focus when hovering over actionable UI
      blurActionable(e.target);
    });

    // Handle touch events for mobile focus clearing (no visual feedback)
    document.addEventListener('touchstart', (e) => {
      blurActionable(e.target);
    });

    document.addEventListener('touchend', (e) => {
      // Clear focus after touch interaction completes
      setTimeout(() => blurActionable(e.target), 100);
    });

    document.addEventListener('touchcancel', (e) => {
      blurActionable(e.target);
    });

    // Handle click events to clear focus after interaction (mobile and desktop)
    document.addEventListener('click', (e) => {
      // For keyboard-activated clicks (Enter/Space), keep focus for accessibility.
      if (typeof e.detail === 'number' && e.detail === 0) return;

      // Clear focus after click interaction with multiple attempts (covers sticky focus)
      setTimeout(() => blurActionable(e.target), 50);
      setTimeout(() => blurActionable(e.target), 200);
    });

    // Additional mobile-specific focus clearing
    document.addEventListener('touchcancel', (e) => {
      blurActionable(e.target);
    });
  }

  /**
   * Clear focus from all contact buttons
   */
  clearContactButtonFocus() {
    const focusables = document.querySelectorAll('.contact-button, .contact-primary, .contact-action');
    focusables.forEach((el) => {
      if (document.activeElement === el && typeof el.blur === 'function') el.blur();
    });
  }

  /**
   * Clear focus from all buttons (contact and social)
   */
  clearAllButtonFocus() {
    // Clear contact buttons focus
    this.clearContactButtonFocus();
    
    // Clear social media buttons focus
    const socialButtons = document.querySelectorAll('.social-icon');
    socialButtons.forEach(button => {
      if (document.activeElement === button) {
        button.blur();
      }
    });
    
    // Clear QR button focus
    if (this.qrCodeButton && document.activeElement === this.qrCodeButton) {
      this.qrCodeButton.blur();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new QRCodeHandler();
});
