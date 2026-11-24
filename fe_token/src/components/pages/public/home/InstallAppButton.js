import React, { useEffect, useState } from 'react';
import { getInstallState, promptInstall, subscribeInstall } from '../../../../utils/pwaInstall';

// "Install App" floating button (Home page, part of the ContactFab stack).
// - Chrome / Edge / Android: opens the browser's install dialog.
// - iPhone / iPad Safari: no install API, so we show "Share → Add to Home Screen" steps.
// - Already installed, or a browser that can't install: button is hidden.
const InstallAppButton = () => {
  const [state, setState] = useState(getInstallState);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const update = () => setState(getInstallState());
    update(); // the prompt may have arrived before this component mounted
    return subscribeInstall(update);
  }, []);

  useEffect(() => {
    if (!showIosHelp) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setShowIosHelp(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showIosHelp]);

  if (state.installed || (!state.canPrompt && !state.ios)) return null;

  const onClick = () => {
    if (state.canPrompt) promptInstall();
    else setShowIosHelp(true);
  };

  return (
    <>
      <button
        type="button"
        className="hp-fab__btn hp-fab__btn--install"
        onClick={onClick}
        aria-label="Install the TeluguSambandham app"
        title="Install App"
      >
        <i className="fas fa-download" aria-hidden="true" />
        <span className="hp-fab__label">Install App</span>
      </button>

      {showIosHelp && (
        <div
          className="hp-install-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hp-install-title"
          onClick={() => setShowIosHelp(false)}
        >
          <div className="hp-install-modal__box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hp-install-modal__close"
              aria-label="Close"
              onClick={() => setShowIosHelp(false)}
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
            <img src="/logo192.png" alt="" className="hp-install-modal__icon" width="64" height="64" />
            <h2 id="hp-install-title" className="hp-install-modal__title">Install TeluguSambandham</h2>
            <p className="hp-install-modal__text">Add the app to your Home Screen in two steps:</p>
            <ol className="hp-install-modal__steps">
              <li>
                Tap the <strong>Share</strong> button{' '}
                <i className="fas fa-share-square" aria-hidden="true" /> in Safari.
              </li>
              <li>
                Choose <strong>Add to Home Screen</strong>{' '}
                <i className="far fa-plus-square" aria-hidden="true" />, then tap <strong>Add</strong>.
              </li>
            </ol>
            <button type="button" className="hp-install-modal__ok" onClick={() => setShowIosHelp(false)}>
              OK, got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppButton;
