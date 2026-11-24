import { useState, useEffect, useRef } from 'react';

export const usePrefersReducedMotion = () => {
  const query = '(prefers-reduced-motion: reduce)';
  const get = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  const [reduced, setReduced] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return reduced;
};

// One-shot visibility. Reports true immediately when reduced motion or no IntersectionObserver.
export const useReveal = () => {
  const reduced = usePrefersReducedMotion();
  const noIO = typeof window === 'undefined' || !('IntersectionObserver' in window);
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (reduced || noIO) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, noIO]);
  return { ref, inView: reduced || noIO || seen };
};

export const useCountUp = (end, duration = 1600) => {
  const { ref, inView } = useReveal();
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced || end === 0) {
      setValue(end);
      return undefined;
    }
    let raf;
    let t0;
    const tick = (t) => {
      if (t0 === undefined) t0 = t;
      const p = Math.min((t - t0) / duration, 1);
      setValue(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, end, duration]);
  return { ref, value };
};
