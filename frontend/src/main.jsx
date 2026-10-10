import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Automatically register and update service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[AeroMate PWA] New version ready.')
  },
  onOfflineReady() {
    console.log('[AeroMate PWA] Cached for offline access.')
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
