import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Explicitly ensure no Service Workers are registered
// This is critical to fix the "non-precached-url" error caused by stale SWs
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister()
        .then(() => console.log('Service Worker unregistered'))
        .catch(err => console.error('Service Worker unregister failed', err));
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
