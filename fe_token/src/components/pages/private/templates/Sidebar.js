
import '../../../../assets/css/pages/private-sidebar.css';
import React, { useEffect, useState, useContext, useRef } from 'react'
import Profiles from '../../../templates/ImagesLoader'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../../hooks/AuthContext';
import { fetchUserDetails, fetchUserGallery } from '../../../../services/userService';
import { getUnreadMessageCount } from '../../../../services/messageService';
import { placeholderFor } from '../../../../utils/placeholders';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { imageUrl, approvedOnly, approvedProfileImage } from '../../../../utils/imageUrl';
import { displayLocation } from '../../../../data/locations';

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useContext(AuthContext);

  const [getGallery,     setGetGallery]     = useState([]);
  const [userDetails,    setUserDetails]    = useState([]);
  const [copied,         setCopied]         = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ── Mobile: collapsible sidebar nav ───────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Gallery section is shown everywhere on desktop, but on mobile only on the
  // Gallery page itself (/addgallery).
  const showGallerySection = !isMobile || location.pathname === '/addgallery';

  // Exactly one nav item is active at a time: the one whose target path matches
  // the current route exactly. Derived from location.pathname on every render,
  // so navigating clears the old highlight and sets the new one (no useState).
  const isActivePath = (path) => location.pathname === path;

  // Navigate to a tab, then scroll to the page's main content column so the user
  // lands focused on that section instead of at the top (behind the sidebar).
  const goToTab = (e, path) => {
    if (e) e.preventDefault();
    navigate(path);
    // Let the destination render, then scroll its content column into view.
    setTimeout(() => {
      const content = document.querySelector('.profile-Wrap .col-lg-8');
      if (content) {
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  // ✅ stable userId — not recreated every render
  const userId     = React.useMemo(() => localStorage.getItem("userId"), []);
  // ✅ fetch-once guard — prevents StrictMode double-invoke and re-fetch on parent re-render
  const hasFetched = useRef(false);
  // Own gender: loaded user details first, login-time localStorage value until then.
  const myGender = userDetails.ugender || localStorage.getItem('userGender') || '';

  const logoutHandler = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // ✅ Only fetch once — this is the key fix for repeated API calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUserData = async () => {
      try {
        // ✅ All 3 calls in parallel — faster than sequential
        // The unread count only feeds the desktop Messages item, so skip it on mobile.
        const [userDetailsRes, galleryRes, msgRes] = await Promise.all([
          fetchUserDetails(userId),
          fetchUserGallery(userId),
          window.innerWidth < 768 ? Promise.resolve(null) : getUnreadMessageCount(userId)
        ]);
        setUserDetails(userDetailsRes.data);
        setGetGallery(galleryRes.data);
        if (msgRes && msgRes.data.status === 'Success') {
          setUnreadMessages(msgRes.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Sidebar fetch error:', error);
      }
    };

    fetchUserData();
  }, []); // ✅ empty deps — runs exactly once on mount

  return (
    <>
    <div className="col-lg-4 col-md-4 sbr">
      {/* Profile card (name, photo, MAT id, phone, email, city/state) —
          hidden on mobile per request; shown on desktop. */}
      {!isMobile && (
      <div className="sbr__card sbr__profile">
        <h3 className="sbr__name"><span className="user-name">{userDetails.ufname || 'user'}</span>'s Profile</h3>

        <div className="sbr__avatar">
          <div className="sbr__avatar-frame">
            <PhotoProvider>
              {getGallery.length > 0 ? (
                (() => {
                  const profileFile = approvedProfileImage(getGallery);
                  return profileFile ? (
                    // ✅ PhotoView src — original (full size for lightbox)
                    // ✅ img src      — medium (display in sidebar)
                    <PhotoView src={imageUrl(profileFile.imagepath)}>
                      <img
                        src={imageUrl(profileFile.imagepath_medium) || imageUrl(profileFile.imagepath)}
                        alt="Profile"
                        data-gender={myGender}
                      />
                    </PhotoView>
                  ) : (
                    <img src={placeholderFor(myGender)} alt="Default profile" />
                  );
                })()
              ) : (
                <img src={placeholderFor(myGender)} alt="Default profile" />
              )}
            </PhotoProvider>
          </div>
        </div>

        <div className="sbr__info">
          <h2 className="sbr__mat">
            <span
              className={`sbr__mat-chip ${copied ? 'is-copied' : ''}`}
              onClick={() => {
                const matId = `MAT${userDetails.uid || '---'}`;
                navigator.clipboard.writeText(matId).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              title="Click to copy"
            >
              {copied
                ? <><i className="fas fa-check"></i>Copied!</>
                : <>MAT{userDetails.uid || '---'} <i className="far fa-copy"></i></>
              }
            </span>
          </h2>
          <p><i className="fa fa-phone" aria-hidden="true"></i> {userDetails.uphone}</p>
          <p><i className="fa fa-envelope" aria-hidden="true"></i>{userDetails.uemail}</p>
          <p><i className="fas fa-map-marker-alt"></i>{userDetails.upresentloc ? displayLocation(userDetails.upresentloc) : "Not Available"},{displayLocation(userDetails.ustate)}</p>
        </div>
      </div>
      )}

      <div className="sbr__card sbr__menu">
        {/* Mobile: always-visible "My Account" title with a single row of 4 icon tiles. */}
        {isMobile && (
          <>
            <h2 className="sbr__acct-title">My Account</h2>
            <div className="sbr__quick">
              {[
                { to: '/editprofile',    icon: 'fas fa-edit',       label: 'Edit Profile' },
                { to: '/addgallery',     icon: 'fas fa-images',     label: 'Gallery' },
                { to: '/changepassword', icon: 'fas fa-key',        label: 'Change Password' },
                { to: '/profilesecurity', icon: 'fas fa-shield-alt', label: 'Profile Security' },
              ].map(item => {
                const active = isActivePath(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`sbr__quick-item${active ? ' is-active' : ''}`}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => goToTab(e, item.to)}
                  >
                    <i className={item.icon} aria-hidden="true"></i>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {!isMobile && (
        <ul className="sbr__nav">
          <li><Link className={`sbr__link${isActivePath('/dashboard') ? ' is-active' : ''}`} to="/dashboard" onClick={(e) => goToTab(e, '/dashboard')}><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link className={`sbr__link${isActivePath('/editprofile') ? ' is-active' : ''}`} to="/editprofile" onClick={(e) => goToTab(e, '/editprofile')}><i className="fas fa-edit"></i> Edit Profile</Link></li>
          <li><Link className={`sbr__link${isActivePath('/addgallery') ? ' is-active' : ''}`} to="/addgallery" onClick={(e) => goToTab(e, '/addgallery')}><i className="fas fa-images"></i> Gallery</Link></li>
          <li>
            <Link className={`sbr__link${isActivePath('/messages') ? ' is-active' : ''}`} to="/messages" onClick={(e) => goToTab(e, '/messages')}>
              <i className="far fa-comment"></i> Messages{' '}
              {unreadMessages > 0 && (
                <span className="sbr__badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
              )}
            </Link>
          </li>
          <li><Link className={`sbr__link${isActivePath('/changepassword') ? ' is-active' : ''}`} to="/changepassword" onClick={(e) => goToTab(e, '/changepassword')}><i className="fas fa-key"></i> Change Password</Link></li>
          <li>
            <Link className={`sbr__link${isActivePath('/profilesecurity') ? ' is-active' : ''}`} to="/profilesecurity" onClick={(e) => goToTab(e, '/profilesecurity')}>
              <i className="fas fa-shield-alt"></i> Profile Security
            </Link>
          </li>
          <li>
            {/* Close My Account: the red danger class is applied only when
                /closeaccount is the current page, so it is neutral elsewhere. */}
            <Link className={`sbr__link${isActivePath('/closeaccount') ? ' sbr__link--danger is-active' : ''}`} to="/closeaccount" onClick={(e) => goToTab(e, '/closeaccount')}>
              <i className="fas fa-times"></i> Close My Account
            </Link>
          </li>
          <li>
            {/* Logout is an action, never active. */}
            <a className="sbr__link sbr__link--logout" href="#" onClick={logoutHandler}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
        )}
      </div>

      {showGallerySection && (
      <div className="sbr__card sbr__gallery">
        <h2 className="sbr__title">Gallery</h2>
        <PhotoProvider>
          <div className="sbr__grid">
            {approvedOnly(getGallery).map(res => (
              <div className="sbr__tile" key={res.id}>
                {/* ✅ PhotoView src — original (full size for lightbox) */}
                {/* ✅ img src      — thumb (150×150 for small gallery grid) */}
                <PhotoView src={imageUrl(res.imagepath)}>
                  <div className="sbr__thumb">
                    <img
                      src={imageUrl(res.imagepath_thumb) || imageUrl(res.imagepath)}
                      alt="Profile Gallery"
                    />
                    <div className="sbr__hover" aria-hidden="true">
                      <span className="sbr__plus"><i className="fas fa-plus"></i></span>
                    </div>
                  </div>
                </PhotoView>
              </div>
            ))}
          </div>
        </PhotoProvider>
      </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;
