/**
 * Social Deep Links & Email App Links
 * Attempts to open social profiles and email in native apps on mobile, with safe web fallback.
 *
 * Why:
 * - Universal links (https) often open apps, but not always—especially with new tabs.
 * - Custom schemes can open apps directly when installed.
 *
 * Strategy:
 * - On mobile, intercept clicks on `.social-link` and `.email-link`
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

  const buildIOSDeepLink = (platform, webUrl, link) => {
    const username = getUsernameFromUrl(webUrl);

    switch (platform) {
      case 'instagram':
        // instagram://user?username=<username> (most reliable on iOS)
        return username ? `instagram://user?username=${encodeURIComponent(username)}` : null;
      case 'twitter':
        // twitter://user?screen_name=<username> (most reliable on iOS)
        return username ? `twitter://user?screen_name=${encodeURIComponent(username)}` : null;
      case 'linkedin':
        // linkedin://in/<username> (most reliable on iOS)
        return username ? `linkedin://in/${encodeURIComponent(username)}` : null;
      case 'facebook':
        // fb://profile/<username> or fb://page/<pageid> - try profile first
        if (username) {
          // Try profile scheme first (more reliable than facewebmodal)
          return `fb://profile/${encodeURIComponent(username)}`;
        }
        // Fallback to facewebmodal if no username extracted
        return `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
      case 'email':
        // Gmail app on iOS: googlegmail://co?to=<email>&subject=<subject>&body=<body>
        const emailIOS = link?.getAttribute?.('data-email') || '';
        const nameIOS = link?.getAttribute?.('data-name') || '';
        if (!emailIOS) return null;
        
        // Pre-fill compose with greeting and business card context
        const subjectIOS = 'Contact from Digital Business Card';
        const bodyIOS = `Hello ${nameIOS || 'there'},\n\n`;
        
        return `googlegmail://co?to=${encodeURIComponent(emailIOS)}&subject=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`;
      default:
        return null;
    }
  };

  const buildAndroidDeepLink = (platform, webUrl, link) => {
    const username = getUsernameFromUrl(webUrl);
    const fallback = encodeURIComponent(webUrl);
    
    switch (platform) {
      case 'instagram':
        // Try direct scheme first (more reliable), then intent:// as fallback
        if (username) {
          // Direct scheme: instagram://user?username=<username>
          return `instagram://user?username=${encodeURIComponent(username)}`;
        }
        return null;
      case 'twitter':
        // Try direct scheme first
        if (username) {
          return `twitter://user?screen_name=${encodeURIComponent(username)}`;
        }
        return null;
      case 'linkedin':
        // Try direct scheme first
        if (username) {
          return `linkedin://in/${encodeURIComponent(username)}`;
        }
        return null;
      case 'facebook':
        // Try direct scheme first
        if (username) {
          return `fb://profile/${encodeURIComponent(username)}`;
        }
        // Fallback to intent:// if no username
        return `intent://www.facebook.com/${encodeURIComponent(username || '')}#Intent;package=com.facebook.katana;scheme=https;S.browser_fallback_url=${fallback};end`;
      case 'email':
        // Gmail app on Android: use direct googlegmail:// scheme with pre-filled compose
        const emailAndroid = link?.getAttribute?.('data-email') || '';
        const nameAndroid = link?.getAttribute?.('data-name') || '';
        if (!emailAndroid) return null;
        
        // Pre-fill compose with greeting and business card context
        const subjectAndroid = 'Contact from Digital Business Card';
        const bodyAndroid = `Hello ${nameAndroid || 'there'},\n\n`;
        
        return `googlegmail://co?to=${encodeURIComponent(emailAndroid)}&subject=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
      default:
        return null;
    }
  };

  const openWithFallback = (appUrl, webUrl) => {
    let didHide = false;
    let fallbackTimer = null;
    
    const onHide = () => {
      didHide = true;
      cleanup();
    };
    
    const cleanup = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      document.removeEventListener('visibilitychange', onVisibility, true);
      window.removeEventListener('pagehide', onHide, true);
      window.removeEventListener('blur', onHide, true);
    };
    
    const onVisibility = () => {
      if (document.hidden) {
        onHide();
      }
    };

    // If the app opens, the page will typically be backgrounded/hidden.
    document.addEventListener('visibilitychange', onVisibility, true);
    window.addEventListener('pagehide', onHide, true);
    window.addEventListener('blur', onHide, true);

    // Attempt app deep link (must be within user gesture in many browsers)
    // Use iframe trick for Android to avoid navigation issues
    if (isAndroid() && appUrl.startsWith('googlegmail://')) {
      // For Gmail on Android, use iframe method for better reliability
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      
      // Remove iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } else {
      // For other apps/platforms, use direct navigation
      window.location.href = appUrl;
    }

    // Fallback to web if we didn't leave the page - wait longer to give apps time to open
    // iOS apps typically open faster, Android can take longer
    fallbackTimer = window.setTimeout(() => {
      cleanup();
      if (!didHide) {
        // Only fallback if page is still visible (app didn't open)
        window.location.href = webUrl;
      }
    }, isIOS() ? 1500 : 2000); // Increased wait time: 1.5s iOS, 2s Android
  };

  const onClick = (e) => {
    // Support both social links and email links
    const link = e.target?.closest?.('.social-link, .email-link');
    if (!link) return;
    if (!isMobile()) return; // On desktop, keep default behavior (web in browser).

    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    if (!webUrl || !platform) return;

    // Platform-targeted deep links for best success rate:
    // - Android: direct schemes (googlegmail://, instagram://, etc.) work reliably
    // - iOS Safari: custom schemes work well
    // - Both: fallback to web URL if app not installed
    let appUrl = null;
    if (isAndroid()) {
      appUrl = buildAndroidDeepLink(platform, webUrl, link);
    } else if (isIOS()) {
      appUrl = buildIOSDeepLink(platform, webUrl, link);
    }
    if (!appUrl) return; // If we can't build a reliable app URL, let normal navigation happen.

    e.preventDefault();
    openWithFallback(appUrl, webUrl);
  };

  document.addEventListener('click', onClick, true);
})();


