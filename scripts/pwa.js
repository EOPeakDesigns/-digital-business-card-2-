/**
 * PWA bootstrap with automatic update checking
 * Registers the service worker and checks for updates on every page load.
 * Ensures users always get the latest version without hard reload.
 *
 * Strategy:
 * - Checks for service worker updates on every page load
 * - Automatically updates when new version is available
 * - Forces cache refresh when service worker updates
 * - Works with normal reload (Ctrl+R), hard reload (Ctrl+Shift+R), and new visits
 */

(() => {
  if (!('serviceWorker' in navigator)) return;

  let registration = null;

  /**
   * Register service worker and set up update checking
   */
  async function registerServiceWorker() {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { 
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      // Check for updates immediately
      await checkForUpdates();

      // Listen for service worker updates
      registration.addEventListener('updatefound', handleUpdateFound);

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Check for updates periodically (every 60 seconds)
      setInterval(checkForUpdates, 60000);

      // Check for updates when page becomes visible (user returns to tab)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdates();
        }
      });

    } catch (err) {
      // Silent fail: PWA should never block the business card UX
      console.warn('Service worker registration failed:', err);
    }
  }

  /**
   * Check for service worker updates
   */
  async function checkForUpdates() {
    if (!registration) return;

    try {
      await registration.update();
    } catch (err) {
      console.warn('Service worker update check failed:', err);
    }
  }

  /**
   * Handle when a new service worker is found
   */
  function handleUpdateFound() {
    const newWorker = registration.installing;
    
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        // New service worker installed
        if (navigator.serviceWorker.controller) {
          // There's an active service worker, so this is an update
          // Force reload to activate new service worker
          console.log('New service worker installed, reloading...');
          window.location.reload();
        } else {
          // First time installation
          console.log('Service worker installed for the first time');
        }
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  function handleServiceWorkerMessage(event) {
    if (event.data && event.data.type === 'SW_UPDATED') {
      // Service worker has updated, reload to get fresh content
      console.log('Service worker updated, reloading...');
      window.location.reload();
    }
  }

  // Register service worker when page loads
  window.addEventListener('load', registerServiceWorker);

  // Also register immediately if DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerServiceWorker();
  }
})();


