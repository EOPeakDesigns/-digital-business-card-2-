/**
 * Social Deep Links & Email App Links
 * MOBILE-FIRST: User choice modal for social media, direct Gmail app for email
 * 
 * Strategy:
 * - Social Media: Always show modal with 2 options (Browser, App/Store)
 * - Email: Always open Gmail app directly (no modal)
 * - Works seamlessly on smartphones, tablets, and desktop
 *
 * Notes:
 * - Uses direct app schemes for maximum reliability
 * - App Store links for Android (Play Store) and iOS (App Store)
 * - Gmail app opens with pre-filled subject and body
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
   * Get App Store URLs for each platform
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
      linkedin: {
        android: 'https://play.google.com/store/apps/details?id=com.linkedin.android',
        ios: 'https://apps.apple.com/app/linkedin/id288429040'
      },
      twitter: {
        android: 'https://play.google.com/store/apps/details?id=com.twitter.android',
        ios: 'https://apps.apple.com/app/twitter/id333903271'
      }
    };

    const platformUrls = storeUrls[platform];
    if (!platformUrls) return null;

    if (isAndroid()) {
      return platformUrls.android;
    } else if (isIOS()) {
      return platformUrls.ios;
    } else {
      // Desktop: Return Android Play Store by default
      return platformUrls.android;
    }
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
        
        return `googlegmail://co?to=${encodeURIComponent(emailIOS)}&subject=${encodeURIComponent(subjectIOS)}&body=${encodeURIComponent(bodyIOS)}`;
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
        
        return `googlegmail://co?to=${encodeURIComponent(emailAndroid)}&subject=${encodeURIComponent(subjectAndroid)}&body=${encodeURIComponent(bodyAndroid)}`;
      default:
        return null;
    }
  };

  /**
   * Get platform display name
   */
  const getPlatformDisplayName = (platform) => {
    const names = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      twitter: 'X (Twitter)',
      email: 'Gmail'
    };
    return names[platform] || platform;
  };

  /**
   * Show notification toast message
   * MOBILE-FIRST: Displays a temporary notification to the user
   */
  const showNotification = (message, duration = 4000) => {
    const toast = document.getElementById('notification-toast');
    const toastMessage = document.getElementById('notification-toast-message');
    
    if (!toast || !toastMessage) {
      console.warn('Notification toast elements not found');
      return;
    }

    toastMessage.textContent = message;
    toast.classList.add('show');

    // Announce to screen readers
    const a11yStatus = document.getElementById('a11y-status');
    if (a11yStatus) {
      a11yStatus.textContent = '';
      setTimeout(() => {
        a11yStatus.textContent = message;
      }, 10);
    }

    // Auto-hide after duration
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  };

  /**
   * Show app download modal for social media
   * MOBILE-FIRST: Always shows modal with 2 options (Browser, App)
   * If app not installed, shows notification instead of redirecting to store
   */
  const showSocialMediaModal = (platform, webUrl, appUrl) => {
    const modal = document.getElementById('app-download-modal');
    if (!modal) {
      console.warn('App download modal not found in DOM');
      // Fallback: Open browser directly
      window.location.href = webUrl;
      return;
    }

    const modalTitle = document.getElementById('app-download-modal-title');
    const modalMessage = document.getElementById('app-download-message');
    const storeBtn = document.getElementById('app-download-store-btn');
    const storeBtnText = document.getElementById('app-download-store-text');
    const storeBtnIcon = document.getElementById('app-download-store-icon');
    const webBtn = document.getElementById('app-download-web-btn');
    const closeBtn = modal.querySelector('.app-download-modal-close');

    if (!modalTitle || !modalMessage || !storeBtn || !webBtn) {
      console.warn('Modal elements not found');
      window.location.href = webUrl;
      return;
    }

    // Update modal content
    const platformName = getPlatformDisplayName(platform);
    modalTitle.textContent = `Open ${platformName}`;
    modalMessage.textContent = `Choose how you'd like to open ${platformName}:`;

    // Button 1: Open in Browser
    webBtn.href = webUrl;
    webBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    };

    // Button 2: Open in App (shows notification if app not installed)
    const storeUrl = getAppStoreUrl(platform);
    if (appUrl) {
      // Try to open app, show notification if app not installed
      storeBtnText.textContent = 'Open in App';
      if (storeBtnIcon) {
        storeBtnIcon.className = 'fa-solid fa-mobile-screen-button';
      }
      storeBtn.href = appUrl;
      storeBtn.style.display = 'inline-flex'; // Ensure visible
      storeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        
        // Track initial state
        const initialHiddenState = document.hidden;
        const startTime = Date.now();
        
        // Attempt to open app
        try {
          window.location.href = appUrl;
          
          // Check if app opened within 1 second
          setTimeout(() => {
            const isHidden = document.hidden;
            const wasHiddenAfterStart = isHidden && !initialHiddenState;
            const timeElapsed = Date.now() - startTime;
            const appOpened = wasHiddenAfterStart && timeElapsed < 1000;
            
            // If app didn't open, show notification
            if (!appOpened && document.visibilityState === 'visible') {
              const platformName = getPlatformDisplayName(platform);
              const storeName = isAndroid() ? 'Play Store' : isIOS() ? 'App Store' : 'app store';
              showNotification(`To open ${platformName} through the mobile app, please install it from the ${storeName}.`, 5000);
            }
          }, 1000);
        } catch (err) {
          // If error, show notification
          const platformName = getPlatformDisplayName(platform);
          const storeName = isAndroid() ? 'Play Store' : isIOS() ? 'App Store' : 'app store';
          showNotification(`To open ${platformName} through the mobile app, please install it from the ${storeName}.`, 5000);
        }
      };
    } else {
      // No app URL available, hide store button
      storeBtn.style.display = 'none';
    }

    // Close button handler
    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    if (closeBtn) {
      closeBtn.onclick = closeModal;
    }

    // Close on overlay click
    const overlay = modal.querySelector('.app-download-modal-overlay');
    if (overlay) {
      overlay.onclick = closeModal;
    }

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus management for accessibility
    storeBtn.focus();
  };

  /**
   * Attempt to open URL using multiple methods (for PWA compatibility)
   * MOBILE-FIRST: Uses multiple techniques to ensure app opens in PWA context
   * Critical for PWAs where window.location.href may not work reliably
   */
  const attemptOpenUrl = (url) => {
    // Method 1: Try creating and clicking a link (most reliable in PWAs)
    try {
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      link.target = '_self';
      document.body.appendChild(link);
      
      // Use both click() and programmatic navigation for maximum compatibility
      link.click();
      
      // Also try direct navigation as backup
      setTimeout(() => {
        try {
          window.location.href = url;
        } catch (e) {
          // Ignore if already handled
        }
      }, 50);
      
      // Cleanup after a short delay
      setTimeout(() => {
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
      }, 200);
    } catch (linkErr) {
      // Method 2: Try window.location.href directly
      try {
        window.location.href = url;
      } catch (e) {
        // Method 3: Try window.open as last resort
        try {
          window.open(url, '_self');
        } catch (openErr) {
          console.warn('Failed to open URL:', openErr);
        }
      }
    }
  };

  /**
   * Open Gmail - Smart detection based on device
   * MOBILE-FIRST: 
   * - Smartphone: Opens Gmail mobile app directly (multiple methods for PWA compatibility)
   * - Desktop: Opens Gmail web browser
   */
  const openGmailApp = (link) => {
    const email = link?.getAttribute?.('data-email') || '';
    const name = link?.getAttribute?.('data-name') || '';
    
    if (!email) {
      console.warn('Email address not found');
      return;
    }

    const subject = 'Contact from Digital Business Card';
    const body = `Hello ${name || 'there'},\n\n`;
    
    // DESKTOP: Open in browser (Gmail web)
    if (isDesktop()) {
      const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // MOBILE: Open Gmail mobile app directly (PWA-compatible)
    if (isMobile()) {
      // Build Gmail app URL - same scheme works for both Android and iOS
      const gmailAppUrl = `googlegmail://co?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // CRITICAL FOR PWA: Use multiple attempts to ensure app opens
      // PWAs require more aggressive methods to open native apps
      
      // Attempt 1: Immediate attempt (primary method)
      attemptOpenUrl(gmailAppUrl);
      
      // Attempt 2: Retry after 100ms (handles PWA delays)
      setTimeout(() => {
        if (document.visibilityState === 'visible' && !document.hidden) {
          attemptOpenUrl(gmailAppUrl);
        }
      }, 100);
      
      // Attempt 3: Final retry after 300ms (for slow PWA contexts)
      setTimeout(() => {
        if (document.visibilityState === 'visible' && !document.hidden) {
          attemptOpenUrl(gmailAppUrl);
        }
      }, 300);
      
      // Fallback: mailto: protocol after 2 seconds if app didn't open
      setTimeout(() => {
        // Only fallback if page is still visible (app didn't open)
        if (document.visibilityState === 'visible' && !document.hidden) {
          const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          attemptOpenUrl(mailtoUrl);
        }
      }, 2000);
      
      return;
    }
    
    // Fallback for other devices: Try Gmail app, then mailto:
    const gmailAppUrl = `googlegmail://co?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    attemptOpenUrl(gmailAppUrl);
    
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        attemptOpenUrl(mailtoUrl);
      }
    }, 1500);
  };

  /**
   * Handle click events on social links and email links
   * MOBILE-FIRST: 
   * - Social Media → Show modal with Browser/App options
   * - Email → Open Gmail app directly
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
    
    // EMAIL: Always open Gmail app directly (no modal)
    if (platform === 'email') {
      openGmailApp(link);
      return;
    }

    // SOCIAL MEDIA: Always show modal with Browser/App options
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
    
    // Show modal with Browser/App options
    showSocialMediaModal(platform, webUrl, appUrl);
  };

  // Attach click handler
  document.addEventListener('click', onClick, true);
})();
