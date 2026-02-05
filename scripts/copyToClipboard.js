/**
 * Copy to Clipboard Component
 * Handles copy functionality for contact information
 * 
 * Features:
 * - Copy phone numbers and email addresses to clipboard
 * - Toast notification feedback
 * - Error handling for clipboard API
 * - Accessibility support with ARIA labels
 */

class CopyToClipboard {
  constructor() {
    this.copyIcons = document.querySelectorAll('.copy-icon');
    this.a11yStatusEl = document.getElementById('a11y-status');
    this.init();
  }

  /**
   * Initialize copy functionality
   */
  init() {
    this.copyIcons.forEach(icon => {
      icon.addEventListener('click', (e) => this.handleCopyActivate(e));
      icon.addEventListener('keydown', (e) => this.handleCopyKeydown(e));
      
      // Add mobile touch event handlers for focus clearing (no visual feedback)
      icon.addEventListener('touchstart', (e) => {
        e.target.blur();
        const parentRow = e.target.closest('.contact-button, .contact-item, .contact-primary');
        if (parentRow) {
          parentRow.blur();
        }
      });
      
      icon.addEventListener('touchend', (e) => {
        // Clear focus
        setTimeout(() => {
          e.target.blur();
          const parentRow = e.target.closest('.contact-button, .contact-item, .contact-primary');
          if (parentRow) {
            parentRow.blur();
          }
        }, 100);
      });
      
      // Handle touch cancel
      icon.addEventListener('touchcancel', (e) => {
        e.target.blur();
        const parentRow = e.target.closest('.contact-button, .contact-item, .contact-primary');
        if (parentRow) {
          parentRow.blur();
        }
      });
    });
  }

  /**
   * Handle copy activation (click/tap)
   * @param {Event} e - Activation event
   */
  handleCopyActivate(e) {
    e.preventDefault();
    e.stopPropagation();
    const iconEl = e.currentTarget;
    const textToCopy = iconEl?.dataset?.copy;
    
    if (!textToCopy) {
      console.warn('No copy data found on element');
      this.announce('Nothing to copy.');
      return;
    }

    this.copyToClipboard(textToCopy, iconEl);
  }

  /**
   * Keyboard support for copy icons (Enter/Space)
   * @param {KeyboardEvent} e - Keydown event
   */
  handleCopyKeydown(e) {
    const key = e.key;
    if (key !== 'Enter' && key !== ' ') return;
    e.preventDefault();
    // Reuse the same activation handler for consistency
    this.handleCopyActivate(e);
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @param {HTMLElement} iconElement - The copy icon element
   */
  async copyToClipboard(text, iconElement) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCheckmark(iconElement);
      this.announce('Copied to clipboard.');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text, iconElement);
    }
  }

  /**
   * Fallback copy method for older browsers
   * @param {string} text - Text to copy
   * @param {HTMLElement} iconElement - The copy icon element
   */
  fallbackCopyToClipboard(text, iconElement) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCheckmark(iconElement);
      this.announce('Copied to clipboard.');
    } catch (err) {
      console.error('Fallback copy failed: ', err);
      this.announce('Copy failed.');
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Show checkmark indication on copy button
   * @param {HTMLElement} iconElement - The copy icon element
   */
  showCheckmark(iconElement) {
    if (!iconElement || !iconElement.classList.contains('copy-icon')) return;
    
    // Add copied class for visual indication
    iconElement.classList.add('copied');
    
    // Remove checkmark after 1.2 seconds for professional brief feedback
    setTimeout(() => {
      iconElement.classList.remove('copied');
    }, 1200);
  }

  /**
   * Announce a short, non-visual status message for screen readers.
   * Uses a single live region element to avoid any toast/notification UI.
   * @param {string} message
   */
  announce(message) {
    if (!this.a11yStatusEl) return;
    // Clear first so repeated messages are re-announced by some screen readers.
    this.a11yStatusEl.textContent = '';
    window.setTimeout(() => {
      this.a11yStatusEl.textContent = message;
    }, 10);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CopyToClipboard();
});
