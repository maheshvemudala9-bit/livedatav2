// src/components/templates/BottomNav.js
// ─────────────────────────────────────────────────────────────────────────────
// MOBILE-ONLY fixed bottom navigation bar (PhonePe-style).
// 5 items: Home, Matches, Search (advanced search), Chat, Dashboard.
// - Renders only on mobile widths (< 768px).
// - Hidden on the admin area (/adminhub/*), which has its own shell.
// - Highlights the active route in the brand color.
// Mounted once in App.js inside <Router> so it appears on every page.
// Styling lives in src/assets/css/theme.css (.bnav*).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../hooks/AuthContext';
import { getUnreadMessageCount } from '../../services/messageService';

const NAV_ITEMS = [
  { to: '/',              label: 'Home',      icon: 'fas fa-home' },
  { to: '/profiles',      label: 'Matches',   icon: 'fas fa-heart' },
  { to: '/advancesearch', label: 'Search',    icon: 'fas fa-search' },
  { to: '/messages',      label: 'Chat',      icon: 'far fa-comment-dots' },
  { to: '/dashboard',     label: 'Dashboard', icon: 'fas fa-th-large' },
];

const BottomNav = () => {
  const location = useLocation();
  const { isLoggedIn } = useContext(AuthContext);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Unread message count for the Chat badge (mobile + logged in only)
  const [unread, setUnread] = useState(0);
  const showNav = isLoggedIn && isMobile
    && !location.pathname.startsWith('/adminhub')
    && location.pathname !== '/impersonate';
  const pathname = location.pathname;
  useEffect(() => {
    if (!showNav) { setUnread(0); return undefined; }
    const userId = localStorage.getItem('userId');
    if (!userId) return undefined;
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await getUnreadMessageCount(userId);
        if (!cancelled && res.data?.status === 'Success') {
          setUnread(Number(res.data.unreadCount) || 0);
        }
      } catch (err) { /* badge is best-effort */ }
    };
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener('unread-messages-changed', load);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('unread-messages-changed', load);
      document.removeEventListener('visibilitychange', load);
    };
  }, [showNav, pathname]);

  // Guests / not-logged-in users: no bottom nav at all (and no spacer).
  // Reactive via AuthContext — appears on login, disappears on logout.
  if (!isLoggedIn) return null;

  // Desktop: no bottom nav. Admin area: no bottom nav (own layout).
  if (!isMobile) return null;
  if (location.pathname.startsWith('/adminhub')) return null;
  if (location.pathname === '/impersonate') return null;

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      {/* Spacer so page content/footer isn't hidden behind the fixed bar */}
      <div className="bnav-spacer" aria-hidden="true" />

      <nav className="bnav">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          const badge = item.to === '/messages' && unread > 0 ? (unread > 99 ? '99+' : String(unread)) : null;
          const label = badge ? `${item.label}, ${unread} unread message${unread === 1 ? '' : 's'}` : item.label;
          return (
            <Link
              key={item.to}
              to={item.to}
              state={item.to === '/profiles' ? { scrollToList: Date.now() } : undefined}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={active ? 'bnav__item is-active' : 'bnav__item'}
              onClick={() => {
                // Matches scrolls to the profiles list (handled in Listing.js).
                if (item.to === '/profiles') return;
                // Always scroll to the top so the user lands on the start of the
                // page — works whether navigating to a new route or re-tapping
                // the current one (where the route doesn't change). A short
                // timeout lets the destination render before scrolling.
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
              }}
            >
              <span className="bnav__icon">
                <i className={item.icon}></i>
                {badge && <span className="bnav__badge" aria-hidden="true">{badge}</span>}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
