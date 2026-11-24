// "Install as app" support.
// Chrome/Edge/Android fire `beforeinstallprompt` once, often before React mounts,
// so we capture it at startup and let components subscribe to changes.

const EVENT = 'ts-pwa-install-change';
let deferredPrompt = null;
let installed = false;

const notify = () => window.dispatchEvent(new Event(EVENT));

export const isStandalone = () =>
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
  window.navigator.standalone === true;

export const isIos = () => {
  const ua = window.navigator.userAgent || '';
  const iPadOs = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || iPadOs;
};

export const getInstallState = () => ({
  installed: installed || isStandalone(),
  canPrompt: !!deferredPrompt,
  ios: isIos(),
});

export const subscribeInstall = (fn) => {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};

// Shows the browser's install dialog. Resolves to 'accepted' | 'dismissed' | 'unavailable'.
export const promptInstall = async () => {
  if (!deferredPrompt) return 'unavailable';
  const p = deferredPrompt;
  deferredPrompt = null; // a prompt can only be used once
  p.prompt();
  let outcome = 'dismissed';
  try {
    ({ outcome } = await p.userChoice);
  } catch (e) {
    /* ignore */
  }
  notify();
  return outcome;
};

export const setupPwa = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own button instead of the mini-infobar
    deferredPrompt = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });

  // Service worker only in production builds (dev server would serve stale code).
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
};
