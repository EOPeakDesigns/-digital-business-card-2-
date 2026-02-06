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
   * MOBILE-FIRST: Optimized for reliable detection on Android and iOS
   * Includes tablets as they should use mobile app behavior
   */
  const isMobile = () => {
    // Primary check: User Agent (most reliable for actual device type)
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // If User Agent indicates mobile, trust it (most reliable)
    if (isMobileUA) {
      return true;
    }
    
    // Secondary check: Media queries (for devices that might not have mobile UA)
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    
    // Third check: Touch capability + screen size
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouch = isSmallScreen && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Return true if media queries indicate mobile (coarse pointer + no hover)
    // This catches edge cases where UA might not be mobile but device is
    return Boolean(hasCoarsePointer && noHover && hasTouch);
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
   * MOBILE-FIRST: Ensures modal always displays correctly on mobile devices
   */
  const showAppDownloadModal = (platform, webUrl) => {
    const modal = document.getElementById('app-download-modal');
    
    // CRITICAL: If modal doesn't exist, fallback to web navigation
    if (!modal) {
      console.warn('App download modal not found in DOM - redirecting to web');
      if (webUrl && webUrl !== '#') {
        window.location.href = webUrl;
      }
      return;
    }
    
    // Ensure webUrl is valid
    if (!webUrl || webUrl === '#') {
      console.warn('Invalid webUrl provided to modal:', webUrl);
      return;
    }
    
    // Ensure platform is valid
    if (!platform) {
      console.warn('Invalid platform provided to modal:', platform);
      return;
    }

    const modalClose = document.querySelector('.app-download-modal-close');
    const modalOverlay = document.querySelector('.app-download-modal-overlay');
    const storeBtn = document.getElementById('app-download-store-btn');
    const webBtn = document.getElementById('app-download-web-btn');
    const messageEl = document.getElementById('app-download-message');
    const storeTextEl = document.getElementById('app-download-store-text');
    const iconEl = document.getElementById('app-download-icon');

    const appName = getAppName(platform);
    const storeUrl = getAppStoreUrl(platform);
    
    // Update modal message
    if (messageEl) {
      messageEl.textContent = `${appName} is not installed on your device. Would you like to download it?`;
    }
    
    // Set store button (only show on mobile devices)
    if (storeBtn && storeTextEl && iconEl) {
      if (storeUrl && isMobile()) {
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
        // Hide store button on desktop or if no store URL
        storeBtn.style.display = 'none';
      }
    }
    
    // Set web button - ensure it's a valid absolute URL
    if (webBtn) {
      // Ensure webUrl is absolute (starts with http:// or https://)
      let absoluteWebUrl = webUrl;
      if (!webUrl.startsWith('http://') && !webUrl.startsWith('https://')) {
        // If relative URL, make it absolute
        absoluteWebUrl = `https://${webUrl}`;
      }
      webBtn.href = absoluteWebUrl;
      webBtn.target = '_blank';
      webBtn.rel = 'noopener noreferrer';
      // Ensure button is always visible
      webBtn.style.display = 'inline-flex';
    }
    
    // Show modal with animation
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    setTimeout(() => {
      if (storeBtn && storeUrl && isMobile()) {
        storeBtn.focus();
      } else if (webBtn) {
        webBtn.focus();
      } else if (modalClose) {
        modalClose.focus();
      }
    }, 100);
    
    // Close modal function
    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    
    // Set up close handlers (remove old ones first to prevent duplicates)
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
    // Remove old listener if exists, then add new one
    document.removeEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleEscape);
    
    // Set up button click handlers
    if (storeBtn) {
      storeBtn.onclick = (e) => {
        // Don't prevent default - let the link navigate to store
        setTimeout(closeModal, 100);
      };
    }
    
    if (webBtn) {
      webBtn.onclick = (e) => {
        // Don't prevent default - let the link navigate to web
        setTimeout(closeModal, 100);
      };
    }
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
   * MOBILE-FIRST APPROACH: On mobile, always try app first, then show modal if not installed
   * Uses reliable detection methods optimized for Android and iOS
   * Handles both simple URLs and complex objects (for email with multiple fallbacks)
   */
  const openWithFallback = (appUrl, webUrl, platform = null) => {
    // CRITICAL: Ensure platform is always available - extract from context if not provided
    const detectedPlatform = platform || getPlatformFromContext(webUrl, appUrl);
    
    // Handle email case where appUrl is an object with primary, fallback, and web
    let primaryUrl = appUrl;
    let fallbackUrl = null;
    let finalWebUrl = webUrl;
    
    if (typeof appUrl === 'object' && appUrl.primary) {
      primaryUrl = appUrl.primary;
      fallbackUrl = appUrl.fallback;
      finalWebUrl = appUrl.web || webUrl;
    }
    
    // Ensure we have a valid web URL for fallback
    const urlToUse = (typeof appUrl === 'object' && appUrl.web) ? appUrl.web : webUrl;
    
    // Track app opening state
    let appOpened = false;
    let fallbackTimer = null;
    let visibilityTimer = null;
    
    // Cleanup function
    const cleanup = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange, true);
      window.removeEventListener('pagehide', onPageHide, true);
      window.removeEventListener('blur', onBlur, true);
    };
    
    // Detection handlers - simplified and more reliable
    const onVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true;
        cleanup();
      }
    };
    
    const onPageHide = () => {
      appOpened = true;
      cleanup();
    };
    
    const onBlur = () => {
      // On Android, blur can fire even if app doesn't open
      // Use a short delay to verify if page actually becomes hidden
      visibilityTimer = setTimeout(() => {
        if (document.hidden) {
          appOpened = true;
          cleanup();
        }
      }, 200);
    };
    
    // Set up detection listeners BEFORE attempting to open app
    document.addEventListener('visibilitychange', onVisibilityChange, true);
    window.addEventListener('pagehide', onPageHide, true);
    window.addEventListener('blur', onBlur, true);

    /**
     * Attempt to open app URL using iframe method (more reliable on Android)
     * This method doesn't navigate the page, allowing our timeout to work properly
     */
    const attemptOpenApp = (url) => {
      // For app schemes (instagram://, fb://, etc.), use iframe method
      // This is more reliable on Android - doesn't navigate the page
      if (url.includes('://') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        try {
          // Method 1: Try iframe (most reliable, doesn't navigate page)
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.style.width = '1px';
          iframe.style.height = '1px';
          iframe.style.position = 'absolute';
          iframe.style.left = '-9999px';
          iframe.src = url;
          document.body.appendChild(iframe);
          
          // Remove iframe after a short delay
          setTimeout(() => {
            try {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
            } catch (err) {
              // Ignore cleanup errors
            }
          }, 1000);
        } catch (e) {
          // Fallback: Try link click method
          try {
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
          } catch (err) {
            console.warn('Failed to open app URL:', err);
          }
        }
      } else {
        // For http/https/mailto URLs, use standard link click
        try {
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
        } catch (e) {
          console.warn('Failed to open URL:', e);
        }
      }
    };

    // Attempt to open primary URL (app)
    attemptOpenApp(primaryUrl);

    // MOBILE-FIRST: Optimized timing for mobile devices
    // - Mobile (Android/iOS): 1 second timeout (fast user feedback)
    // - Desktop: 500ms timeout (apps won't open, fail fast)
    const fallbackDelay = isMobile() ? 1000 : 500;
    
    fallbackTimer = window.setTimeout(() => {
      cleanup();
      
      // CRITICAL: Check if app actually opened
      // If app opened, page should be hidden or appOpened flag should be true
      const appActuallyOpened = appOpened || document.hidden;
      
      if (!appActuallyOpened) {
        // App didn't open - show fallback
        
        // For email: try mailto: fallback first (only on first attempt)
        if (fallbackUrl && typeof appUrl === 'object' && appUrl.primary && appUrl.primary.includes('googlegmail://')) {
          // Try mailto: fallback (opens default email app)
          attemptOpenApp(fallbackUrl);
          
          // Set another timer for final web fallback or modal
          setTimeout(() => {
            if (!document.hidden && !appOpened) {
              // Mailto also didn't open - show download modal for email
              if (detectedPlatform && isMobile()) {
                showAppDownloadModal('email', urlToUse || finalWebUrl);
              } else {
                window.location.href = finalWebUrl;
              }
            }
          }, 1000);
        } else {
          // For social media: show download modal on mobile, redirect to web on desktop
          if (isMobile() && detectedPlatform) {
            // MOBILE-FIRST: Always show modal on mobile when app doesn't open
            showAppDownloadModal(detectedPlatform, urlToUse || finalWebUrl);
          } else {
            // Desktop: redirect to web directly
            window.location.href = urlToUse || finalWebUrl;
          }
        }
      }
      // If app opened successfully, cleanup already handled
    }, fallbackDelay);
    
    // SAFETY NET: Backup timeout for mobile devices (ensures modal always shows)
    // This is critical for Android where detection might be less reliable
    if (isMobile() && detectedPlatform) {
      const safetyNetDelay = fallbackDelay + 800; // 0.8 seconds after main timeout
      setTimeout(() => {
        // Double-check: if modal is not visible and page is still visible, show modal
        const modal = document.getElementById('app-download-modal');
        const isModalVisible = modal && modal.classList.contains('active');
        
        if (!isModalVisible && !document.hidden && !appOpened) {
          // Modal didn't show and app didn't open - show it now (safety net)
          showAppDownloadModal(detectedPlatform, urlToUse || finalWebUrl);
        }
      }, safetyNetDelay);
    }
  };

  /**
   * Extract platform from URL or context
   * CRITICAL: This function must always return a valid platform to ensure modal shows correctly
   */
  const getPlatformFromContext = (webUrl, appUrl) => {
    // Try to extract from webUrl first (most reliable)
    if (webUrl) {
      const urlLower = webUrl.toLowerCase();
      if (urlLower.includes('instagram.com')) return 'instagram';
      if (urlLower.includes('facebook.com')) return 'facebook';
      if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
      if (urlLower.includes('linkedin.com')) return 'linkedin';
      if (urlLower.includes('mail.google.com') || urlLower.includes('mailto:')) return 'email';
    }
    
    // Try to extract from appUrl as fallback
    if (appUrl) {
      const urlStr = typeof appUrl === 'object' ? appUrl.primary : appUrl;
      if (urlStr) {
        const urlLower = urlStr.toLowerCase();
        if (urlLower.includes('instagram')) return 'instagram';
        if (urlLower.includes('facebook') || urlLower.includes('fb://')) return 'facebook';
        if (urlLower.includes('twitter')) return 'twitter';
        if (urlLower.includes('linkedin')) return 'linkedin';
        if (urlLower.includes('gmail') || urlLower.includes('mailto')) return 'email';
      }
    }
    
    // Return null if platform cannot be determined
    // This should rarely happen if HTML attributes are correct
    return null;
  };

  /**
   * Handle click events on social links and email links
   * MOBILE-FIRST APPROACH: 
   * - On Mobile: Try native app first → Show modal if not installed → Web fallback
   * - On Desktop: Try native app first → Direct web fallback (no modal)
   * Ensures consistent behavior across Android and iOS
   */
  const onClick = (e) => {
    // Support both social links and email links
    const link = e.target?.closest?.('.social-link, .email-link');
    if (!link) return;
    
    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    
    // CRITICAL: Validate required attributes
    if (!webUrl || !platform) {
      console.warn('Social link missing required attributes:', { webUrl, platform });
      return;
    }

    // MOBILE-FIRST: On mobile, always try app first, then show modal if not installed
    // On desktop, try app first, then redirect to web
    
    // Prevent default navigation - we'll handle it ourselves
    e.preventDefault();
    e.stopPropagation();
    
    // For email: build app URL with fallback chain
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
        openWithFallback(appUrl, webUrl, platform);
      } else {
        // If no app URL could be built, navigate to web URL
        window.location.href = webUrl;
      }
      return;
    }

    // For social media: build app URL based on platform
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
    
    if (appUrl) {
      // CRITICAL: Always pass platform to ensure modal shows correctly on mobile
      openWithFallback(appUrl, webUrl, platform);
    } else {
      // If we can't build a reliable app URL, navigate to web URL directly
      window.location.href = webUrl;
    }
  };

  document.addEventListener('click', onClick, true);
})();


