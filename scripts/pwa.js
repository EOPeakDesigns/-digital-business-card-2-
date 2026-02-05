/**
 * PWA bootstrap
 * Registers the service worker to enable offline support and installability.
 *
 * Note: We keep this in a separate file to avoid coupling with other features.
 */

(() => {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      // Silent fail: PWA should never block the business card UX.
      console.warn('Service worker registration failed:', err);
    }
  });
})();


