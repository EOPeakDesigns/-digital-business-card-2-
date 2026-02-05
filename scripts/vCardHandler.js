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
    // Absolute path avoids issues when the page is opened from a nested URL.
    this.vcfPath = '/assets/emma-wilson.vcf';
    // Fallback ensures the feature works even if the server serves .vcf incorrectly.
    this.vcfFallback = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Wilson;Emma;;;',
      'FN:Emma Wilson',
      'TITLE:Photographer',
      'TEL;TYPE=CELL,VOICE:+1-555-123-4567',
      'EMAIL;TYPE=INTERNET:ewilson@gmail.com',
      'URL:https://www.emmawilson.com',
      'ADR;TYPE=WORK:;;123 Main Street;New York;NY;10001;USA',
      'NOTE:Digital business card contact',
      'END:VCARD'
    ].join('\r\n') + '\r\n';
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
    this.openVCard();
  }

  /**
   * Fetch the vCard (validate content), then open it as a Blob URL.
   * This avoids "empty file" issues caused by dev servers / MIME quirks / caching layers.
   */
  async openVCard() {
    this.announce('Opening contact card.');

    const vcardText = await this.getVCardText();
    const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // iOS often ignores `download` and opens the file (good: it triggers import UI).
    // Desktop typically downloads it.
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Emma-Wilson.vcf';
    link.target = '_blank';
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async getVCardText() {
    try {
      const res = await fetch(this.vcfPath, { cache: 'no-store' });
      const text = await res.text();

      // Basic validation: ensures we didn't get an HTML error page or empty response.
      const trimmed = (text || '').trim();
      const looksLikeVCard =
        res.ok &&
        trimmed.includes('BEGIN:VCARD') &&
        trimmed.includes('END:VCARD') &&
        trimmed.length > 20;

      if (looksLikeVCard) return text;
    } catch (err) {
      // Swallow and fallback below
      console.warn('Failed to fetch vCard, using fallback:', err);
    }

    return this.vcfFallback;
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


