// Site-wide fallback for broken member photos.
//
// Any <img> that fails to load (corrupt file, deleted file, 404) and points at
// a member upload (/uploads/...) is swapped to the "photo not available"
// placeholder. Works on every page (Matches, Profile Details, Dashboard,
// Messages, Gallery, Home featured cards...) without per-component onError.
// Logos, ads and other bundled images are not touched.
// If the <img> (or a closest ancestor) has data-gender, the matching male /
// female placeholder is used; otherwise the neutral one.
import { notfound, placeholderFor } from './placeholders';

const isMemberPhoto = (src) => typeof src === 'string' && src.includes('/uploads/');

export const installImageFallback = () => {
  if (typeof window === 'undefined' || window.__tsImageFallback) return;
  window.__tsImageFallback = true;

  // 'error' does not bubble, so listen in the capture phase.
  window.addEventListener(
    'error',
    (e) => {
      const img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      if (img.dataset.fallbackApplied === '1') return; // avoid loops
      const src = img.currentSrc || img.src || '';
      if (!isMemberPhoto(src)) return;
      img.dataset.fallbackApplied = '1';
      img.removeAttribute('srcset');
      const holder = img.closest ? img.closest('[data-gender]') : null;
      img.src = holder ? placeholderFor(holder.getAttribute('data-gender')) : notfound;
      if (!img.alt) img.alt = 'Photo not available';
    },
    true
  );
};

export default installImageFallback;
