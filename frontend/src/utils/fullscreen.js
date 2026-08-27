/**
 * Cross-browser Fullscreen & Mobile Viewport Utility
 * Provides robust fullscreen entry for Android/Desktop and graceful immersive full-screen fallback for iOS Safari.
 */

/**
 * Checks if current device is a mobile or tablet viewport.
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 820 ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
  );
};

/**
 * Checks if the browser supports the native HTML5 Fullscreen API on arbitrary elements.
 */
export const isFullscreenAPISupported = () => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement;
  return Boolean(
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  );
};

/**
 * Checks if the browser is currently in native fullscreen mode.
 */
export const isNativeFullscreenActive = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

/**
 * Attempts to enter native full-screen mode on the given element or document.documentElement.
 * Must be invoked directly within a user gesture (click/touch) event handler.
 * 
 * @param {HTMLElement} [element]
 * @returns {Promise<boolean>} true if entered or fallback engaged
 */
export const requestAppFullscreen = async (element) => {
  if (typeof document === 'undefined') return false;
  const el = element || document.documentElement;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
      return true;
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('[Fullscreen] Native request rejected or restricted:', err);
  }

  // Fallback for mobile / iOS Safari / restricted browsers:
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 1);
  }
  return false;
};

/**
 * Cleanly exits fullscreen mode if active.
 */
export const exitAppFullscreen = async () => {
  if (typeof document === 'undefined') return;
  try {
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen().catch(() => {});
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen().catch(() => {});
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[Fullscreen] Exit failed:', err);
  }
};

/**
 * Normalizes multi-selection strings and arrays into sorted unique comma-separated strings (e.g. 'A,C').
 */
export const normalizeSelection = (raw) => {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    return raw.map(x => String(x).trim().toUpperCase()).filter(Boolean).sort().join(',');
  }
  return String(raw)
    .toUpperCase()
    .split(/[,\s]+/)
    .map(x => x.trim())
    .filter(x => ['A', 'B', 'C', 'D'].includes(x))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .join(',');
};

/**
 * Toggles an option key (A, B, C, D) within a comma-separated selection string.
 * e.g. toggleOptionInSelection('A,B', 'B') -> 'A'
 * e.g. toggleOptionInSelection('A', 'C') -> 'A,C'
 */
export const toggleOptionInSelection = (currentSelection, optionKey) => {
  const current = normalizeSelection(currentSelection).split(',').filter(Boolean);
  const key = String(optionKey).trim().toUpperCase();

  let next;
  if (current.includes(key)) {
    next = current.filter(k => k !== key);
  } else {
    next = [...current, key];
  }
  return next.sort().join(',');
};
