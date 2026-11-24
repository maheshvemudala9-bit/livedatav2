
// src/components/pages/public/ProfileDetails.js
import React, { useEffect, useState } from 'react';
import profilepics from '../../templates/ImagesLoader';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../assets/css/pages/profile-details.css';

import { imageUrl } from '../../../utils/imageUrl';
import { placeholderFor } from '../../../utils/placeholders';
import { fetchUserDetails, fetchUserGallery, getUserContactInfo, blockUser, unblockUser, getBlockStatus } from '../../../services/userService';
import { getPublicProfile, getPublicGallery } from '../../../services/listingService';
import { approvedOnly, approvedProfileImage } from '../../../utils/imageUrl';
import {
  sendProposal,
  getSentProposals,
  getNotifications
} from '../../../services/proposalService';
import { sendMessage } from '../../../services/messageService';
import { useToast } from '../../../components/hooks/ToastContext';
import { displayLocation } from '../../../data/locations';

const MARRIAGE_SETTLED_TEXT = "This person's marriage is already settled";
const ACCESS_REASONS = ['PAYMENT_REQUIRED', 'UPGRADE_REQUIRED', 'DIAMOND_ONLY', 'MARRIAGE_SETTLED'];

// Maps a contact-access reason code to the text shown in the contact modal.
// Returns '' for codes that are not access-rule denials.
const accessDeniedMessage = (reason, requiredMembership) => {
  switch (reason) {
    case 'PAYMENT_REQUIRED': return 'Verification pending. Once verified, you can view contacts.';
    case 'UPGRADE_REQUIRED': return `You can't view this contact. This member has restricted their visibility.`
    // `Upgrade to ${requiredMembership || 'a higher plan'} to view this contact.`;
    case 'DIAMOND_ONLY':     return `You can't view this contact. This member has restricted their visibility.`;
    case 'MARRIAGE_SETTLED': return MARRIAGE_SETTLED_TEXT;
    default:                 return '';
  }
};

const ProfileDetails = () => {
  const { uid }    = useParams();
  const navigate   = useNavigate();
  const { showToast } = useToast();

  // Static "request sent" toast fired by the Request Photos button.
  const handleRequestPhotos = (e) => {
    if (e) e.preventDefault();
    showToast({
      title:       'Request sent',
      description: 'Request sent successfully.',
      type:        'success'
    });
  };

  const [userDetails, setUserDetails] = useState({});
  const [profileImage, setProfileImage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gallerydata, setGalleryData] = useState([]);

  // Hide ad images on mobile only (kept on desktop).
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Proposal state ────────────────────────────────────────────────────────
  const [proposalStatus,  setProposalStatus]  = useState('idle');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalDate,    setProposalDate]    = useState(null);

  // ── Message state ─────────────────────────────────────────────────────────
  const [messageStatus,  setMessageStatus]  = useState('idle');
  const [messageText,    setMessageText]    = useState('');
  const [messageDate,    setMessageDate]    = useState(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showContactDetailsModal,  setShowContactDetailsModal]  = useState(false);

  // ── Contact details state ─────────────────────────────────────────────────
  const [contactInfo,       setContactInfo]       = useState(null);
  const [contactLoading,    setContactLoading]    = useState(false);
  const [contactError,      setContactError]      = useState('');
  const [contactErrorReason,setContactErrorReason]= useState(''); // 'contact_hidden' | 'daily_limit_reached' | ''
  const [contactRevealed,   setContactRevealed]   = useState(false);
  const [marriageSettled,   setMarriageSettled]   = useState(false);
  const [contactAccess,     setContactAccess]     = useState(null); // {allowed, reason, requiredMembership} | null

  // ── Block state ───────────────────────────────────────────────────────────
  const [iBlocked,           setIBlocked]           = useState(false);
  const [blockBusy,          setBlockBusy]          = useState(false);
  const [profileUnavailable, setProfileUnavailable] = useState(false);

  const loggedInUserId = localStorage.getItem("userId");

  // Known-denied access (from profile load or a stale reveal attempt): no unlock request is sent.
  const deniedMessage = contactAccess && contactAccess.allowed === false
    ? accessDeniedMessage(contactAccess.reason, contactAccess.requiredMembership)
    : '';

  // ── Scroll to top on mount ────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Reset contact state when profile changes ──────────────────────────────
  useEffect(() => {
    setContactInfo(null);
    setContactRevealed(false);
    setContactError('');
    setContactErrorReason('');
    setMarriageSettled(false);
    setContactAccess(null);
    setIBlocked(false);
    setProfileUnavailable(false);
  }, [uid]);

  // ── Fetch profile details + gallery ──────────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    const loadProfileData = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const myGender   = localStorage.getItem('userGender'); // 'Male' or 'Female'

        if (isLoggedIn) {
          const response    = await fetchUserDetails(uid);
          const fetchimage  = await fetchUserGallery(uid);
          const profileData = response.data;

          // The owner of this profile has blocked the viewer (or it does not exist).
          if (profileData && profileData.status === 'Failure') {
            setProfileUnavailable(true);
            return;
          }

          // ── Gender Guard ────────────────────────────────────────────────
          // Logged-in users can only view opposite gender profiles.
          // Own profile is always allowed.
          // If same gender → redirect to /profiles.
          if (profileData && myGender) {
            const profileGender = profileData.ugender;
            const isOwnProfile  = String(profileData.uid) === String(loggedInUserId);
            const isSameGender  = profileGender === myGender;

            if (isSameGender && !isOwnProfile) {
              navigate('/profiles');
              return;
            }
          }
          // ── End Gender Guard ─────────────────────────────────────────────

          // Only an APPROVED profile image may be shown (own-profile view can
          // include pending images from the gallery API).
          const profileImg = approvedProfileImage(fetchimage.data);
          setProfileImage(profileImg ? profileImg.imagepath : placeholderFor(profileData?.ugender));
          setUserDetails(profileData);
          setMarriageSettled(!!profileData?.marriageSettled || profileData?.marriage_status === 'Marriage Settled');
          setContactAccess(profileData?.contactAccess || null);

          // Did I block this user? (own profile has nothing to block)
          if (String(uid) !== String(loggedInUserId)) {
            try {
              const bs = await getBlockStatus(uid);
              setIBlocked(!!bs.data?.data?.iBlocked);
            } catch (e) { /* block status is optional UI state */ }
          }

        } else {
          // Guest — no gender restriction, use public endpoints
          const response   = await getPublicProfile(uid);
          if (response.data && response.data.status === 'Failure') {
            setProfileUnavailable(true);
            return;
          }
          const fetchimage = await getPublicGallery(uid);
          const profileImg = approvedProfileImage(fetchimage.data);
          setProfileImage(profileImg ? profileImg.imagepath : placeholderFor(response.data.data?.ugender));
          setUserDetails(response.data.data || {});
          setMarriageSettled(!!response.data.marriageSettled);
          setContactAccess(response.data.contactAccess || null);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    const loadGalleryData = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const resp = isLoggedIn
          ? await fetchUserGallery(uid)
          : await getPublicGallery(uid);
        // Show only approved images in the public gallery/carousel.
        setGalleryData(approvedOnly(resp.data));
      } catch (error) {
        console.log(error);
      }
    };

    loadProfileData();
    loadGalleryData();
  }, [uid]);

  // ── Check proposal status ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const checkBothDirections = async () => {
      if (!loggedInUserId || !uid) return;
      if (String(loggedInUserId) === String(uid)) return;
      try {
        const [sentRes, receivedRes] = await Promise.all([
          getSentProposals(loggedInUserId),
          getNotifications(loggedInUserId)
        ]);
        if (!isMounted) return;
        if (sentRes.data.status === 'Success' && sentRes.data.data?.length > 0) {
          const iSent = sentRes.data.data.find(p => String(p.receiver_id) === String(uid));
          if (iSent) {
            if (iSent.status === 'pending')  { setProposalStatus('i_sent');     setProposalDate(iSent.created_at); return; }
            if (iSent.status === 'accepted') { setProposalStatus('i_accepted'); setProposalDate(iSent.created_at); return; }
            if (iSent.status === 'rejected') { setProposalStatus('i_rejected'); setProposalDate(iSent.created_at); return; }
          }
        }
        if (receivedRes.data.status === 'Success' && receivedRes.data.data?.length > 0) {
          const theySent = receivedRes.data.data.find(n => String(n.sender_id) === String(uid));
          if (theySent) { setProposalStatus('they_sent'); setProposalDate(theySent.created_at); return; }
        }
        setProposalStatus('idle');
      } catch (err) {
        if (isMounted) { console.error('[PROPOSAL] error:', err); setProposalStatus('idle'); }
      }
    };
    checkBothDirections();
    return () => { isMounted = false; };
  }, [loggedInUserId, uid]);

  // ── Fetch Contact Info from API ───────────────────────────────────────────
  const handleRevealContact = async () => {
    if (!loggedInUserId || iBlocked) return;
    setContactLoading(true);
    setContactError('');
    setContactErrorReason('');
    try {
      const response = await getUserContactInfo(uid);
      if (response.data.status === 'Success') {
        setContactInfo(response.data.data);
        setContactRevealed(true);
        if (response.data.marriageSettled) setMarriageSettled(true);
      } else {
        // reason: 'contact_hidden' | 'daily_limit_reached' | access codes | undefined.
        // Message text is built by the backend (includes the live limit value).
        const reason = response.data.reason || '';
        if (response.data.marriageSettled) setMarriageSettled(true);
        if (response.data.contactAccess) setContactAccess(response.data.contactAccess);
        setContactError(
          accessDeniedMessage(reason, response.data.contactAccess?.requiredMembership)
          || response.data.result || 'Failed to fetch contact details.'
        );
        setContactErrorReason(reason);
      }
    } catch (err) {
      console.error('[CONTACT] error:', err);
      setContactError('Something went wrong. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  // ── Block / Unblock ───────────────────────────────────────────────────────
  const handleBlock = async (e) => {
    if (e) e.preventDefault();
    if (blockBusy) return;
    const name = userDetails.ulname || 'this user';
    if (!window.confirm(`Block ${name}? They won't be able to see your profile or message you.`)) return;
    setBlockBusy(true);
    try {
      const response = await blockUser(uid);
      if (response.data.status === 'Success') {
        setIBlocked(true);
        showToast({ type: 'success', title: 'User blocked', description: 'You have blocked this user.' });
      } else {
        showToast({ type: 'error', title: 'Could not block', description: response.data.result || 'Please try again.' });
      }
    } catch (error) {
      console.error('[BLOCK] error:', error);
      showToast({ type: 'error', title: 'Could not block', description: 'Something went wrong. Please try again.' });
    } finally {
      setBlockBusy(false);
    }
  };

  const handleUnblock = async (e) => {
    if (e) e.preventDefault();
    if (blockBusy) return;
    if (!window.confirm('Unblock this user?')) return;
    setBlockBusy(true);
    try {
      const response = await unblockUser(uid);
      if (response.data.status === 'Success') {
        setIBlocked(false);
        showToast({ type: 'success', title: 'User unblocked', description: 'You have unblocked this user.' });
      } else {
        showToast({ type: 'error', title: 'Could not unblock', description: response.data.result || 'Please try again.' });
      }
    } catch (error) {
      console.error('[UNBLOCK] error:', error);
      showToast({ type: 'error', title: 'Could not unblock', description: 'Something went wrong. Please try again.' });
    } finally {
      setBlockBusy(false);
    }
  };

  // ── Age Calculator ────────────────────────────────────────────────────────
  const birthDate = userDetails.udob;
  const age = calculateAge(birthDate);
  function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff   = today.getDate()  - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) { age--; }
    return age;
  }

  // ── Send Proposal Handler ─────────────────────────────────────────────────
  const handleSendProposal = async () => {
    if (iBlocked) return;
    if (!loggedInUserId) { alert('Please login to send a proposal.'); return; }
    if (String(loggedInUserId) === String(uid)) { alert('You cannot send a proposal to your own profile.'); return; }
    setProposalStatus('sending');
    setProposalMessage('');
    try {
      const response = await sendProposal(loggedInUserId, uid);
      if (response.data.status === 'Success') {
        setProposalStatus('i_sent');
        setProposalMessage('Proposal sent successfully!');
      } else if (response.data.result === 'Proposal already sent.') {
        setProposalStatus('i_sent');
        setProposalMessage('You have already sent a proposal to this profile.');
      } else {
        setProposalStatus('error');
        setProposalMessage(response.data.result || 'Failed to send proposal.');
      }
    } catch (error) {
      console.error('[PROPOSAL] error:', error);
      setProposalStatus('error');
      setProposalMessage('Something went wrong. Please try again.');
    }
  };

  // ── Send Message Handler ──────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (iBlocked) return;
    if (!loggedInUserId) { alert('Please login to send a message.'); return; }
    if (String(loggedInUserId) === String(uid)) { alert('You cannot send a message to your own profile.'); return; }
    setMessageStatus('sending');
    setMessageText('');
    const defaultMsg = `Hi ${userDetails.ulname}, I liked your profile and would be happy to connect. Your profile matches my preferences. I look forward to hearing from you.`;
    try {
      const response = await sendMessage(loggedInUserId, uid, defaultMsg, 'text');
      if (response.data.status === 'Success') {
        setMessageStatus('sent');
        setMessageText('Message sent successfully!');
        setMessageDate(new Date().toISOString());
      } else {
        setMessageStatus('error');
        setMessageText(response.data.result || 'Failed to send message.');
      }
    } catch (error) {
      console.error('[MESSAGE] error:', error);
      setMessageStatus('error');
      setMessageText('Something went wrong. Please try again.');
    }
  };

  // ── Proposal Helpers ──────────────────────────────────────────────────────
  const anchorLabel = () => {
    if (proposalStatus === 'sending')    return '⏳ Sending...';
    if (proposalStatus === 'i_sent')     return '✓ Proposal Sent';
    if (proposalStatus === 'i_accepted') return '✅ Proposal Accepted';
    if (proposalStatus === 'i_rejected') return '✗ Proposal Rejected';
    if (proposalStatus === 'they_sent')  return '📩 Proposal Received';
    if (proposalStatus === 'error')      return '❌ Retry Send Proposal';
    return 'Send Proposal';
  };
  // Presentation only: maps proposal status to a CSS tone modifier.
  const proposalTone = () => {
    if (proposalStatus === 'i_accepted') return 'is-accepted';
    if (proposalStatus === 'i_rejected') return 'is-rejected';
    if (proposalStatus === 'i_sent')     return 'is-sent';
    if (proposalStatus === 'they_sent')  return 'is-received';
    if (proposalStatus === 'error')      return 'is-error';
    return '';
  };
  const proposalButtonLabel = () => {
    if (proposalStatus === 'sending')    return '⏳ Sending...';
    if (proposalStatus === 'i_sent')     return '✓ Proposal Sent';
    if (proposalStatus === 'i_accepted') return '✅ Accepted';
    if (proposalStatus === 'i_rejected') return '✗ Rejected';
    if (proposalStatus === 'they_sent')  return 'Cannot Send — You Received a Proposal';
    return 'Send';
  };
  const proposalButtonDisabled =
    proposalStatus === 'sending'    || proposalStatus === 'i_sent' ||
    proposalStatus === 'i_accepted' || proposalStatus === 'i_rejected' ||
    proposalStatus === 'they_sent';
  const canOpenModal = proposalStatus === 'idle' || proposalStatus === 'error';

  // ── Message Helpers ───────────────────────────────────────────────────────
  const messageAnchorLabel = () => {
    if (messageStatus === 'sending') return '⏳ Sending...';
    if (messageStatus === 'sent')    return '✓ Message Sent';
    if (messageStatus === 'error')   return '❌ Retry';
    return 'Send Message';
  };
  // Presentation only: maps message status to a CSS tone modifier.
  const messageTone = () => {
    if (messageStatus === 'sent')  return 'is-accepted';
    if (messageStatus === 'error') return 'is-error';
    return '';
  };
  const messageButtonLabel = () => {
    if (messageStatus === 'sending') return '⏳ Sending...';
    if (messageStatus === 'sent')    return '✓ Sent';
    if (messageStatus === 'error')   return 'Retry';
    return 'Send';
  };
  const messageButtonDisabled = messageStatus === 'sending' || messageStatus === 'sent';
  const canOpenMessageModal   = messageStatus === 'idle'    || messageStatus === 'error';

  // ── Date Formatter ────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d    = new Date(dateStr);
      const dd   = String(d.getDate()).padStart(2, '0');
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return ''; }
  };

  // ── Heading Helpers ───────────────────────────────────────────────────────
  const headingText = () => {
    const date = proposalDate ? formatDate(proposalDate) : '';
    if (proposalStatus === 'i_sent')     return date ? `Proposal Sent on ${date}`        : 'Proposal Sent — Awaiting Response';
    if (proposalStatus === 'i_accepted') return date ? `✅ Proposal Accepted on ${date}` : '✅ Proposal Accepted';
    if (proposalStatus === 'i_rejected') return date ? `✗ Proposal Rejected on ${date}`  : '✗ Proposal Rejected';
    if (proposalStatus === 'they_sent')  return date ? `📩 Proposal Received on ${date}` : '📩 Proposal Received';
    return 'Profile Details';
  };
  // Presentation only: status pill classes for the heading.
  const headingClass = () => {
    if (proposalStatus === 'i_accepted') return 'pd-status is-accepted';
    if (proposalStatus === 'i_rejected') return 'pd-status is-rejected';
    if (proposalStatus === 'they_sent')  return 'pd-status is-received';
    if (proposalStatus === 'i_sent')     return 'pd-status is-sent';
    return '';
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  if (profileUnavailable) {
    return (
      <>
        <div className="inner-heading" style={{ backgroundImage: `url(${profilepics.titlebg})` }}>
          <div className="container">
            <h3>Profile Details</h3>
          </div>
        </div>
        <div className="inner-content pd-page">
          <div className="container">
            <div className="pd-alert pd-alert--info" style={{ textAlign: 'center' }}>
              <i className="fas fa-info-circle" aria-hidden="true"></i> This profile is not available.
              <div style={{ marginTop: 12 }}>
                <a href="/profiles" className="pd-btn">Back to profiles</a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const blockTip = iBlocked ? 'Unblock to use this' : undefined;
  const isOwnProfile = String(loggedInUserId) === String(uid);

  return (
    <>
      {/* Inner Heading */}
      <div className="inner-heading" style={{ backgroundImage: `url(${profilepics.titlebg})` }}>
        <div className="container">
          <h3 className={headingClass()}>{headingText()}</h3>
        </div>
      </div>

      {/* Inner Content */}
      <div className="inner-content pd-page">
        <div className="container">

          {/* Hero: photo + key facts */}
          <section className="pd-hero">
            <div className="pd-photo">
              <PhotoProvider>
                {/* No zoom for the "photo not available" placeholder */}
                {String(profileImage).includes('/uploads/') ? (
                  <PhotoView src={imageUrl(profileImage)}>
                    <img src={imageUrl(profileImage)} alt="Profile" data-gender={userDetails.ugender || ''} />
                  </PhotoView>
                ) : (
                  <img src={imageUrl(profileImage)} alt="Profile" data-gender={userDetails.ugender || ''} />
                )}
              </PhotoProvider>
            </div>
            <div className="pd-hero__info">
              <h3 className="pd-hero__name">{userDetails.ulname} Profile</h3>
              <ul className="pd-facts">
                <li><span>Profile Id </span>: MAT{userDetails.uid}</li>
                <li><span>Age </span>: {age} Years</li>
                <li><span>Height</span>: {userDetails.uheight || 'Not Available'} Feet</li>
                <li><span>Marital Status</span>: {userDetails.maritalstatus || 'Not Available'}</li>
                <li><i className="fas fa-map-marker-alt" aria-hidden="true"></i> {displayLocation(userDetails.jobcity) || 'Not Available'}</li>
              </ul>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="pd-actions">
            <ul className="pd-actions__list">
              {localStorage.getItem('isLoggedIn') === 'true' ? (
                <>
                  <li>
                    <a href="#"
                      className={`pd-action ${proposalTone()}${iBlocked ? ' pd-action--disabled' : ''}`}
                      title={blockTip}
                      aria-disabled={iBlocked ? 'true' : undefined}
                      data-toggle={canOpenModal && !iBlocked ? 'modal' : undefined}
                      data-target={canOpenModal && !iBlocked ? '#sendproposal' : undefined}
                      onClick={iBlocked ? (e) => e.preventDefault() : handleSendProposal}>
                      <i className="far fa-heart" aria-hidden="true"></i> {anchorLabel()}
                    </a>
                  </li>
                  <li>
                    <a href="#"
                      className={`pd-action ${messageTone()}${iBlocked ? ' pd-action--disabled' : ''}`}
                      title={blockTip}
                      aria-disabled={iBlocked ? 'true' : undefined}
                      data-toggle={canOpenMessageModal && !iBlocked ? 'modal' : undefined}
                      data-target={canOpenMessageModal && !iBlocked ? '#sendmessage' : undefined}
                      onClick={iBlocked ? (e) => e.preventDefault() : handleSendMessage}>
                      <i className="far fa-comment" aria-hidden="true"></i> {messageAnchorLabel()}
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a href="/login" className="pd-action">
                      <i className="far fa-heart" aria-hidden="true"></i> 🔒 Login to Send Proposal
                    </a>
                  </li>
                  <li>
                    <a href="/login" className="pd-action">
                      <i className="far fa-comment" aria-hidden="true"></i> 🔒 Login to Send Message
                    </a>
                  </li>
                </>
              )}
              <li>
                <a href="#"
                  className={`pd-action${iBlocked ? ' pd-action--disabled' : ''}`}
                  title={blockTip}
                  aria-disabled={iBlocked ? 'true' : undefined}
                  onClick={(e) => { e.preventDefault(); if (iBlocked) return; setShowContactDetailsModal(true); }}>
                  <i className="far fa-star" aria-hidden="true"></i> View Contact Details
                </a>
              </li>
              {localStorage.getItem('isLoggedIn') === 'true' && !isOwnProfile && !iBlocked && (
                <li>
                  <a href="#" className="pd-action pd-action--muted" onClick={handleBlock}>
                    <i className="fas fa-ban" aria-hidden="true"></i> Block User
                  </a>
                </li>
              )}
            </ul>
          </div>

          {iBlocked && (
            <div className="pd-alert pd-alert--warn" style={{ marginBottom: 16 }}>
              <i className="fas fa-ban" aria-hidden="true"></i>
              You have blocked this user.
              <button type="button" className="pd-btn" onClick={handleUnblock} disabled={blockBusy}>Unblock</button>
            </div>
          )}

          {/* Profile Content */}
          <div className="pd-body">
            {marriageSettled && (
              <div className="pd-alert pd-alert--warn" style={{ gridColumn: '1 / -1' }}>
                <i className="fas fa-ring"></i>
                {MARRIAGE_SETTLED_TEXT}
              </div>
            )}
            <aside className="pd-side">
              <div className="pd-card pd-intro">
                <h4 className="pd-card__title">Introduction</h4>
                <p className="pd-intro__text">{userDetails.about || 'Not Available'}</p>
              </div>
              <div className="pd-card pd-gallery">
                <h2 className="pd-card__title">Gallery</h2>
                {gallerydata.length > 0 ? (
                  <PhotoProvider index={currentIndex} onIndexChange={setCurrentIndex}>
                    <div className="pd-gallery__grid">
                      {gallerydata.map((res, idx) => (
                        <div className="pd-gallery__cell" key={res.id}>
                          <PhotoView src={imageUrl(res.imagepath)}>
                            <div className="pd-gallery__hit" onClick={() => setCurrentIndex(idx)}>
                              <img src={imageUrl(res.imagepath)} alt="Profile Gallery" data-gender={userDetails.ugender || ''} />
                              <div className="pd-gallery__zoom"><i className="fas fa-plus"></i></div>
                            </div>
                          </PhotoView>
                        </div>
                      ))}
                    </div>
                  </PhotoProvider>
                ) : (
                  <div className="pd-locked">
                    <i className="fas fa-lock" aria-hidden="true"></i>
                    <h3>Gallery Hidden</h3>
                    <p>Photos are hidden by the user. If you are interested in this profile, send a request to unlock them for you.</p>
                    <div className="pd-cta">
                      <a href="#" className="pd-btn" onClick={handleRequestPhotos}>
                        Request Photos
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {!isMobile && <div className="pd-ad"><img src={profilepics.leftads} alt="Made for Viswabrahmin families – Telugu Sambandham Matrimony" width="660" height="880" loading="lazy" decoding="async" /></div>}
            </aside>

            <div className="pd-main">
              <div className="pd-tabs-wrap">
                <ul className="nav nav-tabs pd-tabs" id="usertabs" role="tablist">
                  <li className="nav-item">
                    <a className="nav-link active pd-tab" id="overview-tab" data-toggle="tab" href="#overview" role="tab">
                      About {userDetails.ulname}
                    </a>
                  </li>
                </ul>
                <div className="tab-content pd-tab-content" id="usertabsContent">
                  <div className="tab-pane fade show active" id="overview" role="tabpanel">

                    {/* General Overview */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">General Overview</h4></div>
                      {/* pd-ord-N sets the mobile order (Name, Surname, Gender, Age,
                          On Behalf, DOB, TOB, Place of Birth, Height, Marital Status).
                          Desktop keeps the two-column layout unchanged. */}
                      <div className="pd-info__grid pd-info__grid--ordered">
                        <ul className="pd-info__list">
                          <li className="pd-ord-1"><span className="pd-info__key">NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.ulname || 'Not Available'}</span></li>
                          <li className="pd-ord-3"><span className="pd-info__key">GENDER</span><span className="pd-info__val">{userDetails.ugender || 'Not Available'}</span></li>
                          <li className="pd-ord-4"><span className="pd-info__key">AGE</span><span className="pd-info__val">{age}</span></li>
                          <li className="pd-ord-5"><span className="pd-info__key">ON BEHALF</span><span className="pd-info__val">{userDetails.ucreated || 'Not Available'}</span></li>
                          <li className="pd-ord-6"><span className="pd-info__key">DATE OF BIRTH</span><span className="pd-info__val">{userDetails.udob ? (userDetails.udob).split("/")[1]+'/'+(userDetails.udob).split("/")[0]+'/'+(userDetails.udob).split("/")[2] : 'Not Available'}</span></li>
                          <li className="pd-ord-8"><span className="pd-info__key">PLACE OF BIRTH</span><span className="pd-info__val">{displayLocation(userDetails.upob) || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li className="pd-ord-2"><span className="pd-info__key">SURNAME</span><span className="pd-info__val pd-info__val--name">{userDetails.ufname || 'Not Available'}</span></li>
                          {/* <li><span className="pd-info__key">EMAIL</span><span className="pd-info__val">{userDetails.uemail || 'Not Available'}</span></li> */}
                          
                          <li className="pd-ord-9"><span className="pd-info__key">HEIGHT</span><span className="pd-info__val">{userDetails.uheight || 'Not Available'} Feet</span></li>
                          <li className="pd-ord-10"><span className="pd-info__key">MARITAL STATUS</span><span className="pd-info__val">{userDetails.maritalstatus || 'Not Available'}</span></li>
                          <li className="pd-ord-7"><span className="pd-info__key">TIME OF BIRTH</span><span className="pd-info__val">{userDetails.utob || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Horoscope */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Horoscope Details</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">Nakshtra</span><span className="pd-info__val">{userDetails.nakshtra || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">RASI</span><span className="pd-info__val">{userDetails.rasi || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">PADAM</span><span className="pd-info__val">{userDetails.padam || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">GOTHRAM</span><span className="pd-info__val">{userDetails.gothram || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Qualification And Career</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">HIGHEST EDUCATION</span><span className="pd-info__val">{userDetails.degree || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">EDUCATION DETAIL</span><span className="pd-info__val">{userDetails.education_detail || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">ANNUAL INCOME</span><span className="pd-info__val">{userDetails.upackage || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">OCCUPATION</span><span className="pd-info__val">{userDetails.ujob || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">JOB DETAIL</span><span className="pd-info__val">{userDetails.job_detail || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">JOB LOCATION</span><span className="pd-info__val">{displayLocation(userDetails.jobcity) || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Family Background */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Family Background</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">FATHER NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.fathername || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">MOTHER NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.mothername || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">BROTHERS</span><span className="pd-info__val">{userDetails.brothers || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">SISTERS</span><span className="pd-info__val">{userDetails.sisters || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">CASTE</span><span className="pd-info__val">{userDetails.ucaste || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">FATHER OCCUPATION</span><span className="pd-info__val">{userDetails.fatheroccupation || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">MOTHER OCCUPATION</span><span className="pd-info__val">{userDetails.motheroccupation || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">BROTHERS MARRIED</span><span className="pd-info__val">{userDetails.brothersmarried || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">SISTERS MARRIED</span><span className="pd-info__val">{userDetails.sistersmarried || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">FAMILY RESIDENCE</span><span className="pd-info__val">{displayLocation(userDetails.familyresidence) || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Life Style */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Life Style</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">DIET</span><span className="pd-info__val">{userDetails.diet || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">SMOKE</span><span className="pd-info__val">{userDetails.habitsmoke || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">DRINK</span><span className="pd-info__val">{userDetails.habitdrink || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Partner Preferences */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Partner Preferences</h4></div>
                      <div className="pd-info__grid pd-info__grid--single">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__val pd-info__val--block">{userDetails.partnerpreferences || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
          {!isMobile && <div className="pd-ad pd-ad--wide"><img src={profilepics.bottomads} alt="Need help finding the right match? Chat with the Telugu Sambandham team on WhatsApp" width="2640" height="440" loading="lazy" decoding="async" /></div>}
        </div>
      </div>

      {/* ── Contact Details Modal ──────────────────────────────────────────────── */}
      {showContactDetailsModal && (
        <div className="pd-overlay" onClick={() => setShowContactDetailsModal(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal__head">
              <h5 className="pd-modal__title">
                <i className="far fa-address-card" aria-hidden="true"></i>
                Contact Details — {userDetails.ufname}
              </h5>
              <button type="button" onClick={() => setShowContactDetailsModal(false)} className="pd-modal__close" aria-label="Close">&times;</button>
            </div>
            <div className="pd-modal__body">

              {/* Not logged in */}
              {localStorage.getItem('isLoggedIn') !== 'true' && (
                <div className="pd-center">
                  <p className="pd-muted">Please login to view contact details.</p>
                  <div className="pd-cta"><a href="/login" className="pd-btn">Login Now</a></div>
                </div>
              )}

              {/* Logged in — before revealing */}
              {localStorage.getItem('isLoggedIn') === 'true' && !contactRevealed && (
                <>
                  {deniedMessage ? (
                    <div className="pd-alert pd-alert--warn">
                      <i className="fas fa-lock"></i>
                      {deniedMessage}
                    </div>
                  ) : (
                  <p className="pd-modal__text">
                    Viewing contact details will deduct <strong><del>₹20</del></strong> from your balance.
                    Click <strong><del>Pay Now</del></strong> to reveal the phone number and email address.
                  </p>
                  )}
                  {contactError && !(deniedMessage && ACCESS_REASONS.includes(contactErrorReason)) && (
                    <div className="pd-alert pd-alert--danger">
                      <i className="fas fa-times-circle"></i>
                      {contactError}
                      {/* Hidden-contact rule: one-tap link to fix it in Profile Security */}
                      {contactErrorReason === 'contact_hidden' && (
                        <div className="pd-alert__action">
                          <a
                            href="/profilesecurity"
                            onClick={(e) => { e.preventDefault(); setShowContactDetailsModal(false); navigate('/profilesecurity'); }}
                            className="pd-btn pd-btn--sm"
                          >
                            <i className="fas fa-shield-alt"></i> Go to Profile Security
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {!deniedMessage && (
                  <div className="pd-cta">
                    <a href="#"
                      onClick={(e) => { e.preventDefault(); handleRevealContact(); }}
                      className={`pd-btn pd-btn--unlock${contactLoading ? ' is-loading' : ''}`}>
                      {contactLoading ? '⏳ Loading...' : '💳 Unlock Contact (Free)'}
                    </a>
                  </div>
                  )}
                </>
              )}

              {/* Logged in — after revealing */}
              {localStorage.getItem('isLoggedIn') === 'true' && contactRevealed && contactInfo && (
                <>
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    Contact details revealed.
                  </div>
                  {marriageSettled && (
                    <div className="pd-alert pd-alert--warn">
                      <i className="fas fa-ring"></i>
                      {MARRIAGE_SETTLED_TEXT}
                    </div>
                  )}
                  <div className="pd-contact">
                    <h6 className="pd-contact__title">
                      <i className="far fa-user"></i>
                      {userDetails.ufname} {userDetails.ulname} — Contact Information
                    </h6>

                    {/* Phone */}
                    <div className="pd-contact__row">
                      <div className="pd-contact__icon pd-contact__icon--phone">
                        <i className="fas fa-phone"></i>
                      </div>
                      <div className="pd-contact__text">
                        <div className="pd-contact__label">PHONE NUMBER</div>
                        <div className="pd-contact__value">
                          {contactInfo.uphone
                            ? contactInfo.uphone
                            : <em className="pd-contact__hidden">Mobile number is hidden by user</em>
                          }
                        </div>
                      </div>
                      {contactInfo.uphone && (
                        <a href={`tel:${contactInfo.uphone}`} className="pd-chip pd-chip--phone">
                          Call Now
                        </a>
                      )}
                    </div>

                    {/* Alternate phone: only when present (same visibility as primary) */}
                    {contactInfo.ualtphone && (
                      <div className="pd-contact__row">
                        <div className="pd-contact__icon pd-contact__icon--phone">
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="pd-contact__text">
                          <div className="pd-contact__label">ALTERNATE PHONE</div>
                          <div className="pd-contact__value">{contactInfo.ualtphone}</div>
                        </div>
                        <a href={`tel:${contactInfo.ualtphone}`} className="pd-chip pd-chip--phone">
                          Call Now
                        </a>
                      </div>
                    )}

                    {/* Email */}
                    <div className="pd-contact__row">
                      <div className="pd-contact__icon pd-contact__icon--email">
                        <i className="far fa-envelope"></i>
                      </div>
                      <div className="pd-contact__text">
                        <div className="pd-contact__label">EMAIL ADDRESS</div>
                        <div className="pd-contact__value">
                          {contactInfo.uemail
                            ? contactInfo.uemail
                            : <em className="pd-contact__hidden">Email is hidden by user</em>
                          }
                        </div>
                      </div>
                      {contactInfo.uemail && (
                        <a href={`mailto:${contactInfo.uemail}`} className="pd-chip pd-chip--email">
                          Email Now
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="pd-modal__foot">
                    <button
                      type="button"
                      onClick={() => setShowContactDetailsModal(false)}
                      className="pd-close-btn">
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Send Proposal Modal ───────────────────────────────────────────────── */}
      <div className="modal fade pd-bs-modal" id="sendproposal" tabIndex="-1" role="dialog" aria-labelledby="proposalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="proposalLabel">Send Proposal to {userDetails.ufname}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="pd-modal-inner">
                {proposalStatus === 'they_sent' && (
                  <div className="pd-alert pd-alert--info">
                    <i className="fas fa-info-circle"></i>
                    {userDetails.ulname} has already sent you a proposal. Please accept or reject it from your notification bell 🔔.
                  </div>
                )}
                {proposalStatus === 'i_sent' && proposalMessage === 'Proposal sent successfully!' && (
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    Proposal sent successfully to {userDetails.ulname}! Waiting for response.
                  </div>
                )}
                {proposalStatus === 'i_sent' && proposalMessage !== 'Proposal sent successfully!' && (
                  <div className="pd-alert pd-alert--warn">
                    <i className="fas fa-clock"></i>
                    Your proposal is pending. Waiting for {userDetails.ulname} to respond.
                  </div>
                )}
                {proposalStatus === 'i_accepted' && (
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    🎉 {userDetails.ulname} has accepted your proposal!
                  </div>
                )}
                {proposalStatus === 'i_rejected' && (
                  <div className="pd-alert pd-alert--danger">
                    <i className="fas fa-times-circle"></i>
                    {userDetails.ulname} has rejected your proposal.
                  </div>
                )}
                {proposalStatus === 'error' && (
                  <div className="pd-alert pd-alert--danger">
                    <i className="fas fa-times-circle"></i>
                    {proposalMessage}
                  </div>
                )}
                {(proposalStatus === 'idle' || proposalStatus === 'sending') && (
                  <p className="pd-modal-text">Sending Proposal will deduct <strong>1 credit</strong> from your package.</p>
                )}
                <div className="pd-modal-foot">
                  <input type="button" value={proposalButtonLabel()} className="btn pd-send-btn"
                    onClick={handleSendProposal} disabled={proposalButtonDisabled} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Send Message Modal ────────────────────────────────────────────────── */}
      <div className="modal fade pd-bs-modal" id="sendmessage" tabIndex="-1" role="dialog" aria-labelledby="messageLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="messageLabel">Send Message to {userDetails.ufname}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="pd-modal-inner">
                {messageStatus === 'sent' && (
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    Message sent successfully to {userDetails.ulname}!
                  </div>
                )}
                {messageStatus === 'error' && messageText && (
                  <div className="pd-alert pd-alert--danger">
                    <i className="fas fa-times-circle"></i>
                    {messageText}
                  </div>
                )}
                {(messageStatus === 'idle' || messageStatus === 'sending') && (
                  <>
                    <p className="pd-modal-text">Sending Message will deduct <strong>1 credit</strong> from your package.</p>
                    <div className="pd-preview">
                      <strong className="pd-preview__label">
                        <i className="far fa-comment-alt"></i>
                        Message Preview:
                      </strong>
                      Hi {userDetails.ulname}, I liked your profile and would be happy to connect. Your profile matches my preferences. I look forward to hearing from you.
                    </div>
                  </>
                )}
                <div className="pd-modal-foot">
                  <input type="button" value={messageButtonLabel()} className="btn pd-send-btn"
                    onClick={handleSendMessage} disabled={messageButtonDisabled} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDetails;
