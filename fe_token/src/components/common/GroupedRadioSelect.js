import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../assets/css/grouped-radio-select.css';
import { findInGroups } from '../../data/educationJob';

const MOBILE_QUERY = '(max-width: 767px)';

const isMobileNow = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY).matches
    : false;

const useIsMobile = () => {
  const [mobile, setMobile] = useState(isMobileNow);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); };
  }, []);
  return mobile;
};

/**
 * Grouped (category -> subcategory) radio picker.
 * Categories only expand/collapse; only subcategories can be selected.
 * Works controlled (value + onChange) or uncontrolled (renders a hidden input when `name` is set).
 */
const GroupedRadioSelect = ({
  groups,
  value,
  onChange,
  name,
  label,
  placeholder = 'Select',
  title,
  variant = 'form',
  hasError = false,
}) => {
  const uid = useId();
  const mobile = useIsMobile();
  const [inner, setInner] = useState(null);
  const current = value !== undefined ? value : inner;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [pos, setPos] = useState(null);
  const fieldRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  const hasValue = current !== null && current !== undefined && String(current).trim() !== '';
  const found = useMemo(() => (hasValue ? findInGroups(groups, current) : null), [groups, current, hasValue]);
  const legacy = hasValue && !found;
  const display = found ? found.sub.label : (hasValue ? String(current) : '');
  const heading = title || label || placeholder;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus && fieldRef.current) fieldRef.current.focus();
  }, []);

  const openPanel = () => {
    setExpanded(found ? { [found.category.name]: true } : {});
    setQuery('');
    setOpen(true);
  };

  // Position the desktop popover under the field (portal + fixed, so card overflow cannot clip it).
  const place = useCallback(() => {
    if (!fieldRef.current) return;
    const r = fieldRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const flip = below < 320 && above > below;
    const avail = Math.max(200, flip ? above : below);
    const width = Math.max(r.width, 320);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    setPos({
      left,
      width,
      maxHeight: Math.min(420, avail),
      ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || mobile) return undefined;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, mobile, place]);

  // Esc, click outside, body scroll lock (mobile), initial focus (desktop).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const onDown = (e) => {
      const t = e.target;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (fieldRef.current && fieldRef.current.contains(t)) return;
      close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    let prevOverflow;
    if (mobile) { prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    else if (searchRef.current) searchRef.current.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      if (mobile) document.body.style.overflow = prevOverflow;
    };
  }, [open, mobile, close]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!q) return groups.map((g) => ({ ...g, shown: g.subs }));
    return groups
      .map((g) => ({
        ...g,
        shown: g.name.toLowerCase().includes(q) ? g.subs : g.subs.filter((s) => s.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.shown.length > 0);
  }, [groups, q]);

  const choose = (v) => {
    if (value === undefined) setInner(v);
    if (onChange) onChange(v);
    if (!mobile) close();
  };

  const toggle = (catName) => setExpanded((prev) => ({ ...prev, [catName]: !prev[catName] }));

  const radioName = `grs-${uid}-sel`;
  const fieldClass = variant === 'mui'
    ? `grs-field grs-field--mui${open ? ' is-open' : ''}${hasValue ? ' has-value' : ''}${hasError ? ' is-error' : ''}`
    : `form-control grs-field${hasError ? ' sg-field--error' : ''}`;

  const panelBody = (
    <>
      <div className="grs-search">
        <input
          ref={searchRef}
          type="search"
          className="grs-search__input"
          placeholder="Search"
          aria-label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        />
      </div>
      <div className="grs-list">
        {visible.length === 0 && <div className="grs-empty">No matches</div>}
        {visible.map((g) => {
          const isOpen = q ? true : !!expanded[g.name];
          const catSelected = !!found && found.category.name === g.name;
          const bodyId = `grs-${uid}-${groups.findIndex((x) => x.name === g.name)}`;
          return (
            <div className="grs-cat" key={g.name}>
              <button
                type="button"
                className={`grs-cat__head${catSelected ? ' is-selected' : ''}`}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => toggle(g.name)}
              >
                <span className={`grs-radio${catSelected ? ' is-on' : ''}`} aria-hidden="true" />
                <span className="grs-cat__name">{g.name}</span>
                <span className={`grs-chev${isOpen ? ' is-open' : ''}`} aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="grs-cat__body" id={bodyId} role="radiogroup" aria-label={g.name}>
                  {g.shown.map((s) => (
                    <label className="grs-opt" key={s.value}>
                      <input
                        type="radio"
                        name={radioName}
                        value={s.value}
                        checked={!!found && found.sub.value === s.value}
                        onChange={() => choose(s.value)}
                        onClick={() => { if (!mobile && found && found.sub.value === s.value) close(); }}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  const panel = open && createPortal(
    mobile ? (
      <div className="grs-layer">
        <div className="grs-backdrop" onClick={() => close()} />
        <div className="grs-sheet" role="dialog" aria-label={heading} ref={panelRef}>
          <div className="grs-sheet__head">
            <span className="grs-sheet__title">{heading}</span>
            <button type="button" className="grs-done" onClick={() => close()}>Done</button>
          </div>
          {panelBody}
        </div>
      </div>
    ) : (
      <div
        className="grs-pop"
        role="dialog"
        aria-label={heading}
        ref={panelRef}
        style={pos || { visibility: 'hidden' }}
      >
        {panelBody}
      </div>
    ),
    document.body
  );

  return (
    <div className={`grs grs--${variant}`}>
      {name ? <input type="hidden" name={name} value={hasValue ? String(current) : ''} /> : null}
      <button
        type="button"
        ref={fieldRef}
        className={fieldClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openPanel())}
      >
        {variant === 'mui' && label ? <span className="grs-label">{label}</span> : null}
        <span className={`grs-value${display ? '' : ' is-placeholder'}`}>
          {display || (variant === 'mui' ? '' : placeholder)}
        </span>
        <span className="grs-caret" aria-hidden="true" />
      </button>
      {legacy && <div className="grs-hint">Please choose from the updated list.</div>}
      {panel}
    </div>
  );
};

export default GroupedRadioSelect;
