/**
 * Social Deep Links & Email App Links
 * MOBILE-FIRST: Smart app detection and seamless web fallback
 * 
 * Strategy:
 * - Detect if app is installed within 1 second
 * - If app installed → Open app directly (NO modal)
 * - If app NOT installed → Open web immediately (NO modal)
 * - Works seamlessly on smartphones, tablets, and desktop
 *
 * Notes:
 * - Uses direct app schemes for maximum reliability
 * - Ultra-fast detection (1 second max)
 * - No modals - direct action for best UX
 */

(() => {
  /**
   * Detect if device is mobile/tablet (touch device)
   * MOBILE-FIRST: Optimized for reliable detection on Android and iOS
   */
  const isMobile = () => {
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    if (isMobileUA) {
      return true;
    }
    
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouch = isSmallScreen && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    return Boolean(hasCoarsePointer && noHover && hasTouch);
  };

  const isDesktop = () => {
    const ua = navigator.userAgent || '';
    const isDesktopOS = /Windows|Macintosh|Linux|X11/i.test(ua);
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isDesktopBrowser = isDesktopOS && !isMobileDevice && window.innerWidth > 768;
    return isDesktopBrowser;
  };

  const isIOS = () => /iPad|iPhone|iPod/i.test(navigator.userAgent) && !window.MSStream;
  
  const isAndroid = () => {
    const ua = navigator.userAgent || '';
    const androidUA = /Android/i.test(ua);
    const isDesktopBrowser = /Windows|Macintosh|Linux|X11/i.test(ua) && !/Mobile/i.test(ua);
    return androidUA && !isDesktopBrowser;
  };

  /**
   * Extract username from social media URL
   */
  const getUsernameFromUrl = (url) => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] || '';
    } catch {
      return '';
    }
  };

  /**
   * Build iOS deep link URL
   */
  const buildIOSDeepLink = (platform, webUrl, link) => {
    const username = getUsernameFromUrl(webUrl);

    switch (platform) {
      case 'instagram':
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
        const emailIOS = link?.getAttribute?.('data-email') || '';
        const nameIOS = link?.getAttribute?.('data-name') || '';
        if (!emailIOS) return null;
        
        const subjectIOS = 'Contact from Digital Business Card';
        const bodyIOS = `Hello ${nameIOS || 'there'},\n\n`;
        const gmailWebUrlIOS = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailIOS)}&su=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`;
        const mailtoUrlIOS = `mailto:${encodeURIComponent(emailIOS)}?subject=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`;
        
        return {
          primary: `googlegmail://co?to=${encodeURIComponent(emailIOS)}&subject=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`,
          fallback: mailtoUrlIOS,
          web: gmailWebUrlIOS
        };
      default:
        return null;
    }
  };

  /**
   * Build Android deep link URL
   */
  const buildAndroidDeepLink = (platform, webUrl, link) => {
    const username = getUsernameFromUrl(webUrl);
    
    switch (platform) {
      case 'instagram':
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
        const emailAndroid = link?.getAttribute?.('data-email') || '';
        const nameAndroid = link?.getAttribute?.('data-name') || '';
        if (!emailAndroid) return null;
        
        const subjectAndroid = 'Contact from Digital Business Card';
        const bodyAndroid = `Hello ${nameAndroid || 'there'},\n\n`;
        const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAndroid)}&su=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
        const mailtoUrl = `mailto:${encodeURIComponent(emailAndroid)}?subject=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
        
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
   * Extract platform from URL or context
   */
  const getPlatformFromContext = (webUrl, appUrl) => {
    if (webUrl) {
      const urlLower = webUrl.toLowerCase();
      if (urlLower.includes('instagram.com')) return 'instagram';
      if (urlLower.includes('facebook.com')) return 'facebook';
      if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
      if (urlLower.includes('linkedin.com')) return 'linkedin';
      if (urlLower.includes('mail.google.com') || urlLower.includes('mailto:')) return 'email';
    }
    
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
    
    return null;
  };

  /**
   * Open app with smart web fallback
   * MOBILE-FIRST: Detects app within 1 second, opens web immediately if not installed
   * NO MODALS - Direct action for seamless UX
   */
  const openWithFallback = (appUrl, webUrl, platform = null) => {
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
    
    const urlToUse = (typeof appUrl === 'object' && appUrl.web) ? appUrl.web : webUrl;
    
    // MOBILE-FIRST: Track initial state BEFORE attempting to open app
    const initialHiddenState = document.hidden;
    const startTime = Date.now();
    
    // Track app opening state
    let appOpened = false;
    let detectionConfirmed = false;
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
    
    // Detection function - checks if app opened
    const checkIfAppOpened = () => {
      if (detectionConfirmed) return true;
      
      const isHidden = document.hidden;
      const wasHiddenAfterStart = isHidden && !initialHiddenState;
      const timeElapsed = Date.now() - startTime;
      const quickHide = wasHiddenAfterStart && timeElapsed < 1000; // Within 1 second (as requested)
      
      if (wasHiddenAfterStart && quickHide) {
        appOpened = true;
        detectionConfirmed = true;
        cleanup();
        return true;
      }
      
      return false;
    };
    
    // Detection handlers
    const onVisibilityChange = () => {
      if (checkIfAppOpened()) {
        return;
      }
    };
    
    const onPageHide = () => {
      if (!detectionConfirmed) {
        appOpened = true;
        detectionConfirmed = true;
        cleanup();
      }
    };
    
    const onBlur = () => {
      visibilityTimer = setTimeout(() => {
        if (!detectionConfirmed && checkIfAppOpened()) {
          return;
        }
        visibilityTimer = null;
      }, 200);
    };
    
    // Set up detection listeners BEFORE attempting to open app
    document.addEventListener('visibilitychange', onVisibilityChange, true);
    window.addEventListener('pagehide', onPageHide, true);
    window.addEventListener('blur', onBlur, true);

    /**
     * Attempt to open app URL
     * Uses window.location for reliable event triggering
     */
    const attemptOpenApp = (url) => {
      if (url.includes('://') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        // App scheme - use window.location for reliable detection
        try {
          window.location.href = url;
        } catch (e) {
          // Fallback: Try link click
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
        // HTTP/HTTPS/MAILTO URLs - use standard link click
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

    // MOBILE-FIRST: 1 second timeout (ultra-fast detection)
    // - Mobile: 1000ms (1 second max as requested)
    // - Desktop: 500ms (apps won't open, fail fast)
    const fallbackDelay = isMobile() ? 1000 : 500;
    
    fallbackTimer = window.setTimeout(() => {
      cleanup();
      
      // Final check if app actually opened
      const timeElapsed = Date.now() - startTime;
      const isCurrentlyHidden = document.hidden && !initialHiddenState;
      const wasHiddenQuickly = isCurrentlyHidden && timeElapsed < 1000; // Within 1 second
      
      // App opened if detection confirmed or page became hidden quickly
      const appActuallyOpened = detectionConfirmed || appOpened || wasHiddenQuickly;
      
      if (!appActuallyOpened) {
        // App didn't open - open web immediately (NO modal)
        
        // For email: try mailto: fallback first
        if (fallbackUrl && typeof appUrl === 'object' && appUrl.primary && appUrl.primary.includes('googlegmail://')) {
          // Try mailto: fallback (opens default email app)
          if (!appOpened && !detectionConfirmed) {
            attemptOpenApp(fallbackUrl);
            
            // Check if mailto opened within 1 second
            setTimeout(() => {
              const mailtoTimeElapsed = Date.now() - startTime;
              const mailtoIsHidden = document.hidden && !initialHiddenState;
              const mailtoOpened = mailtoIsHidden && mailtoTimeElapsed < 2000; // 2 seconds total (1s detection + 1s mailto check)
              
              if (!mailtoOpened && !appOpened && !detectionConfirmed) {
                // Mailto also didn't open - open web immediately
                window.location.href = urlToUse || finalWebUrl;
              }
            }, 1000);
          } else {
            // Primary app opened, skip fallback
            return;
          }
        } else {
          // For social media: open web immediately (NO modal)
          window.location.href = urlToUse || finalWebUrl;
        }
      }
      // If app opened successfully, cleanup already handled
    }, fallbackDelay);
  };

  /**
   * Handle click events on social links and email links
   * MOBILE-FIRST: Try app first → Open web immediately if not installed
   */
  const onClick = (e) => {
    const link = e.target?.closest?.('.social-link, .email-link');
    if (!link) return;
    
    const webUrl = link.getAttribute('href');
    const platform = link.getAttribute('data-platform');
    
    if (!webUrl || !platform) {
      console.warn('Social link missing required attributes:', { webUrl, platform });
      return;
    }

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
        // Desktop/Other: Try Gmail app scheme
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
      // Desktop/Other: Try direct app schemes
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
      openWithFallback(appUrl, webUrl, platform);
    } else {
      window.location.href = webUrl;
    }
  };

  document.addEventListener('click', onClick, true);
})();
