import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome
import './index.css';
import App from './App';
// Modern theme — imported after App so it overrides the legacy stylesheets.
import './assets/css/theme.css';
import reportWebVitals from './reportWebVitals';
import { installImageFallback } from './utils/imageFallback';
import { setupPwa } from './utils/pwaInstall';

// Broken member photos anywhere on the site show the "not available" image.
installImageFallback();
// "Install as app": capture the browser install prompt + register the service worker.
setupPwa();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
