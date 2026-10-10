import React, { useState, useEffect } from 'react'
import { Download, Share2, X, Smartphone, Check } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already running as installed PWA
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(inStandalone)
    if (inStandalone) return

    // Check if dismissed previously during this session
    if (sessionStorage.getItem('aeromate_pwa_dismissed') === 'true') {
      return
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua)
    if (isIosDevice && isSafari) {
      setIsIOS(true)
      setShowPrompt(true)
    }

    // Android / Chromium beforeinstallprompt listener
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }

    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.warn('Install prompt error:', err)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('aeromate_pwa_dismissed', 'true')
  }

  if (isStandalone || !showPrompt) return null

  return (
    <>
      {/* Floating Mobile Install Bar */}
      <aside aria-label="Install AeroMate App" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="bg-[#1A1A1A]/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D0D0D] to-[#2A2A2A] border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-white text-base">✈</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                Install AeroMate App
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                  PWA
                </span>
              </h2>
              <p className="text-[11px] text-[#A0A0A0] truncate">
                {isIOS ? 'Add to Home Screen for full screen mode' : 'Fast access & offline cached flight dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-white hover:bg-neutral-200 text-[#0D0D0D] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 active:scale-95"
            >
              {isIOS ? <Share2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isIOS ? 'Guide' : 'Install'}</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="p-1.5 text-[#888] hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Manual Installation Helper Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/15 text-white w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Install on iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-neutral-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Open this page in <strong>Safari</strong> on your iPhone.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Tap the <strong className="text-white">Share</strong> button <span className="inline-block px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">⎋</span> in the Safari navigation bar.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> with the <span className="inline-block px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">➕</span> icon.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>Tap <strong className="text-white">Add</strong> in the top right corner. AeroMate will launch like a native mobile app!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 bg-white text-[#0D0D0D] font-bold text-xs rounded-xl hover:bg-neutral-200 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}
