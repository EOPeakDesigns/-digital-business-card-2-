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
   * More accurate detection that doesn't false-positive on desktop with DevTools
   */
  const isMobile = () => {
    // First check: User Agent (most reliable for actual device type)
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Second check: Media queries (more reliable than touch detection)
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    
    // Third check: Screen size (mobile devices typically have smaller screens)
    // Only consider touch if screen is mobile-sized (prevents false positives from DevTools)
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouch = isSmallScreen && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Return true only if multiple indicators suggest mobile
    // This prevents false positives when DevTools emulation is active
    return Boolean(
      (isMobileUA && (hasCoarsePointer || noHover)) || 
      (hasCoarsePointer && noHover && hasTouch)
    );
  };

  /**
   * Detect if running on desktop browser (Windows, Mac, Linux)
   * Explicitly excludes mobile devices and tablets
   */
  const isDesktop = () => {
    const ua = navigator.userAgent || '';
    // Check for desktop OS indicators
    const isDesktopOS = /Windows|Macintosh|Linux|X11/i.test(ua);
    // Exclude mobile devices even if they have desktop-like UA
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    // Check if it's actually a desktop browser (not mobile browser in desktop mode)
    const isDesktopBrowser = isDesktopOS && !isMobileDevice && window.innerWidth > 768;
    return isDesktopBrowser;
  };

  const isIOS = () => /iPad|iPhone|iPod/i.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = () => {
    // Only return true if actually on Android device, not desktop browser
    const ua = navigator.userAgent || '';
    const androidUA = /Android/i.test(ua);
    // Additional check: ensure it's not a desktop browser with Android in UA
    const isDesktopBrowser = /Windows|Macintosh|Linux|X11/i.test(ua) && !/Mobile/i.test(ua);
    return androidUA && !isDesktopBrowser;
  };

  /**
   * Get app store URLs for each platform
   * Returns Play Store (Android) or App Store (iOS) URLs
   */
  const getAppStoreUrl = (platform) => {
    const storeUrls = {
      instagram: {
        android: 'https://play.google.com/store/apps/details?id=com.instagram.android',
        ios: 'https://apps.apple.com/app/instagram/id389801252'
      },
      facebook: {
        android: 'https://play.google.com/store/apps/details?id=com.facebook.katana',
        ios: 'https://apps.apple.com/app/facebook/id284882215'
      },
      twitter: {
        android: 'https://play.google.com/store/apps/details?id=com.twitter.android',
        ios: 'https://apps.apple.com/app/twitter/id333903271'
      },
      linkedin: {
        android: 'https://play.google.com/store/apps/details?id=com.linkedin.android',
        ios: 'https://apps.apple.com/app/linkedin/id288429040'
      },
      email: {
        android: 'https://play.google.com/store/apps/details?id=com.google.android.gm',
        ios: 'https://apps.apple.com/app/gmail-email-by-google/id422689480'
      }
    };

    if (!storeUrls[platform]) return null;
    
    if (isAndroid()) {
      return storeUrls[platform].android;
    } else if (isIOS()) {
      return storeUrls[platform].ios;
    }
    
    // Desktop: return Android Play Store (can be opened in browser)
    return storeUrls[platform].android;
  };

  /**
   * Get platform-specific app name for display
   */
  const getAppName = (platform) => {
    const names = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      twitter: 'X (Twitter)',
      linkedin: 'LinkedIn',
      email: 'Gmail'
    };
    return names[platform] || 'App';
  };

  /**
   * Show app download modal with store and web options
   */
  const showAppDownloadModal = (platform, webUrl) => {
    const modal = document.getElementById('app-download-modal');
    const modalClose = document.querySelector('.app-download-modal-close');
    const modalOverlay = document.querySelector('.app-download-modal-overlay');
    const storeBtn = document.getElementById('app-download-store-btn');
    const webBtn = document.getElementById('app-download-web-btn');
    const messageEl = document.getElementById('app-download-message');
    const storeTextEl = document.getElementById('app-download-store-text');
    const iconEl = document.getElementById('app-download-icon');
    
    if (!modal) return;

    const appName = getAppName(platform);
    const storeUrl = getAppStoreUrl(platform);
    
    // Update modal content
    messageEl.textContent = `${appName} is not installed on your device. Would you like to download it?`;
    
    // Set store button
    if (storeUrl) {
      storeBtn.href = storeUrl;
      storeBtn.style.display = 'inline-flex';
      if (isAndroid()) {
        storeTextEl.textContent = 'Download from Play Store';
        iconEl.className = 'fa-brands fa-google-play';
      } else if (isIOS()) {
        storeTextEl.textContent = 'Download from App Store';
        iconEl.className = 'fa-brands fa-app-store-ios';
      } else {
        storeTextEl.textContent = 'Download App';
        iconEl.className = 'fa-solid fa-download';
      }
    } else {
      storeBtn.style.display = 'none';
    }
    
    // Set web button
    webBtn.href = webUrl;
    
    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    setTimeout(() => {
      if (storeBtn && storeUrl) {
        storeBtn.focus();
      } else if (webBtn) {
        webBtn.focus();
      }
    }, 100);
    
    // Close handlers
    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    
    if (modalClose) {
      modalClose.onclick = closeModal;
    }
    
    if (modalOverlay) {
      modalOverlay.onclick = closeModal;
    }
    
    // Keyboard support (Escape key)
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Clean up on button click
    storeBtn.onclick = () => {
      setTimeout(closeModal, 100);
    };
    webBtn.onclick = () => {
      setTimeout(closeModal, 100);
    };
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

  const buildIOSDeepLink = (platform, webUrl, link) => {
    const username = getUsernameFromUrl(webUrl);

    switch (platform) {
      case 'instagram':
        // Works on both iOS and desktop (will fail gracefully on desktop)
        if (username) {
          return `instagram://user?username=${encodeURIComponent(username)}`;
        }
        return null;
      case 'twitter':
        if (username) {
          return `twitter://user?screen_name=${encodeURIComponent(username)}`;
        }
        return null;
      case 'linkedin':
        if (username) {
          return `linkedin://in/${encodeURIComponent(username)}`;
        }
        return null;
      case 'facebook':
        if (username) {
          return `fb://profile/${encodeURIComponent(username)}`;
        }
        return null;
      case 'email':
        // Gmail app on iOS: googlegmail://co?to=<email>&subject=<subject>&body=<body>
        const emailIOS = link?.getAttribute?.('data-email') || '';
        const nameIOS = link?.getAttribute?.('data-name') || '';
        if (!emailIOS) return null;
        
        // Pre-fill compose with greeting and business card context
        const subjectIOS = 'Contact from Digital Business Card';
        const bodyIOS = `Hello ${nameIOS || 'there'},\n\n`;
        
        // Build Gmail web URL for fallback
        const gmailWebUrlIOS = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailIOS)}&su=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`;
        const mailtoUrlIOS = `mailto:${encodeURIComponent(emailIOS)}?subject=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`;
        
        // Return object with primary (Gmail app), fallback (mailto), and web
        return {
          primary: `googlegmail://co?to=${encodeURIComponent(emailIOS)}&subject=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`,
          fallback: mailtoUrlIOS,
          web: gmailWebUrlIOS
        };
      default:
        return null;
    }
  };

  const buildAndroidDeepLink = (platform, webUrl, link) => {
    const username = getUsernameFromUrl(webUrl);
    
    // CRITICAL FIX: Use direct app schemes instead of Intent URLs
    // Intent URLs automatically redirect to browser_fallback_url, bypassing our modal
    // Direct schemes fail silently if app not installed, allowing us to show the modal
    // This gives us full control over the fallback experience
    
    switch (platform) {
      case 'instagram':
        if (username) {
          // Use direct scheme - works on Android and fails silently if app not installed
          return `instagram://user?username=${encodeURIComponent(username)}`;
        }
        return null;
      case 'twitter':
        if (username) {
          return `twitter://user?screen_name=${encodeURIComponent(username)}`;
        }
        return null;
      case 'linkedin':
        if (username) {
          return `linkedin://in/${encodeURIComponent(username)}`;
        }
        return null;
      case 'facebook':
        if (username) {
          return `fb://profile/${encodeURIComponent(username)}`;
        }
        return null;
      case 'email':
        // Gmail app on Android: try multiple methods for maximum reliability
        const emailAndroid = link?.getAttribute?.('data-email') || '';
        const nameAndroid = link?.getAttribute?.('data-name') || '';
        if (!emailAndroid) return null;
        
        // Pre-fill compose with greeting and business card context
        const subjectAndroid = 'Contact from Digital Business Card';
        const bodyAndroid = `Hello ${nameAndroid || 'there'},\n\n`;
        
        // Build Gmail compose URL for web fallback
        const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAndroid)}&su=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
        const gmailWebFallback = encodeURIComponent(gmailWebUrl);
        
        // Build mailto URL (works with any email app)
        const mailtoUrl = `mailto:${encodeURIComponent(emailAndroid)}?subject=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
        
        // Primary: Try googlegmail:// scheme first (most reliable for Gmail app)
        // Fallback 1: mailto: (opens default email app)
        // Fallback 2: Gmail web compose
        return {
          primary: `googlegmail://co?to=${encodeURIComponent(emailAndroid)}&subject=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`,
          fallback: mailtoUrl,
          web: gmailWebUrl
        };
      default:
        return null;
    }
  };

  /**
   * Open app with smart fallback to download modal or web
   * Uses multiple detection methods to determine if app opened successfully
   * Handles both simple URLs and complex objects (for email with multiple fallbacks)
   */
  const openWithFallback = (appUrl, webUrl, platform = null) => {
    // Handle email case where appUrl is an object with primary, fallback, and web
    let primaryUrl = appUrl;
    let fallbackUrl = null;
    let finalWebUrl = webUrl;
    
    if (typeof appUrl === 'object' && appUrl.primary) {
      primaryUrl = appUrl.primary;
      fallbackUrl = appUrl.fallback;
      finalWebUrl = appUrl.web || webUrl;
    }
    
    // Note: We no longer use Intent URLs to avoid automatic browser redirect
    // Direct app schemes are used instead, which fail silently if app not installed
    
    let didHide = false;
    let didBlur = false;
    let fallbackTimer = null;
    let visibilityTimer = null;
    let attemptCount = 0;
    const maxAttempts = 2; // Try primary, then fallback if available
    
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

    /**
     * Attempt to open URL (app or fallback)
     * Uses iframe method for app schemes to prevent page navigation
     * This allows us to detect if app opened without losing page control
     */
    const attemptOpen = (url) => {
      // For app schemes (instagram://, fb://, etc.), use iframe method
      // This prevents automatic page navigation and allows us to detect app opening
      if (url.includes('://') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        // App scheme detected - use iframe method (doesn't navigate page)
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        // Remove iframe after attempt
        setTimeout(() => {
          try {
            if (iframe.parentNode) {
              document.body.removeChild(iframe);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 1000);
      } else {
        // For http/https/mailto URLs, use standard navigation
        try {
          window.location.href = url;
        } catch (e) {
          // If direct navigation fails, try creating a link
          const link = document.createElement('a');
          link.href = url;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            try {
              if (link.parentNode) {
                document.body.removeChild(link);
              }
            } catch (err) {
              // Ignore cleanup errors
            }
          }, 100);
        }
      }
    };

    // Attempt to open primary URL (app)
    attemptOpen(primaryUrl);

    // Smart fallback timing: 
    // - Desktop: Very short timeout (apps won't open, fail fast)
    // - Mobile: Longer timeout to give apps time to open
    // - Increased timeout for better detection accuracy
    const fallbackDelay = isDesktop() ? 800 : (isIOS() ? 2500 : 3500);
    
    fallbackTimer = window.setTimeout(() => {
      cleanup();
      // Only fallback if page is still visible and didn't blur (app didn't open)
      if (!didHide && !didBlur && !document.hidden) {
        attemptCount++;
        
        // For email: try mailto: fallback first
        if (fallbackUrl && attemptCount === 1 && typeof appUrl === 'object' && appUrl.primary && appUrl.primary.includes('googlegmail://')) {
          // Try mailto: fallback (opens default email app)
          attemptOpen(fallbackUrl);
          
          // Set another timer for final web fallback or modal
          setTimeout(() => {
            if (!didHide && !didBlur && !document.hidden) {
              // Show download modal for email
              showAppDownloadModal('email', finalWebUrl);
            }
          }, 2000);
        } else {
          // For social media or if mailto failed: show download modal
          // Use passed platform parameter or extract from context
          const detectedPlatform = platform || getPlatformFromContext(webUrl, appUrl);
          if (detectedPlatform && isMobile()) {
            // On mobile: show download modal with app store options
            showAppDownloadModal(detectedPlatform, finalWebUrl);
          } else {
            // On desktop or no platform detected: go directly to web
            window.location.href = finalWebUrl;
          }
        }
      }
    }, fallbackDelay);
  };

  /**
   * Extract platform from URL or context
   */
  const getPlatformFromContext = (webUrl, appUrl) => {
    // Try to extract from webUrl
    if (webUrl) {
      if (webUrl.includes('instagram.com')) return 'instagram';
      if (webUrl.includes('facebook.com')) return 'facebook';
      if (webUrl.includes('twitter.com') || webUrl.includes('x.com')) return 'twitter';
      if (webUrl.includes('linkedin.com')) return 'linkedin';
      if (webUrl.includes('mail.google.com') || webUrl.includes('mailto:')) return 'email';
    }
    
    // Try to extract from appUrl
    if (appUrl) {
      const urlStr = typeof appUrl === 'object' ? appUrl.primary : appUrl;
      if (urlStr) {
        if (urlStr.includes('instagram')) return 'instagram';
        if (urlStr.includes('facebook') || urlStr.includes('fb://')) return 'facebook';
        if (urlStr.includes('twitter')) return 'twitter';
        if (urlStr.includes('linkedin')) return 'linkedin';
        if (urlStr.includes('gmail') || urlStr.includes('mailto')) return 'email';
      }
    }
    
    return null;
  };

  /**
   * Handle click events on social links and email links
   * Smart Priority: Try native app first (on all platforms) > Fallback to web browser
   * Works on both desktop and mobile with intelligent fallback
   */
  const onClick = (e) => {
    // Support both social links and email links
    const link = e.target?.closest?.('.social-link, .email-link');
    if (!link) return;
    
    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    if (!webUrl || !platform) return;

    // SMART APPROACH: Try app first on ALL platforms, then fallback to web
    // This gives the best user experience - app if available, web if not
    
    // For email: try app first, fallback to web (works on all platforms)
    if (platform === 'email') {
      let appUrl = null;
      if (isAndroid()) {
        appUrl = buildAndroidDeepLink(platform, webUrl, link);
      } else if (isIOS()) {
        appUrl = buildIOSDeepLink(platform, webUrl, link);
      } else {
        // Desktop/Other: Try Gmail app scheme (will fail gracefully and fallback to web)
        const emailDesktop = link?.getAttribute?.('data-email') || '';
        const nameDesktop = link?.getAttribute?.('data-name') || '';
        if (emailDesktop) {
          const subjectDesktop = 'Contact from Digital Business Card';
          const bodyDesktop = `Hello ${nameDesktop || 'there'},\n\n`;
          const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailDesktop)}&su=${encodeURIComponent(subjectDesktop)}&body=${encodeURIComponent(bodyDesktop)}`;
          const mailtoUrl = `mailto:${encodeURIComponent(emailDesktop)}?subject=${encodeURIComponent(subjectDesktop)}&body=${encodeURIComponent(bodyDesktop)}`;
          
          appUrl = {
            primary: `googlegmail://co?to=${encodeURIComponent(emailDesktop)}&subject=${encodeURIComponent(subjectDesktop)}&body=${encodeURIComponent(bodyDesktop)}`,
            fallback: mailtoUrl,
            web: gmailWebUrl
          };
        }
      }
      
      if (appUrl) {
        e.preventDefault();
        e.stopPropagation();
        openWithFallback(appUrl, webUrl, platform);
        return;
      }
      // If no app URL could be built, let normal navigation happen
      return;
    }

    // For social media: try app first on all platforms, fallback to web
    let appUrl = null;
    if (isAndroid()) {
      appUrl = buildAndroidDeepLink(platform, webUrl, link);
    } else if (isIOS()) {
      appUrl = buildIOSDeepLink(platform, webUrl, link);
    } else {
      // Desktop/Other: Try direct app schemes (will fail gracefully and fallback to web)
      const username = getUsernameFromUrl(webUrl);
      if (username) {
        switch (platform) {
          case 'instagram':
            appUrl = `instagram://user?username=${encodeURIComponent(username)}`;
            break;
          case 'twitter':
            appUrl = `twitter://user?screen_name=${encodeURIComponent(username)}`;
            break;
          case 'linkedin':
            appUrl = `linkedin://in/${encodeURIComponent(username)}`;
            break;
          case 'facebook':
            appUrl = `fb://profile/${encodeURIComponent(username)}`;
            break;
        }
      }
    }
    
    if (!appUrl) {
      // If we can't build a reliable app URL, let normal navigation happen
      return;
    }

    // Prevent default navigation and try app first (works on all platforms)
    // If app doesn't open, fallback mechanism will show download modal (mobile) or redirect to web (desktop)
    e.preventDefault();
    e.stopPropagation();
    openWithFallback(appUrl, webUrl, platform);
  };

  document.addEventListener('click', onClick, true);
})();


