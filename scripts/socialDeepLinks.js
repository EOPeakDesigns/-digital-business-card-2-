/**
 * Platform-agnostic action system for Social + Email buttons (vanilla JS)
 *
 * Core philosophy (behavior-first, UI-agnostic):
 * - Prefer HTTPS links and let the OS/browser decide which app (if any) handles them
 * - Do NOT force native apps (no package forcing, no private/undocumented URI schemes)
 * - Use deep links ONLY when officially documented and stable — by default this module
 *   avoids deep links for social platforms to preserve OS intent resolution + app choosers.
 *
 * Behavior requirements:
 * - Desktop: open external links in a new tab (noopener, noreferrer)
 * - Mobile: same-tab navigation (works for QR opened pages + installed PWAs)
 * - In-app browsers (Instagram/Facebook/WhatsApp webviews): avoid popups; same-tab HTTPS
 * - Email: mobile uses default mail app via mailto:, desktop uses mailto: or existing web compose URL
 *
 * Integration (no markup changes required if you already have these):
 * - Social: <a class="social-link" data-platform="instagram|facebook|..." href="https://...">
 * - Email:  <a class="email-link"  data-platform="email" data-email="name@domain.com" data-name="Full Name" href="https://mail.google.com/...">
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
    // CRITICAL: Desktop must NOT navigate the current tab.
    // Use an <a target="_blank" rel="noopener noreferrer"> click which is both
    // user-gesture friendly and does not risk a same-tab fallback.
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Cleanup (do not block navigation).
      setTimeout(() => {
        try {
          a.remove();
        } catch {
          // ignore
        }
      }, 0);
    } catch {
      // Last resort: attempt window.open without any same-tab fallback.
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        // If everything is blocked, fail silently (requirement: never replace current page).
      }
    }
  };

  /** Same-tab navigation helper (mobile + in-app browser safe default). */
  const navigateSameTab = (url) => {
    // Use assign() (keeps consistent navigation behavior, allows back button).
    window.location.assign(url);
  };

  /**
   * Platform rules configuration (easy to extend)
   * - Primary is always HTTPS for social platforms
   * - `hosts` are only used for inference when `data-platform` is missing
   */
  const PLATFORM_RULES = {
    facebook: { hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com'] },
    instagram: { hosts: ['instagram.com', 'www.instagram.com', 'm.instagram.com'] },
    linkedin: { hosts: ['linkedin.com', 'www.linkedin.com'] },
    twitter: { hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'] },
    whatsapp: { hosts: ['wa.me', 'api.whatsapp.com', 'chat.whatsapp.com'] },
    telegram: { hosts: ['t.me', 'telegram.me'] },
    youtube: { hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'] },
    tiktok: { hosts: ['tiktok.com', 'www.tiktok.com'] },
    snapchat: { hosts: ['snapchat.com', 'www.snapchat.com'] },
    email: { hosts: [] }
  };

  /** Normalize a URL to HTTPS when possible (never invent non-HTTPS deep links). */
  const normalizeHttpsUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
      // Allow mailto/tel/etc unchanged.
      if (/^(mailto:|tel:|sms:)/i.test(rawUrl)) return rawUrl;
      const u = new URL(rawUrl, window.location.href);
      if (u.protocol === 'http:') u.protocol = 'https:';
      // Keep https/data-platform link as-is.
      return u.toString();
    } catch {
      return rawUrl;
    }
  };

  /** Extract platform from data attribute (preferred) or infer from hostname. */
  const getPlatform = (link) => {
    const explicit = (link?.getAttribute?.('data-platform') || '').trim().toLowerCase();
    if (explicit) return explicit;

    const href = link?.getAttribute?.('href') || '';
    try {
      const u = new URL(href, window.location.href);
      const host = (u.hostname || '').toLowerCase();
      for (const [platform, rule] of Object.entries(PLATFORM_RULES)) {
        if (!rule.hosts?.length) continue;
        if (rule.hosts.some((h) => h === host || host.endsWith(`.${h}`))) return platform;
      }
    } catch {
      // ignore
    }
    return '';
  };

  /**
   * Centralized action resolver (single source of truth)
   * - Social: HTTPS same-tab on mobile, HTTPS new-tab on desktop
   * - Email: mailto: on mobile (default mail app), desktop uses web compose in new tab if provided
   */
  const resolveAndOpenExternalUrl = (rawUrl) => {
    const url = normalizeHttpsUrl(rawUrl);
    if (!url) return;

    // In-app browsers: popups are unreliable; always same-tab.
    if (isInAppBrowser()) {
      navigateSameTab(url);
      return;
    }

    // Desktop: new tab. Mobile: same tab.
    if (isDesktop()) openNewTabSafe(url);
    else navigateSameTab(url);
  };

  const handleSocialAction = (link) => {
    const href = link?.getAttribute?.('href') || '';
    resolveAndOpenExternalUrl(href);
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
   * - We do NOT force Gmail app. We intentionally avoid vendor-specific deep links.
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
        openNewTabSafe(normalizeHttpsUrl(href));
        return;
      }
      // Otherwise, use mailto (desktop mail client).
      navigateSameTab(mailtoUrl);
      return;
    }

    // Mobile: default mail app (PWA-safe).
    // In in-app browsers, mailto may be blocked; we still attempt mailto first (no UI, no alerts).
    // Mobile: mailto triggers the default mail handler. This is the most reliable PWA + Safari behavior.
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

    /**
     * IMPORTANT BEHAVIOR RULES:
     * - Social links on MOBILE: do NOT preventDefault; allow the browser/OS to resolve
     *   app links and app choosers from the raw HTTPS click (best for multiple app variants).
     * - Social links on DESKTOP: fully intercept and open ONLY in a new tab.
     * - Email: intercept to generate a correctly encoded mailto: with subject/body (mobile),
     *   while preserving desktop behavior (web compose in new tab if provided).
     */

    const isEmail = platform === 'email' || link.classList.contains('email-link');
    const isSocial = link.classList.contains('social-link') && !isEmail;

    if (isSocial && !isDesktop()) {
      // MOBILE (and mobile webviews): Let the default HTTPS navigation happen.
      // This is the most OS-friendly path for universal/app links and app choosers.
      //
      // Optional progressive enhancement: normalize http->https once, without changing UI.
      // (Only if the href is explicitly http.)
      const rawHref = link.getAttribute('href') || '';
      const normalized = normalizeHttpsUrl(rawHref);
      if (normalized && normalized !== rawHref && /^http:\/\//i.test(rawHref)) {
        link.setAttribute('href', normalized);
      }
      return;
    }

    // From here on, we are intercepting default navigation.
    e.preventDefault();
    // Desktop double-navigation fix: stop propagation so no other handlers can re-navigate.
    e.stopPropagation();
    // Some environments support stopImmediatePropagation; use it to be extra safe.
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    if (isEmail) {
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
    PLATFORM_RULES,
    normalizeHttpsUrl,
    buildMailtoUrl,
    resolveAndOpenExternalUrl,
    handleSocialAction,
    handleEmailAction
  };
})();


