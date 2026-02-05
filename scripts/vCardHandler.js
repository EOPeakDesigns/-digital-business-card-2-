/**
 * vCard Handler Component
 * Provides an "Add to Contacts" action by downloading a .vcf file.
 *
 * Notes:
 * - On mobile, opening/downloading a .vcf typically prompts "Add to Contacts".
 * - On desktop, it downloads the file for the user to open/import.
 * - Uses the existing non-visual aria-live region (#a11y-status) for announcements.
 */

class VCardHandler {
  constructor() {
    this.addToContactsBtn = document.getElementById('add-to-contacts');
    this.a11yStatusEl = document.getElementById('a11y-status');
    this.vcfPath = 'assets/emma-wilson.vcf';
    this.init();
  }

  init() {
    if (!this.addToContactsBtn) return;
    this.addToContactsBtn.addEventListener('click', (e) => this.handleAddToContacts(e));
    this.addToContactsBtn.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleKeydown(e) {
    const key = e.key;
    if (key !== 'Enter' && key !== ' ') return;
    e.preventDefault();
    this.handleAddToContacts(e);
  }

  handleAddToContacts(e) {
    e.preventDefault();

    // Announce intent for assistive tech; keep UX silent visually.
    this.announce('Opening contact card.');

    /**
     * Important UX detail:
     * - For best mobile behavior, we avoid forcing `download`.
     * - Navigating to the .vcf allows iOS/Android to show the native "Add to Contacts"
     *   flow (or a preview with an "Add" action), depending on device/browser.
     */
    window.location.assign(this.vcfPath);
  }

  announce(message) {
    if (!this.a11yStatusEl) return;
    this.a11yStatusEl.textContent = '';
    window.setTimeout(() => {
      this.a11yStatusEl.textContent = message;
    }, 10);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new VCardHandler();
});


