import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Lock, Unlock, Plus, Search, Filter, RefreshCw,
  HardDriveDownload, Wifi, WifiOff, FileText, Plane, Calendar,
  CreditCard, UserCheck, AlertTriangle, CheckCircle2, ChevronRight,
  Trash2, KeyRound, ArrowUpRight, Sparkles, AlertCircle
} from 'lucide-react'
import {
  getWalletDocuments,
  saveWalletDocument,
  deleteWalletDocument
} from '../services/api'
import {
  saveDocumentOffline,
  getOfflineDocumentsList,
  getOfflineDocument,
  removeOfflineDocument,
  clearAllOfflineWalletData,
  isWalletPinSet
} from '../services/walletStorage'
import AddDocumentModal from '../components/wallet/AddDocumentModal'
import DocumentViewerModal from '../components/wallet/DocumentViewerModal'
import WalletLockOverlay from '../components/wallet/WalletLockOverlay'

export default function WalletPage({ user, token }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [documents, setDocuments] = useState([])
  const [offlineDocIds, setOfflineDocIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [offlineOnlyFilter, setOfflineOnlyFilter] = useState(false)

  // Security Lock
  const [isLocked, setIsLocked] = useState(false)
  const [showLockOverlay, setShowLockOverlay] = useState(false)
  const [isSettingPin, setIsSettingPin] = useState(false)
  const [activePin, setActivePin] = useState(null)
  const [isPinSetupOnDevice, setIsPinSetupOnDevice] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewingDoc, setViewingDoc] = useState(null)

  // Inactivity & Background Lock Timer
  const inactivityTimerRef = useRef(null)

  // Listen to online/offline network changes
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check device PIN configuration
  useEffect(() => {
    isWalletPinSet().then(hasPin => {
      setIsPinSetupOnDevice(hasPin)
      if (hasPin) {
        setIsLocked(true) // Lock by default on fresh entry if PIN is configured
      }
    })
  }, [])

  // Auto-lock on app backgrounding (phone tab switch or home screen minimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPinSetupOnDevice) {
        setIsLocked(true)
        setActivePin(null)
        setViewingDoc(null)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isPinSetupOnDevice])

  // Inactivity timeout (locks after 3 minutes of no interaction)
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (isPinSetupOnDevice && !isLocked) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsLocked(true)
        setActivePin(null)
        setViewingDoc(null)
      }, 180000) // 3 minutes
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', resetInactivityTimer)
    window.addEventListener('touchstart', resetInactivityTimer)
    window.addEventListener('keydown', resetInactivityTimer)
    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer)
      window.removeEventListener('touchstart', resetInactivityTimer)
      window.removeEventListener('keydown', resetInactivityTimer)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  }, [isPinSetupOnDevice, isLocked])

  // Fetch documents from cloud API or offline IndexedDB strictly for the authenticated user
  const loadDocuments = async () => {
    if (!user || !token) {
      setDocuments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      // 1. Check local IndexedDB offline store filtered strictly by authenticated user ID
      const offlineList = await getOfflineDocumentsList(user.id)
      const offlineIds = new Set(offlineList.map(d => d.id))
      setOfflineDocIds(offlineIds)

      if (navigator.onLine) {
        try {
          const res = await getWalletDocuments(token)
          const cloudDocs = res.data || []
          setDocuments(cloudDocs)
        } catch (apiErr) {
          console.warn('API fetch failed, falling back to local offline documents:', apiErr)
          setDocuments(offlineList)
        }
      } else {
        // Pure offline mode
        setDocuments(offlineList)
      }
    } catch (err) {
      console.error('Wallet load error:', err)
      setError('Unable to load wallet documents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && token) {
      loadDocuments()
    } else {
      setDocuments([])
      setLoading(false)
    }
  }, [user?.id, token])

  // Flash temporary success message
  const showToast = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false
      if (offlineOnlyFilter && !offlineDocIds.has(doc.id)) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = doc.title?.toLowerCase().includes(q)
        const matchType = doc.doc_type?.toLowerCase().includes(q)
        const matchCountry = doc.issuing_country?.toLowerCase().includes(q)
        const matchNotes = doc.notes?.toLowerCase().includes(q)
        const matchAirline = doc.flight_details?.airline?.toLowerCase().includes(q)
        const matchFlight = doc.flight_details?.flightNumber?.toLowerCase().includes(q)
        return matchTitle || matchType || matchCountry || matchNotes || matchAirline || matchFlight
      }
      return true
    })
  }, [documents, selectedCategory, offlineOnlyFilter, searchQuery, offlineDocIds])

  // Overview Counters
  const counters = useMemo(() => {
    return {
      total: documents.length,
      identity: documents.filter(d => d.category === 'identity').length,
      travel: documents.filter(d => d.category === 'travel').length,
      offline: offlineDocIds.size
    }
  }, [documents, offlineDocIds])

  // Save new document handler with strict per-user ownership
  const handleSaveDocument = async (docData) => {
    if (!user || !token) {
      setError('Please sign in to save documents to your Travel Wallet.')
      return
    }
    try {
      let savedDoc = null
      const docPayload = {
        ...docData,
        user_id: user.id
      }
      if (navigator.onLine) {
        const res = await saveWalletDocument(docPayload, token)
        savedDoc = res.data
      } else {
        // Save directly to local device offline storage if currently offline
        savedDoc = {
          ...docPayload,
          id: `local-doc-${Date.now()}`,
          created_at: new Date().toISOString()
        }
      }

      // If user enabled offline availability, encrypt and store in IndexedDB strictly with user.id
      if (docData.is_offline_available && savedDoc) {
        await saveDocumentOffline(savedDoc, activePin || '1234', user.id)
        setOfflineDocIds(prev => new Set([...prev, savedDoc.id]))
      }

      setDocuments(prev => [savedDoc, ...prev])
      showToast('Document securely added to your Travel Wallet.')
      setShowAddModal(false)
    } catch (err) {
      throw err
    }
  }

  // Toggle offline status for a document
  const handleToggleOffline = async (doc) => {
    try {
      if (offlineDocIds.has(doc.id)) {
        await removeOfflineDocument(doc.id)
        setOfflineDocIds(prev => {
          const next = new Set(prev)
          next.delete(doc.id)
          return next
        })
        showToast('Local offline copy removed from device storage.')
      } else {
        // Fetch full document with files if viewingDoc isn't complete
        await saveDocumentOffline(doc, activePin || '1234', user?.id)
        setOfflineDocIds(prev => new Set([...prev, doc.id]))
        showToast('Document encrypted and saved for offline access.')
      }
    } catch (err) {
      setError(err.message || 'Could not update offline status.')
    }
  }

  // Delete document
  const handleDeleteCloud = async (docId) => {
    try {
      if (navigator.onLine && token) {
        await deleteWalletDocument(docId, token)
      }
      // Also remove local offline copy if present
      await removeOfflineDocument(docId)
      setOfflineDocIds(prev => {
        const next = new Set(prev)
        next.delete(docId)
        return next
      })
      setDocuments(prev => prev.filter(d => d.id !== docId))
      setViewingDoc(null)
      showToast('Document removed from AeroMate Wallet.')
    } catch (err) {
      setError('Failed to delete document from cloud storage.')
    }
  }

  // Handle opening document viewer with PIN gate
  const handleOpenDocViewer = async (doc) => {
    if (isLocked) {
      setShowLockOverlay(true)
      return
    }

    // If offline and file details need decryption
    if (!navigator.onLine || !doc.files || doc.files.length === 0) {
      try {
        const decryptedOfflineDoc = await getOfflineDocument(doc.id, activePin || '1234', user?.id)
        setViewingDoc(decryptedOfflineDoc)
        return
      } catch (e) {
        // Fall back to standard doc representation
      }
    }
    setViewingDoc(doc)
  }

  // Strict Login Gate: If not authenticated, require login to access wallet or options
  if (!user || !token) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16 font-sans">
        <div className="bg-white border border-[#E5E5E0] rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] text-white mx-auto flex items-center justify-center shadow-md">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <Lock className="w-3.5 h-3.5" /> Authentication Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0D0D0D] tracking-tight">
              Sign In to Access Your Travel Wallet
            </h1>
            <p className="text-sm font-medium text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
              Your Travel Wallet stores private travel documents, boarding passes, and IDs. Each passenger has their own isolated, separate wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2 border-y border-[#F0F0EB]">
            <div className="p-3 bg-[#F5F5F0] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D0D0D]">
                <UserCheck className="w-4 h-4 text-emerald-600" /> Separate Wallets
              </div>
              <p className="text-[11px] text-[#6B6B6B] leading-tight">
                No user can view or access any other user's wallet documents.
              </p>
            </div>
            <div className="p-3 bg-[#F5F5F0] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D0D0D]">
                <KeyRound className="w-4 h-4 text-blue-600" /> Encrypted Vault
              </div>
              <p className="text-[11px] text-[#6B6B6B] leading-tight">
                AES-256 encrypted storage keeps all passports & tickets safe.
              </p>
            </div>
            <div className="p-3 bg-[#F5F5F0] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D0D0D]">
                <WifiOff className="w-4 h-4 text-purple-600" /> Offline Ready
              </div>
              <p className="text-[11px] text-[#6B6B6B] leading-tight">
                Instant access at airport gates even without mobile internet.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/login?redirect=/wallet"
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              Sign In to Your Account
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signup?redirect=/wallet"
              className="block w-full py-3 text-xs font-bold text-center border border-[#E5E5E0] bg-[#F5F5F0] hover:bg-[#EBEBE6] rounded-xl text-[#0D0D0D] transition-colors"
            >
              Create Free AeroMate Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6 animate-fade-in font-sans">
      {/* Top Header & Security Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0D0D0D]">
            Secure Travel Wallet
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Private Vault: Passenger ({(user?.email ? user.email.charAt(0) : (user?.name ? user.name.charAt(0) : 'P')).toUpperCase()})
            </span>
            <span className="text-xs text-[#6B6B6B]">| Isolated Storage</span>
          </div>
        </div>

        {/* Action Buttons: Add Document & PIN Lock */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isPinSetupOnDevice ? (
            <button
              onClick={() => {
                if (isLocked) {
                  setShowLockOverlay(true)
                } else {
                  setIsLocked(true)
                  setActivePin(null)
                  setViewingDoc(null)
                }
              }}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-3.5"
            >
              {isLocked ? <Lock className="w-3.5 h-3.5 text-brand-600" /> : <Unlock className="w-3.5 h-3.5 text-teal-600" />}
              {isLocked ? 'Unlock Wallet' : 'Lock Wallet'}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSettingPin(true)
                setShowLockOverlay(true)
              }}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-3.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              Set Device PIN
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-2.5 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </div>
      </div>

      {/* Notifications / Toast */}
      {successMsg && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl p-3 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-teal-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-navy-800">{counters.total}</div>
            <div className="text-[11px] text-slate-500">Total Stored Documents</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-navy-800">{counters.identity}</div>
            <div className="text-[11px] text-slate-500">Identity & Passports</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-navy-800">{counters.travel}</div>
            <div className="text-[11px] text-slate-500">Flight & Travel Passes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center flex-shrink-0">
            <HardDriveDownload className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-navy-800">{counters.offline}</div>
            <div className="text-[11px] text-slate-500">Encrypted Offline Ready</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Ribbon */}
      <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, country, flight number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs"
            />
          </div>

          {/* Quick Offline Only Toggle */}
          <button
            onClick={() => setOfflineOnlyFilter(!offlineOnlyFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation ${
              offlineOnlyFilter
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
            }`}
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            Offline Ready ({counters.offline})
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'identity', label: 'Identity & Passports' },
            { id: 'travel', label: 'Travel & Flights' },
            { id: 'other', label: 'Medical & Contacts' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                  : 'bg-[#FAFAF7] text-[#52524E] hover:text-[#0D0D0D] hover:bg-[#EAEAE5] border-[#E5E5E0]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Documents Grid */}
      {loading ? (
        <div className="bg-white border border-surface-200 rounded-3xl p-16 text-center space-y-3 shadow-sm">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-navy-800">Decoupling and verifying secure documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white border border-dashed border-surface-300 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center text-slate-400 mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-navy-800 text-lg">No Travel Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {searchQuery || selectedCategory !== 'all' || offlineOnlyFilter
                ? 'No documents matched your current search filters. Clear filters to see all stored items.'
                : 'Keep your passport, boarding passes, Aadhaar, visas, and flight tickets secure in one place, ready even with no network connection.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setOfflineOnlyFilter(false)
              setShowAddModal(true)
            }}
            className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Document Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => {
            const isOfflineAvailable = offlineDocIds.has(doc.id)
            const isFlight = doc.category === 'travel' && doc.flight_details

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-surface-200 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                        doc.category === 'identity'
                          ? 'bg-purple-50 text-purple-600 border border-purple-200'
                          : doc.category === 'travel'
                          ? 'bg-brand-50 text-brand-600 border border-brand-200'
                          : 'bg-teal-50 text-teal-600 border border-teal-200'
                      }`}>
                        {doc.category === 'travel' ? (
                          <Plane className="w-5 h-5" />
                        ) : doc.category === 'identity' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-display font-bold text-navy-800 text-sm line-clamp-1 group-hover:text-brand-600 transition-colors">
                          {doc.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {doc.doc_type?.replace(/_/g, ' ')} • {doc.issuing_country || 'IND'}
                        </span>
                      </div>
                    </div>

                    {/* Offline indicator */}
                    {isOfflineAvailable && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1"
                        title="Available offline in device encrypted store"
                      >
                        <HardDriveDownload className="w-3 h-3 text-teal-600" /> Offline
                      </span>
                    )}
                  </div>

                  {/* Flight Route Banner if Flight Doc */}
                  {isFlight && (
                    <div className="bg-surface-50 border border-surface-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-display font-bold text-navy-800">{doc.flight_details.origin}</span>
                        <span className="text-[10px] text-slate-400 block">Origin</span>
                      </div>
                      <div className="text-slate-300 flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 font-mono font-bold">
                          {doc.flight_details.flightNumber}
                        </span>
                        <div className="w-10 h-[1.5px] bg-surface-300 relative my-0.5">
                          <Plane className="w-2.5 h-2.5 text-brand-500 absolute -top-1 left-1/2 -translate-x-1/2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-bold text-navy-800">{doc.flight_details.destination}</span>
                        <span className="text-[10px] text-slate-400 block">Dest</span>
                      </div>
                    </div>
                  )}

                  {/* Masked ID Preview (Privacy Guard) */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">Masked Reference:</span>
                    <span className="font-mono font-semibold text-navy-800 bg-surface-100 px-2 py-0.5 rounded-lg text-[11px]">
                      {doc.masked_number || '•••• •••• Verified'}
                    </span>
                  </div>

                  {/* Expiry / Date note */}
                  {doc.expiry_date && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Expiry Date:</span>
                      <span className="text-[11px] font-medium text-slate-600">
                        {doc.expiry_date}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="border-t border-surface-100 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleOffline(doc)}
                    className={`p-2 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                      isOfflineAvailable
                        ? 'text-teal-700 hover:bg-teal-50'
                        : 'text-slate-400 hover:text-navy-700 hover:bg-surface-100'
                    }`}
                    title={isOfflineAvailable ? 'Stored locally' : 'Make available offline'}
                  >
                    <HardDriveDownload className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isOfflineAvailable ? 'Offline Ready' : 'Save Offline'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenDocViewer(doc)}
                    className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1 shadow-sm touch-manipulation"
                  >
                    View Document <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}



      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveDocument}
        isOffline={!online}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        onDeleteCloud={handleDeleteCloud}
        onToggleOffline={handleToggleOffline}
        isOfflineSaved={viewingDoc ? offlineDocIds.has(viewingDoc.id) : false}
      />

      {/* Wallet Security PIN Lock Overlay */}
      <WalletLockOverlay
        isOpen={showLockOverlay}
        onClose={() => {
          setShowLockOverlay(false)
          setIsSettingPin(false)
        }}
        isSettingNewPin={isSettingPin}
        onUnlocked={(pin) => {
          setIsLocked(false)
          setActivePin(pin)
          setShowLockOverlay(false)
          setIsSettingPin(false)
          setIsPinSetupOnDevice(true)
          showToast('Wallet unlocked successfully.')
        }}
      />
    </div>
  )
}
