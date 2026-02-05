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

  const isIOS = () => /iPad|iPhone|iPod/i.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = () => /Android/i.test(navigator.userAgent);

  const getUsernameFromUrl = (url) => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] || '';
    } catch {
      return '';
    }
  };

  const buildIOSDeepLink = (platform, webUrl) => {
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
        // "facewebmodal" opens in the Facebook app when supported.
        // If it fails, the fallback web URL will typically open the app via Universal Links
        // (when the Facebook app is installed) on iOS Safari.
        return `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
      default:
        return null;
    }
  };

  const buildAndroidIntent = (platform, webUrl) => {
    const username = getUsernameFromUrl(webUrl);
    const fallback = encodeURIComponent(webUrl);
    switch (platform) {
      case 'instagram':
        // Opens Instagram app profile if installed (Chrome Android supports intent://).
        return username
          ? `intent://instagram.com/_u/${encodeURIComponent(username)}#Intent;package=com.instagram.android;scheme=https;S.browser_fallback_url=${fallback};end`
          : null;
      case 'twitter':
        return username
          ? `intent://twitter.com/${encodeURIComponent(username)}#Intent;package=com.twitter.android;scheme=https;S.browser_fallback_url=${fallback};end`
          : null;
      case 'linkedin':
        return username
          ? `intent://www.linkedin.com/in/${encodeURIComponent(username)}#Intent;package=com.linkedin.android;scheme=https;S.browser_fallback_url=${fallback};end`
          : null;
      case 'facebook':
        return username
          ? `intent://www.facebook.com/${encodeURIComponent(username)}#Intent;package=com.facebook.katana;scheme=https;S.browser_fallback_url=${fallback};end`
          : null;
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
    }, isIOS() ? 700 : 900);
  };

  const onClick = (e) => {
    const link = e.target?.closest?.('.social-link');
    if (!link) return;
    if (!isMobile()) return; // On desktop, keep default behavior (web in browser).

    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    if (!webUrl || !platform) return;

    // Platform-targeted deep links for best success rate:
    // - Android Chrome: intent:// (best)
    // - iOS Safari: custom scheme (best-effort) + Universal Link fallback (https)
    let appUrl = null;
    if (isAndroid()) {
      appUrl = buildAndroidIntent(platform, webUrl);
    } else if (isIOS()) {
      appUrl = buildIOSDeepLink(platform, webUrl);
    }
    if (!appUrl) return; // If we can't build a reliable app URL, let normal navigation happen.

    e.preventDefault();
    openWithFallback(appUrl, webUrl);
  };

  document.addEventListener('click', onClick, true);
})();


