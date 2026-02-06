/**
 * Device-aware actions for Social + Email buttons (vanilla JS)
 *
 * Goals (behavior-first, no UI):
 * - Social media:
 *   - Mobile: prefer native app opening without showing errors; fall back to web gracefully
 *   - Desktop: open web in a new tab (noopener/noreferrer)
 *   - In-app browsers: avoid fragile deep-link tricks; use web navigation
 * - Email:
 *   - Mobile (including installed PWA): open the default mail app via properly encoded mailto:
 *   - Desktop: open mail client (mailto:) or existing web compose URL in a new tab
 *
 * Integration:
 * - Social links: <a class="social-link" data-platform="instagram|facebook|linkedin|twitter" href="https://...">
 * - Email link:  <a class="email-link"  data-platform="email" data-email="name@domain.com" data-name="Full Name" href="https://mail.google.com/...">
 *
 * Important:
 * - This file intentionally avoids modals/toasts/alerts and does not alter layout/styling.
 */

(() => {
  const UA = navigator.userAgent || '';

  /** Basic environment detection (progressive enhancement). */
  const isIOS = () => /iPad|iPhone|iPod/i.test(UA) && !window.MSStream;
  const isAndroid = () => /Android/i.test(UA);

  const isMobile = () => {
    // UA + pointer heuristics (helps for iPadOS / modern devices)
    const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA);
    if (uaMobile) return true;
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    return Boolean(coarse && noHover);
  };

  const isDesktop = () => !isMobile();

  /**
   * In-app browser detection:
   * - Instagram, Facebook, Messenger, WhatsApp often run webviews that restrict deep links / window.open.
   * - We prefer web navigation in these contexts to avoid broken behavior.
   */
  const isInAppBrowser = () => {
    return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|WhatsApp|MicroMessenger|wv/i.test(UA);
  };

  /** Open a URL in a new tab with safe security flags (desktop behavior). */
  const openNewTabSafe = (url) => {
    try {
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      // If blocked, fall back to same-tab navigation (still safe).
      if (!w) window.location.href = url;
    } catch {
      window.location.href = url;
    }
  };

  /** Same-tab navigation helper (mobile + in-app browser safe default). */
  const navigateSameTab = (url) => {
    window.location.href = url;
  };

  /** Extract platform from link attribute (preferred) or from URL as fallback. */
  const getPlatform = (link) => {
    const p = link?.getAttribute?.('data-platform') || '';
    if (p) return p;
    const href = link?.getAttribute?.('href') || '';
    const h = href.toLowerCase();
    if (h.includes('instagram.com')) return 'instagram';
    if (h.includes('facebook.com')) return 'facebook';
    if (h.includes('linkedin.com')) return 'linkedin';
    if (h.includes('twitter.com') || h.includes('x.com')) return 'twitter';
    if (h.includes('mailto:') || h.includes('mail.google.com')) return 'email';
    return '';
  };

  /**
   * Android intent URL builder for HTTPS links.
   * This is the most reliable way (on Android Chrome) to:
   * - Open native app when installed (via package)
   * - Fall back to web URL when not installed (browser_fallback_url)
   *
   * We only use this when NOT in an in-app browser to prevent webview breakage.
   */
  const ANDROID_PACKAGES = {
    instagram: 'com.instagram.android',
    facebook: 'com.facebook.katana',
    linkedin: 'com.linkedin.android',
    twitter: 'com.twitter.android'
  };

  const buildAndroidIntentForWebUrl = (webUrl, platform) => {
    const pkg = ANDROID_PACKAGES[platform];
    if (!pkg) return null;

    try {
      const u = new URL(webUrl);
      const scheme = (u.protocol || 'https:').replace(':', '') || 'https';
      const noProto = `${u.host}${u.pathname}${u.search}${u.hash}`;
      const fallback = encodeURIComponent(webUrl);
      return `intent://${noProto}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${fallback};end`;
    } catch {
      return null;
    }
  };

  /**
   * Social behavior:
   * - Desktop: new tab to web.
   * - Mobile in-app browser: same-tab to web (avoid deep link tricks).
   * - Mobile normal browser:
   *   - Android: intent:// (native if installed, web if not).
   *   - iOS: universal links via https (opens app if installed, otherwise web).
   */
  const handleSocialAction = (link) => {
    const webUrl = link.getAttribute('href');
    const platform = getPlatform(link);
    if (!webUrl) return;

    // Desktop: always web in a new tab.
    if (isDesktop()) {
      openNewTabSafe(webUrl);
      return;
    }

    // In-app browsers: avoid intent/custom scheme; go web directly.
    if (isInAppBrowser()) {
      navigateSameTab(webUrl);
      return;
    }

    // Android: try intent (native-first with built-in web fallback).
    if (isAndroid()) {
      const intentUrl = buildAndroidIntentForWebUrl(webUrl, platform);
      if (intentUrl) {
        navigateSameTab(intentUrl);
        return;
      }
    }

    // iOS + everything else: rely on universal/app links (webUrl).
    navigateSameTab(webUrl);
  };

  /** Build a properly encoded mailto URL (default mail app, not Gmail-specific). */
  const buildMailtoUrl = ({ to, subject, body }) => {
    const safeTo = (to || '').trim();
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return `mailto:${safeTo}${qs ? `?${qs}` : ''}`;
  };

  /**
   * Email behavior:
   * - Mobile (including installed PWA): mailto: (default mail app) with subject/body.
   * - Desktop:
   *   - If link href is http(s) (e.g., Gmail web compose), open in a new tab.
   *   - Otherwise, use mailto:.
   *
   * Notes:
   * - We do NOT force Gmail app. We intentionally avoid googlegmail:// schemes.
   */
  const handleEmailAction = (link) => {
    const email = link?.getAttribute?.('data-email') || '';
    const name = link?.getAttribute?.('data-name') || '';
    const href = link?.getAttribute?.('href') || '';

    const subject = 'Contact from Digital Business Card';
    const body = `Hello ${name || 'there'},\n\n`;
    const mailtoUrl = buildMailtoUrl({ to: email, subject, body });

    if (!email) {
      // Graceful fallback: if data-email missing, use existing href.
      if (href) {
        if (isDesktop()) openNewTabSafe(href);
        else navigateSameTab(href);
      }
      return;
    }

    if (isDesktop()) {
      // If the existing href is a web compose page (gmail/webmail), respect it.
      if (/^https?:\/\//i.test(href)) {
        openNewTabSafe(href);
        return;
      }
      // Otherwise, use mailto (desktop mail client).
      navigateSameTab(mailtoUrl);
      return;
    }

    // Mobile: default mail app (PWA-safe).
    // In in-app browsers, mailto may be blocked; we still attempt mailto first (no UI, no alerts).
    navigateSameTab(mailtoUrl);
  };

  /**
   * Unified click handler with clear separation:
   * - Social actions: .social-link
   * - Email action:  .email-link (data-platform="email")
   *
   * Avoid breaking the copy icon inside the email row by ignoring clicks on `.copy-icon`.
   */
  const onDocumentClick = (e) => {
    // Don't hijack copy-to-clipboard clicks.
    if (e.target?.closest?.('.copy-icon')) return;

    const link = e.target?.closest?.('.social-link, .email-link');
    if (!link) return;

    const platform = getPlatform(link);
    if (!platform) return;

    // Our actions replace default navigation.
    e.preventDefault();
    e.stopPropagation();

    if (platform === 'email' || link.classList.contains('email-link')) {
      handleEmailAction(link);
      return;
    }

    handleSocialAction(link);
  };

  // Attach once (capture=true ensures we run even if nested elements exist).
  document.addEventListener('click', onDocumentClick, true);

  // Optional: expose functions for manual attachment/testing without changing UI.
  window.DigitalCardActions = {
    isMobile,
    isDesktop,
    isIOS,
    isAndroid,
    isInAppBrowser,
    buildAndroidIntentForWebUrl,
    buildMailtoUrl,
    handleSocialAction,
    handleEmailAction
  };
})();


