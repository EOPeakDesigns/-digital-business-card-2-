/**
 * Social Deep Links & Email App Links
 * Attempts to open social profiles and email in native apps on mobile/tablet, with smart web fallback.
 *
 * Strategy:
 * - Priority 1: Open native app (iOS/Android)
 * - Priority 2: Fallback to web browser if app not installed
 * - Works on smartphones, tablets, and desktop (with appropriate behavior)
 *
 * Notes:
 * - Uses Android Intent URLs for maximum reliability on Android
 * - Uses custom schemes for iOS (most reliable)
 * - Smart fallback detection with improved timing
 * - Supports tablets (detected as mobile devices)
 */

(() => {
  /**
   * Detect if device is mobile/tablet (touch device)
   * Includes tablets as they should use mobile app behavior
   */
  const isMobile = () => {
    // Prefer pointer/hover heuristics over UA sniffing
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    // Also check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return Boolean(hasCoarsePointer || noHover || hasTouch);
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
        if (username) {
          return `instagram://user?username=${encodeURIComponent(username)}`;
        }
        // Fallback: try to open profile page
        return `instagram://www.instagram.com/${encodeURIComponent(webUrl)}`;
      case 'twitter':
        // twitter://user?screen_name=<username> (most reliable on iOS)
        if (username) {
          return `twitter://user?screen_name=${encodeURIComponent(username)}`;
        }
        // Fallback: open tweet/user page
        return `twitter://status?id=${encodeURIComponent(webUrl)}`;
      case 'linkedin':
        // linkedin://in/<username> (most reliable on iOS)
        if (username) {
          return `linkedin://in/${encodeURIComponent(username)}`;
        }
        // Fallback: try profile URL
        return `linkedin://profile/view?id=${encodeURIComponent(webUrl)}`;
      case 'facebook':
        // fb://profile/<username> or fb://page/<pageid> - try profile first
        if (username) {
          // Try profile scheme first (most reliable)
          return `fb://profile/${encodeURIComponent(username)}`;
        }
        // Fallback to facewebmodal with full URL
        return `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
      case 'email':
        // Gmail app on iOS: googlegmail://co?to=<email>&subject=<subject>&body=<body>
        const emailIOS = link?.getAttribute?.('data-email') || '';
        const nameIOS = link?.getAttribute?.('data-name') || '';
        if (!emailIOS) return null;
        
        // Pre-fill compose with greeting and business card context
        const subjectIOS = 'Contact from Digital Business Card';
        const bodyIOS = `Hello ${nameIOS || 'there'},\n\n`;
        
        // Gmail app scheme for iOS
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
        // Use Android Intent URL for maximum reliability
        if (username) {
          // Intent URL with direct scheme fallback
          return `intent://instagram.com/user/${encodeURIComponent(username)}/#Intent;package=com.instagram.android;scheme=https;S.browser_fallback_url=${fallback};end`;
        }
        // Fallback to web URL if no username
        return null;
      case 'twitter':
        // Use Android Intent URL for Twitter/X
        if (username) {
          return `intent://twitter.com/${encodeURIComponent(username)}#Intent;package=com.twitter.android;scheme=https;S.browser_fallback_url=${fallback};end`;
        }
        return null;
      case 'linkedin':
        // Use Android Intent URL for LinkedIn
        if (username) {
          return `intent://linkedin.com/in/${encodeURIComponent(username)}#Intent;package=com.linkedin.android;scheme=https;S.browser_fallback_url=${fallback};end`;
        }
        return null;
      case 'facebook':
        // Use Android Intent URL for Facebook (most reliable)
        if (username) {
          return `intent://facebook.com/${encodeURIComponent(username)}#Intent;package=com.facebook.katana;scheme=https;S.browser_fallback_url=${fallback};end`;
        }
        // Fallback to web URL if no username
        return null;
      case 'email':
        // Gmail app on Android: use googlegmail:// scheme with pre-filled compose
        const emailAndroid = link?.getAttribute?.('data-email') || '';
        const nameAndroid = link?.getAttribute?.('data-name') || '';
        if (!emailAndroid) return null;
        
        // Pre-fill compose with greeting and business card context
        const subjectAndroid = 'Contact from Digital Business Card';
        const bodyAndroid = `Hello ${nameAndroid || 'there'},\n\n`;
        
        // Gmail app scheme for Android (googlegmail:// works better than intent:// for Gmail)
        return `googlegmail://co?to=${encodeURIComponent(emailAndroid)}&subject=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
      default:
        return null;
    }
  };

  /**
   * Open app with smart fallback to web
   * Uses multiple detection methods to determine if app opened successfully
   */
  const openWithFallback = (appUrl, webUrl) => {
    let didHide = false;
    let didBlur = false;
    let fallbackTimer = null;
    let visibilityTimer = null;
    
    const onHide = () => {
      didHide = true;
      cleanup();
    };
    
    const onBlur = () => {
      didBlur = true;
      // If page blurred, app likely opened - wait a bit then cleanup
      visibilityTimer = setTimeout(() => {
        cleanup();
      }, 500);
    };
    
    const cleanup = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
      }
      document.removeEventListener('visibilitychange', onVisibility, true);
      window.removeEventListener('pagehide', onHide, true);
      window.removeEventListener('blur', onBlur, true);
    };
    
    const onVisibility = () => {
      if (document.hidden) {
        didHide = true;
        cleanup();
      }
    };

    // Multiple detection methods for app opening
    document.addEventListener('visibilitychange', onVisibility, true);
    window.addEventListener('pagehide', onHide, true);
    window.addEventListener('blur', onBlur, true);

    // Attempt app deep link (must be within user gesture in many browsers)
    // Use iframe trick for Android Gmail and Intent URLs to avoid navigation issues
    if (isAndroid() && (appUrl.startsWith('googlegmail://') || appUrl.startsWith('intent://'))) {
      // For Android, use iframe method for better reliability (avoids page navigation)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      
      // Remove iframe after a delay
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      }, 1500);
    } else {
      // For iOS and other platforms, use direct navigation
      try {
        window.location.href = appUrl;
      } catch (e) {
        // If direct navigation fails, try creating a link and clicking it
        const link = document.createElement('a');
        link.href = appUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          try {
            document.body.removeChild(link);
          } catch (err) {
            // Ignore cleanup errors
          }
        }, 100);
      }
    }

    // Smart fallback timing: wait longer for Android (Intent URLs can be slower)
    // iOS apps typically open faster
    const fallbackDelay = isIOS() ? 1800 : 2500; // 1.8s iOS, 2.5s Android
    
    fallbackTimer = window.setTimeout(() => {
      cleanup();
      // Only fallback if page is still visible and didn't blur (app didn't open)
      if (!didHide && !didBlur && !document.hidden) {
        // App didn't open, fallback to web
        window.location.href = webUrl;
      }
    }, fallbackDelay);
  };

  /**
   * Handle click events on social links and email links
   * Priority: Native app > Web browser
   */
  const onClick = (e) => {
    // Support both social links and email links
    const link = e.target?.closest?.('.social-link, .email-link');
    if (!link) return;
    
    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    if (!webUrl || !platform) return;

    // For email: handle on mobile/tablet (try app first) and desktop (use web)
    if (platform === 'email') {
      if (isMobile()) {
        // On mobile/tablet: try Gmail app first, fallback to web
        let appUrl = null;
        if (isAndroid()) {
          appUrl = buildAndroidDeepLink(platform, webUrl, link);
        } else if (isIOS()) {
          appUrl = buildIOSDeepLink(platform, webUrl, link);
        }
        
        if (appUrl) {
          e.preventDefault();
          e.stopPropagation();
          openWithFallback(appUrl, webUrl);
          return;
        }
        // If no app URL could be built, let normal navigation happen (web URL with pre-filled fields)
      }
      // On desktop or if app URL couldn't be built: let normal navigation happen
      // The href already has pre-filled Gmail compose URL, so it will work correctly
      return;
    }

    // For social media: intercept on mobile/tablet (try app first), desktop uses web
    if (!isMobile()) {
      // On desktop, keep default behavior (web in browser)
      return;
    }

    // Build platform-specific deep link
    let appUrl = null;
    if (isAndroid()) {
      appUrl = buildAndroidDeepLink(platform, webUrl, link);
    } else if (isIOS()) {
      appUrl = buildIOSDeepLink(platform, webUrl, link);
    }
    
    if (!appUrl) {
      // If we can't build a reliable app URL, let normal navigation happen
      return;
    }

    // Prevent default navigation and try app first
    e.preventDefault();
    e.stopPropagation();
    openWithFallback(appUrl, webUrl);
  };

  document.addEventListener('click', onClick, true);
})();


