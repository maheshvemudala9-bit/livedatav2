


import React, { useEffect, useState, useRef, useCallback } from 'react';
import Profiles from '../../templates/ImagesLoader';
import Sidebar from './templates/Sidebar';
import '../../../assets/css/message.css';
import '../../../assets/css/pages/messages.css';
import { useNavigate } from 'react-router-dom';
import { imageUrl, approvedProfileImage } from '../../../utils/imageUrl';
import { placeholderFor } from '../../../utils/placeholders';
import {
  fetchInbox as fetchInboxService,
  fetchMessages as fetchMessagesService,
  sendMessage as sendMessageService,
  deleteMessage as deleteMessageService
} from '../../../services/messageService';
import { blockUser, unblockUser, getBlockStatus, fetchUserGallery } from '../../../services/userService';


const Messages = () => {

const userId = Number(localStorage.getItem('userId'));
  // ─── State ───────────────────────────────────────────────────────────────
  const [inbox,           setInbox]           = useState([]);
  const [inboxLoading,    setInboxLoading]    = useState(true);
  const [searchText,      setSearchText]      = useState('');
  const [activeConv,      setActiveConv]      = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage,      setNewMessage]      = useState('');
  const [sending,         setSending]         = useState(false);
  const [flashMsg,        setFlashMsg]        = useState('');
  const [blockStatus,     setBlockStatus]     = useState({ iBlocked: false, blockedMe: false });
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [blockBusy,       setBlockBusy]       = useState(false);
  // Logged-in user's own avatar for sent bubbles: approved profile photo (thumb),
  // otherwise the gender placeholder.
  const myGender = localStorage.getItem('userGender') || '';
  const [myPic,           setMyPic]           = useState(() => placeholderFor(myGender));

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    fetchUserGallery(userId)
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        const p = approvedProfileImage(rows);
        const src = p ? (imageUrl(p.imagepath_thumb) || imageUrl(p.imagepath)) : null;
        if (alive && src) setMyPic(src);
      })
      .catch(() => { /* keep placeholder */ });
    return () => { alive = false; };
  }, [userId]);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const menuWrapRef          = useRef(null);
  const inputRef             = useRef(null);
  const pollingRef           = useRef(null);
  const activeConvRef        = useRef(null);
  const messagesContainerRef = useRef(null);
  const flashTimerRef        = useRef(null);

  const navigate = useNavigate();

  const viewUserProfile = () => {
    if (activeConv?.other_user_id) {
      navigate(`/profiledetails/${activeConv.other_user_id}`);
    }
  };

  // Keep activeConvRef in sync
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // ─── Scroll chat to bottom ────────────────────────────────────────────────
  const scrollChatToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, []);

  // ─── Check if near bottom ─────────────────────────────────────────────────
  const isChatNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  }, []);

  // ─── Fetch Inbox ──────────────────────────────────────────────────────────
  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetchInboxService(userId);
      if (res.data.status === 'Success') setInbox(res.data.data || []);
    } catch (err) { console.error('[CHAT] fetchInbox:', err); }
    finally { setInboxLoading(false); }
  }, [userId]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  // ─── Fetch Messages ───────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (otherUserId, isInitial = false) => {
    if (!otherUserId) return;
    if (isInitial) { setMessagesLoading(true); setMessages([]); }
    try {
      const res = await fetchMessagesService(userId, otherUserId, 1, 100);
      // Fetching marks messages read server-side: refresh the bottom-nav badge.
      if (isInitial) {
        window.dispatchEvent(new CustomEvent('unread-messages-changed'));
        // Opening the chat marked its messages read: clear the row's unread state.
        setInbox(prev => prev.map(c =>
          c.other_user_id === otherUserId ? { ...c, unread_count: 0 } : c));
      }
      // The other user has blocked me: this conversation is no longer available.
      if (res.data.status === 'Failure' && res.data.reason === 'not_available') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setActiveConv(null);
        setMessages([]);
        fetchInbox();
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        setFlashMsg('This conversation is no longer available.');
        flashTimerRef.current = setTimeout(() => setFlashMsg(''), 2500);
        return;
      }
      if (res.data.status === 'Success') {
        const newMsgs = res.data.data || [];
        if (typeof res.data.iBlocked === 'boolean') {
          setBlockStatus(s => (s.iBlocked === res.data.iBlocked ? s : { ...s, iBlocked: res.data.iBlocked }));
        }
        if (isInitial) {
          setMessages(newMsgs);
          setTimeout(() => scrollChatToBottom(), 80);
          fetchInbox();
        } else {
          setMessages(prev => {
            if (prev.length !== newMsgs.length) {
              if (isChatNearBottom()) setTimeout(() => scrollChatToBottom(), 80);
              fetchInbox();
              return newMsgs;
            }
            return prev;
          });
        }
      }
    } catch (err) { console.error('[CHAT] fetchMessages:', err); }
    finally { if (isInitial) setMessagesLoading(false); }
  }, [userId, fetchInbox, scrollChatToBottom, isChatNearBottom]);

  // ─── Open Conversation ────────────────────────────────────────────────────
  const openConversation = (conv) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setActiveConv(conv);
    setBlockStatus({ iBlocked: false, blockedMe: false });
    setMenuOpen(false);
    getBlockStatus(conv.other_user_id)
      .then((res) => {
        // Ignore a stale answer if the user already switched conversation.
        if (activeConvRef.current?.other_user_id !== conv.other_user_id && activeConvRef.current) return;
        if (res.data?.status === 'Success' && res.data.data) setBlockStatus(res.data.data);
      })
      .catch((err) => console.error('[CHAT] getBlockStatus:', err));
    fetchMessages(conv.other_user_id, true);
    pollingRef.current = setInterval(() => {
      const current = activeConvRef.current;
      if (current?.other_user_id) fetchMessages(current.other_user_id, false);
    }, 5000);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Close the open chat (mobile back button) and return to the inbox list
  const closeConversation = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    // Messages read while the chat was open: refresh the bottom-nav badge now.
    window.dispatchEvent(new CustomEvent('unread-messages-changed'));
    setActiveConv(null);
  };

  // ─── Mobile: keep the open chat fitted to the visible area (keyboard) ─────
  const frameRef = useRef(null);
  const chatOpen = !!activeConv;
  useEffect(() => {
    if (!chatOpen) return undefined;
    const frame = frameRef.current;
    const mq = window.matchMedia('(max-width: 767px)');
    if (!frame || !mq.matches) return undefined;
    const vv = window.visualViewport;
    document.body.classList.add('msg-chat-open');
    let lastH = vv ? vv.height : window.innerHeight;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      const wasNearBottom = isChatNearBottom();
      frame.style.setProperty('--chat-vh', `${h}px`);
      frame.style.setProperty('--chat-top', `${top}px`);
      if (Math.abs(h - lastH) > 1 && wasNearBottom) scrollChatToBottom();
      lastH = h;
    };
    apply();
    const onFocusIn = (e) => {
      if (e.target && e.target.tagName === 'INPUT') {
        setTimeout(() => { if (window.scrollY !== 0) window.scrollTo(0, 0); apply(); }, 100);
      }
    };
    if (vv) {
      vv.addEventListener('resize', apply);
      vv.addEventListener('scroll', apply);
    } else {
      window.addEventListener('resize', apply);
    }
    frame.addEventListener('focusin', onFocusIn);
    return () => {
      document.body.classList.remove('msg-chat-open');
      if (vv) {
        vv.removeEventListener('resize', apply);
        vv.removeEventListener('scroll', apply);
      } else {
        window.removeEventListener('resize', apply);
      }
      frame.removeEventListener('focusin', onFocusIn);
      frame.style.removeProperty('--chat-vh');
      frame.style.removeProperty('--chat-top');
    };
  }, [chatOpen, isChatNearBottom, scrollChatToBottom]);

  // Stop polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ─── Call / video buttons: calls are not allowed, show a brief flash ─────
  const showFlash = (text) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMsg(text);
    flashTimerRef.current = setTimeout(() => setFlashMsg(''), 2500);
  };
  const handleCallClick  = () => showFlash('Calling is not allowed');
  const handleVideoClick = () => showFlash('Video calls are not allowed');

  // Clear flash timer on unmount
  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  // ─── Pause polling when tab hidden ───────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) clearInterval(pollingRef.current);
      } else {
        const conv = activeConvRef.current;
        if (conv?.other_user_id) {
          pollingRef.current = setInterval(() => {
            fetchMessages(activeConvRef.current?.other_user_id, false);
          }, 5000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchMessages]);

  // ─── Send Message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    if (blockStatus.iBlocked || blockStatus.blockedMe) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    const tempMsg = {
      id: `temp-${Date.now()}`, sender_id: userId,
      receiver_id: activeConv.other_user_id, message: text,
      message_type: 'text', is_read: false,
      created_at: new Date().toISOString(), _temp: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollChatToBottom(), 30);
    try {
      const res = await sendMessageService(userId, activeConv.other_user_id, text, 'text');
      if (res.data.status === 'Success') {
        setMessages(prev => prev.map(m => m._temp ? { ...res.data.data } : m));
        fetchInbox();
      } else {
        // Rejected by the server (e.g. blocked): drop the optimistic message.
        setMessages(prev => prev.filter(m => !m._temp));
        if (res.data.reason === 'you_blocked') {
          setBlockStatus(s => ({ ...s, iBlocked: true }));
        } else {
          setNewMessage(text);
          showFlash(res.data.result || 'Message could not be sent.');
        }
      }
    } catch (err) {
      console.error('[CHAT] sendMessage:', err);
      setMessages(prev => prev.filter(m => !m._temp));
      setNewMessage(text);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ─── Block / Unblock from the chat menu ───────────────────────────────────
  const handleBlockFromChat = async () => {
    if (!activeConv || blockBusy) return;
    setMenuOpen(false);
    if (!window.confirm(`Block ${activeConv.other_fname}? They won't be able to see your profile or message you.`)) return;
    setBlockBusy(true);
    try {
      const res = await blockUser(activeConv.other_user_id);
      if (res.data.status === 'Success') {
        setBlockStatus(s => ({ ...s, iBlocked: true }));
        showFlash('User blocked.');
      } else {
        showFlash(res.data.result || 'Could not block this user.');
      }
    } catch (err) {
      console.error('[CHAT] blockUser:', err);
      showFlash('Could not block this user.');
    } finally { setBlockBusy(false); }
  };

  const handleUnblockFromChat = async () => {
    if (!activeConv || blockBusy) return;
    setMenuOpen(false);
    if (!window.confirm(`Unblock ${activeConv.other_fname}?`)) return;
    setBlockBusy(true);
    try {
      const res = await unblockUser(activeConv.other_user_id);
      if (res.data.status === 'Success') {
        setBlockStatus(s => ({ ...s, iBlocked: false }));
        showFlash('User unblocked.');
      } else {
        showFlash(res.data.result || 'Could not unblock this user.');
      }
    } catch (err) {
      console.error('[CHAT] unblockUser:', err);
      showFlash('Could not unblock this user.');
    } finally { setBlockBusy(false); }
  };

  // Close the three-dots menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // ─── Delete Message ───────────────────────────────────────────────────────
  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await deleteMessageService(messageId, userId);
      if (res.data.status === 'Success') {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err) { console.error('[CHAT] deleteMessage:', err); }
  };

  // ─── Formatters ───────────────────────────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return ''; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d         = new Date(dateStr);
      const today     = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString())     return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const groupedMessages = () => {
    const groups = {};
    messages.forEach(m => {
      const date = formatDate(m.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  };

  const filteredInbox = inbox.filter(conv => {
    const name = `${conv.other_fname || ''} ${conv.other_lname || ''}`.toLowerCase();
    return name.includes(searchText.toLowerCase());
  });

  // ── Profile pic helper — uses thumb for small icons ───────────────────────
  // imagepath_thumb → tiny 150×150 → perfect for inbox list + chat bubbles
  // Falls back to imagepath if thumb not yet generated (old records)
  const getProfilePic = (conv) => {
    if (!conv?.other_profile_pic) return placeholderFor(conv?.other_gender);
    return imageUrl(conv.other_profile_pic_thumb)
        || imageUrl(conv.other_profile_pic)
        || placeholderFor(conv?.other_gender);
  };

  // ── Active chat header pic — medium is better for header ──────────────────
  const getHeaderPic = (conv) => {
    if (!conv?.other_profile_pic) return placeholderFor(conv?.other_gender);
    return imageUrl(conv.other_profile_pic_medium)
        || imageUrl(conv.other_profile_pic)
        || placeholderFor(conv?.other_gender);
  };

  // ── Chat bubble sender pic — thumb is enough for small avatar ─────────────
  const getBubblePic = (conv) => {
    if (!conv?.other_profile_pic) return placeholderFor(conv?.other_gender);
    return imageUrl(conv.other_profile_pic_thumb)
        || imageUrl(conv.other_profile_pic)
        || placeholderFor(conv?.other_gender);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container"><h3>Messages & Chats</h3></div>
      </div>

      <div className="inner-content msg-page">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />
              <div className="col-lg-8 col-md-8">
                <div ref={frameRef} className={`msg-frame ${activeConv ? 'is-chat-open' : ''}`}>

                  {/* ── LEFT PANEL — Inbox list ─────────────────────────────── */}
                  <div className="msg-list-panel">
                    <div className="msg-search">
                      <label htmlFor="search-input">
                        <i className="fa fa-search"></i>
                      </label>
                      <input
                        id="search-input" type="text"
                        placeholder="Search contacts..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                      />
                    </div>

                    <div className="msg-contacts">
                      {inboxLoading && <div className="msg-state">Loading...</div>}
                      {!inboxLoading && filteredInbox.length === 0 && (
                        <div className="msg-state">
                          {searchText ? 'No contacts found.' : 'No conversations yet.'}
                        </div>
                      )}
                      <ul className="msg-contact-list">
                        {filteredInbox.map(conv => {
                          const isActive     = activeConv?.conversation_id === conv.conversation_id;
                          const hasUnread    = Number(conv.unread_count) > 0;
                          const isLastFromMe = Number(conv.last_message_sender_id) === userId;

                          return (
                            <li
                              key={conv.conversation_id}
                              className={`msg-contact ${isActive ? 'is-active' : ''} ${hasUnread ? 'msg-contact--unread' : ''}`}
                              onClick={() => openConversation(conv)}
                            >
                              <div className="msg-contact__wrap">
                                <span className={`msg-status msg-status--${conv.other_status || 'offline'}`}></span>
                                {/* ✅ Inbox list — thumb (150×150) — tiny icon */}
                                <img
                                  className="msg-contact__avatar"
                                  src={getProfilePic(conv)}
                                  alt={conv.other_fname}
                                  data-gender={conv.other_gender || ''}
                                  onError={e => { e.target.src = placeholderFor(conv.other_gender); }}
                                />
                                <div className="msg-contact__meta">
                                  <p className="msg-contact__name user-name">{conv.other_fname} {conv.other_lname}</p>
                                  <p className="msg-contact__preview">
                                    {isLastFromMe && <span>You: </span>}
                                    {conv.last_message_type === 'image' ? '📷 Photo' :
                                     conv.last_message_type === 'file'  ? '📎 File'  :
                                     conv.last_message || 'Start a conversation'}
                                  </p>
                                </div>
                                {hasUnread && (
                                  <span className="msg-unread">
                                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                    <span className="msg-sr-only"> unread messages</span>
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  {/* ── End Left Panel ── */}

                  {/* ── RIGHT PANEL — Active chat ───────────────────────────── */}
                  <div className="msg-chat">
                    {!activeConv ? (
                      <div className="msg-placeholder">
                        <span className="msg-placeholder__icon">
                          <i className="far fa-comment"></i>
                        </span>
                        <p>Select a conversation to start chatting</p>
                      </div>
                    ) : (
                      <>
                        {/* Chat Header */}
                        <div className="msg-chat__head">
                          {/* Mobile-only back button (hidden on desktop via CSS) */}
                          <button
                            type="button"
                            className="msg-back"
                            onClick={closeConversation}
                            aria-label="Back to conversations"
                            title="Back to conversations"
                          >
                            <i className="fa fa-arrow-left" aria-hidden="true"></i>
                          </button>
                          {/* ✅ Header — medium (600×800) — larger display */}
                          <img
                            className="msg-chat__avatar"
                            src={getHeaderPic(activeConv)}
                            alt={activeConv.other_fname}
                            onClick={viewUserProfile}
                            data-gender={activeConv.other_gender || ''}
                            onError={e => { e.target.src = placeholderFor(activeConv.other_gender); }}
                          />
                          <div className="msg-chat__who">
                            <p
                              className="msg-chat__name user-name"
                              onClick={viewUserProfile}
                            >
                              {activeConv.other_fname} {activeConv.other_lname}
                            </p>
                          </div>
                          <div className="msg-chat__tools">
                            <button
                              type="button"
                              className="msg-chat__tool"
                              onClick={handleCallClick}
                              aria-label="Voice call"
                              title="Voice call"
                            >
                              <i className="fa fa-phone" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              className="msg-chat__tool"
                              onClick={handleVideoClick}
                              aria-label="Video call"
                              title="Video call"
                            >
                              <i className="fa fa-video-camera" aria-hidden="true"></i>
                            </button>
                            <div className="msg-chat__menu-wrap" ref={menuWrapRef}>
                              <button
                                type="button"
                                className="msg-chat__tool"
                                onClick={() => setMenuOpen(o => !o)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                aria-label="More options"
                                title="More options"
                              >
                                <i className="fa fa-ellipsis-v" aria-hidden="true"></i>
                              </button>
                              {menuOpen && (
                                <ul className="msg-chat__menu" role="menu">
                                  <li role="none">
                                    <button type="button" role="menuitem" className="msg-chat__menu-item"
                                      onClick={() => { setMenuOpen(false); viewUserProfile(); }}>
                                      <i className="fa fa-user" aria-hidden="true"></i> View Profile
                                    </button>
                                  </li>
                                  <li role="none">
                                    {blockStatus.iBlocked ? (
                                      <button type="button" role="menuitem" className="msg-chat__menu-item"
                                        onClick={handleUnblockFromChat} disabled={blockBusy}>
                                        <i className="fa fa-ban" aria-hidden="true"></i> Unblock User
                                      </button>
                                    ) : (
                                      <button type="button" role="menuitem" className="msg-chat__menu-item"
                                        onClick={handleBlockFromChat} disabled={blockBusy}>
                                        <i className="fa fa-ban" aria-hidden="true"></i> Block User
                                      </button>
                                    )}
                                  </li>
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Messages area */}
                        <div className="msg-thread" ref={messagesContainerRef}>
                          <ul className="msg-messages">
                            {messagesLoading && messages.length === 0 && (
                              <li className="msg-state">
                                Loading messages...
                              </li>
                            )}
                            {!messagesLoading && messages.length === 0 && (
                              <li className="msg-state">
                                No messages yet. Say hello! 👋
                              </li>
                            )}

                            {Object.entries(groupedMessages()).map(([date, msgs]) => (
                              <React.Fragment key={date}>
                                {/* Date separator */}
                                <li className="msg-day">
                                  <span>
                                    {date}
                                  </span>
                                </li>

                                {msgs.map(msg => {
                                  const isSent = Number(msg.sender_id) === userId;
                                  return (
                                    <li
                                      key={msg.id}
                                      className={`msg-row ${isSent ? 'msg-row--sent' : 'msg-row--recv'}`}
                                    >
                                      {/* ✅ Chat bubble avatar — thumb (150×150) — tiny */}
                                      <img
                                        className="msg-row__avatar"
                                        src={isSent
                                          ? myPic
                                          : getBubblePic(activeConv)
                                        }
                                        alt=""
                                        data-gender={isSent ? (localStorage.getItem('userGender') || '') : (activeConv.other_gender || '')}
                                        onError={e => { e.target.src = placeholderFor(isSent ? localStorage.getItem('userGender') : activeConv.other_gender); }}
                                      />
                                      <p className="msg-bubble">
                                        {msg.message_type === 'image' ? (
                                          <img
                                            className="msg-bubble__img"
                                            src={imageUrl(msg.message)}
                                            alt="attachment"
                                          />
                                        ) : (
                                          <span>{msg.message}</span>
                                        )}
                                        <span className="msg-meta">
                                          {formatTime(msg.created_at)}
                                          {isSent && (
                                            <span className="msg-tick">
                                              {msg.is_read ? '✓✓' : '✓'}
                                            </span>
                                          )}
                                        </span>
                                      </p>
                                      {isSent && !msg._temp && (
                                        <button
                                          type="button"
                                          onClick={() => handleDelete(msg.id)}
                                          className="msg-del"
                                          aria-label="Delete message"
                                          title="Delete message"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      )}
                                    </li>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </ul>
                        </div>

                        {/* Input (replaced by a banner while blocked either way) */}
                        {blockStatus.iBlocked ? (
                          <div className="msg-composer msg-composer--blocked">
                            <span><i className="fa fa-ban" aria-hidden="true"></i> You have blocked this user.</span>
                            <button type="button" className="msg-unblock-btn"
                              onClick={handleUnblockFromChat} disabled={blockBusy}>Unblock</button>
                          </div>
                        ) : blockStatus.blockedMe ? (
                          <div className="msg-composer msg-composer--blocked">
                            <span>You can't reply to this conversation.</span>
                          </div>
                        ) : (
                        <div className="msg-composer">
                          <div className="msg-composer__wrap">
                            <i className="fa fa-paperclip msg-composer__clip" aria-hidden="true"></i>
                            <input
                              ref={inputRef}
                              className="msg-composer__input"
                              type="text"
                              placeholder="Write your message..."
                              value={newMessage}
                              onChange={e => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              disabled={sending}
                            />
                            <button
                              type="button"
                              className="msg-send"
                              onClick={handleSend}
                              disabled={sending || !newMessage.trim()}
                              aria-label="Send message"
                            >
                              <i className="fa fa-paper-plane"></i>
                            </button>
                          </div>
                        </div>
                        )}
                      </>
                    )}
                  </div>
                  {/* ── End Right Panel ── */}

                  {/* ── Flash message (call / video not allowed) ── */}
                  {flashMsg && (
                    <div className="msg-flash" role="status" aria-live="polite">
                      {flashMsg}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages;
