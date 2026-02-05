/**
 * Social Deep Links
 * Attempts to open social profiles in native apps on mobile, with safe web fallback.
 *
 * Why:
 * - Universal links (https) often open apps, but not always—especially with new tabs.
 * - Custom schemes can open apps directly when installed.
 *
 * Strategy:
 * - On mobile, intercept clicks on `.social-link`
 * - Attempt app deep link first (user gesture)
 * - Fallback to the normal https URL if the app isn't installed / blocked
 *
 * Notes:
 * - Some platforms behave differently across iOS/Android.
 * - We keep web URLs as the source of truth, and only enhance on mobile.
 */

(() => {
  const isMobile = () => {
    // Prefer pointer/hover heuristics over UA sniffing.
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    return Boolean(hasCoarsePointer || noHover);
  };

  const getUsernameFromUrl = (url) => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] || '';
    } catch {
      return '';
    }
  };

  const buildDeepLink = (platform, webUrl) => {
    const username = getUsernameFromUrl(webUrl);

    switch (platform) {
      case 'instagram':
        // instagram://user?username=<username>
        return username ? `instagram://user?username=${encodeURIComponent(username)}` : null;
      case 'twitter':
        // twitter://user?screen_name=<username>
        return username ? `twitter://user?screen_name=${encodeURIComponent(username)}` : null;
      case 'linkedin':
        // linkedin://in/<username>
        return username ? `linkedin://in/${encodeURIComponent(username)}` : null;
      case 'facebook':
        // "facewebmodal" opens in FB app if installed (when supported)
        // Otherwise, web fallback will run.
        return `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
      default:
        return null;
    }
  };

  const openWithFallback = (appUrl, webUrl) => {
    let didHide = false;
    const onHide = () => {
      didHide = true;
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisibility, true);
      window.removeEventListener('pagehide', onHide, true);
      window.removeEventListener('blur', onHide, true);
    };
    const onVisibility = () => {
      if (document.hidden) onHide();
    };

    // If the app opens, the page will typically be backgrounded/hidden.
    document.addEventListener('visibilitychange', onVisibility, true);
    window.addEventListener('pagehide', onHide, true);
    window.addEventListener('blur', onHide, true);

    // Attempt app deep link (must be within user gesture in many browsers)
    window.location.href = appUrl;

    // Fallback to web if we didn't leave the page quickly
    window.setTimeout(() => {
      cleanup();
      if (!didHide) window.location.href = webUrl;
    }, 800);
  };

  const onClick = (e) => {
    const link = e.target?.closest?.('.social-link');
    if (!link) return;
    if (!isMobile()) return; // On desktop, keep default behavior (web in browser).

    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    if (!webUrl || !platform) return;

    const appUrl = buildDeepLink(platform, webUrl);
    if (!appUrl) return;

    e.preventDefault();
    openWithFallback(appUrl, webUrl);
  };

  document.addEventListener('click', onClick, true);
})();


