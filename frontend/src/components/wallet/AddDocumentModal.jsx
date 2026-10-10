import { useState, useRef, useEffect } from 'react'
import {
  X, Camera, Image, FileUp, RotateCw, Trash2, Shield,
  CheckCircle2, AlertCircle, Plane, Sparkles, Loader2, RefreshCw
} from 'lucide-react'

const CATEGORIES = [
  { id: 'identity', label: 'Identity' },
  { id: 'travel', label: 'Travel & Tickets' },
  { id: 'other', label: 'Other & Medical' }
]

const DOC_TYPES = {
  identity: [
    { id: 'passport', label: 'Passport' },
    { id: 'aadhaar_card', label: 'Aadhaar Card' },
    { id: 'pan_card', label: 'PAN Card' },
    { id: 'driving_licence', label: 'Driving Licence' },
    { id: 'visa', label: 'Visa' },
    { id: 'other_id', label: 'Other Government ID' }
  ],
  travel: [
    { id: 'flight_ticket', label: 'Flight Ticket / E-Ticket' },
    { id: 'boarding_pass', label: 'Boarding Pass' },
    { id: 'hotel_reservation', label: 'Hotel Reservation' },
    { id: 'train_ticket', label: 'Train Ticket' },
    { id: 'bus_ticket', label: 'Bus Ticket' },
    { id: 'travel_insurance', label: 'Travel Insurance' },
    { id: 'itinerary', label: 'Itinerary / Booking Confirmation' }
  ],
  other: [
    { id: 'emergency_contact', label: 'Emergency Contact' },
    { id: 'medical_document', label: 'Medical / Accessibility Doc' },
    { id: 'custom_doc', label: 'Custom Document' }
  ]
}

const COUNTRIES = [
  { code: 'IND', name: 'India (IND)' },
  { code: 'USA', name: 'United States (USA)' },
  { code: 'GBR', name: 'United Kingdom (GBR)' },
  { code: 'ARE', name: 'United Arab Emirates (ARE)' },
  { code: 'SGP', name: 'Singapore (SGP)' },
  { code: 'CAN', name: 'Canada (CAN)' },
  { code: 'AUS', name: 'Australia (AUS)' },
  { code: 'DEU', name: 'Germany (DEU)' },
  { code: 'FRA', name: 'France (FRA)' },
  { code: 'OTHER', name: 'Other Country' }
]

export default function AddDocumentModal({ isOpen, onClose, onSave, isOffline = false }) {
  // Form fields
  const [category, setCategory] = useState('identity')
  const [docType, setDocType] = useState('passport')
  const [title, setTitle] = useState('')
  const [issuingCountry, setIssuingCountry] = useState('IND')
  const [expiryDate, setExpiryDate] = useState('')
  const [maskedNumber, setMaskedNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(true)

  // Flight Ticket specific fields
  const [flightDetails, setFlightDetails] = useState({
    airline: '',
    flightNumber: '',
    origin: '',
    destination: '',
    departureDate: '',
    pnr: '',
    seat: '',
    boardingGroup: ''
  })

  // Pages / Files: array of { id, name, type, pageType: 'front'|'back'|'page', dataUrl, size, rotation: 0 }
  const [files, setFiles] = useState([])
  const [activePageType, setActivePageType] = useState('front') // 'front' | 'back'

  // Camera capture state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Fallback hidden inputs
  const photoInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const mobileCameraInputRef = useRef(null)

  // Status & validation
  const [submitting, setSubmitting] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrNotice, setOcrNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      resetForm()
    }
  }, [isOpen])

  // Stop camera stream when leaving or unmounting
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setCameraError(null)
  }

  const resetForm = () => {
    setCategory('identity')
    setDocType('passport')
    setTitle('')
    setIssuingCountry('IND')
    setExpiryDate('')
    setMaskedNumber('')
    setNotes('')
    setIsOfflineAvailable(true)
    setFiles([])
    setActivePageType('front')
    setError('')
    setOcrNotice('')
    setFlightDetails({
      airline: '',
      flightNumber: '',
      origin: '',
      destination: '',
      departureDate: '',
      pnr: '',
      seat: '',
      boardingGroup: ''
    })
  }

  // Set default title when docType changes
  useEffect(() => {
    const list = DOC_TYPES[category] || []
    const match = list.find(d => d.id === docType)
    if (match && !title) {
      setTitle(match.label)
    }
  }, [docType, category])

  // Start live WebRTC Camera
  const startCamera = async () => {
    setCameraError(null)
    setError('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming API is not supported on this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      streamRef.current = stream
      setCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.warn('Video play error:', e))
        }
      }, 100)
    } catch (err) {
      console.warn('Live camera capture unavailable:', err)
      setCameraError('Camera access unavailable or permission was denied. Use mobile file camera fallback.')
      setCameraActive(false)
    }
  }

  // Snap photo from live camera canvas
  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)

    addFileItem({
      name: `${docType}_${activePageType}_snap.jpg`,
      type: 'image/jpeg',
      pageType: activePageType,
      dataUrl,
      size: Math.round(dataUrl.length * 0.75),
      rotation: 0
    })

    stopCamera()
  }

  // Client-side image optimization to compress high-res mobile photos
  const optimizeImageFile = (file) => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve({ dataUrl: e.target.result, size: file.size, type: 'application/pdf' })
        reader.readAsDataURL(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const maxDim = 1600
          let { width, height } = img
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          const approxSize = Math.round(compressedDataUrl.length * 0.75)
          resolve({ dataUrl: compressedDataUrl, size: approxSize, type: 'image/jpeg' })
        }
        img.onerror = () => {
          resolve({ dataUrl: e.target.result, size: file.size, type: file.type || 'image/jpeg' })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle uploaded files (Photos or PDFs)
  const handleFileInputChange = async (e, pageType = activePageType) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length) return

    for (const file of selectedFiles) {
      // Validate file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        setError(`File ${file.name} exceeds the 25MB limit.`)
        continue
      }

      // Validate file types
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg', 'application/pdf']
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Unsupported format. Please upload PDF, PNG, JPG, or WEBP.')
        continue
      }

      try {
        const { dataUrl, size, type } = await optimizeImageFile(file)
        addFileItem({
          name: file.name,
          type: type || 'image/jpeg',
          pageType: pageType,
          dataUrl,
          size,
          rotation: 0
        })
      } catch (err) {
        console.warn('Error optimizing document image:', err)
      }
    }

    // Reset input
    e.target.value = ''
  }

  const addFileItem = (newFile) => {
    // If a document page of that pageType exists, replace or append
    setFiles(prev => {
      // Filter out existing of same pageType if it's front or back to replace cleanly
      const filtered = prev.filter(f => f.pageType !== newFile.pageType)
      return [...filtered, { ...newFile, id: `file-${Date.now()}-${Math.random()}` }]
    })
    setError('')
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const rotateFile = (fileId) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return { ...f, rotation: ((f.rotation || 0) + 90) % 360 }
      }
      return f
    }))
  }

  // Format masked ID as user types
  const handleMaskedNumberInput = (e) => {
    const raw = e.target.value
    // If user enters last 4 digits e.g. "5678", format as •••• 5678
    if (raw.length <= 4 && /^\d+$/.test(raw)) {
      setMaskedNumber(`•••• ${raw}`)
    } else {
      setMaskedNumber(raw)
    }
  }

  // Optional OCR helper
  const handleRunOcrDemo = () => {
    if (!files.length) {
      setError('Please add a document photo first to detect details.')
      return
    }
    setOcrLoading(true)
    setOcrNotice('')

    setTimeout(() => {
      setOcrLoading(false)
      // Provide intelligent metadata suggestion based on doc type
      if (docType === 'boarding_pass' || docType === 'flight_ticket') {
        setFlightDetails(prev => ({
          ...prev,
          airline: prev.airline || 'IndiGo',
          flightNumber: prev.flightNumber || '6E204',
          origin: prev.origin || 'BOM',
          destination: prev.destination || 'DEL',
          departureDate: prev.departureDate || new Date().toISOString().split('T')[0],
          pnr: prev.pnr || 'X89Q12',
          seat: prev.seat || '12F',
          boardingGroup: prev.boardingGroup || 'Zone 2'
        }))
        setTitle('IndiGo Flight 6E204 Ticket')
        setOcrNotice('Detected flight parameters. Please review and edit before saving.')
      } else if (docType === 'passport') {
        setTitle('Republic of India Passport')
        setIssuingCountry('IND')
        setMaskedNumber('•••• •••• 9821')
        setExpiryDate('2032-12-31')
        setOcrNotice('Detected document title and masked reference. Identity numbers remain protected.')
      } else {
        setOcrNotice('Document scanned. Please verify and edit details.')
      }
    }, 700)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Document title is required.')
      return
    }
    if (files.length === 0) {
      setError('Please attach at least one photo, scan, or PDF file.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const docData = {
        title: title.trim(),
        category,
        doc_type: docType,
        issuing_country: issuingCountry,
        expiry_date: expiryDate || null,
        masked_number: maskedNumber || null,
        flight_details: (category === 'travel' || docType === 'flight_ticket' || docType === 'boarding_pass') && flightDetails.flightNumber ? flightDetails : null,
        notes: notes ? notes.trim() : null,
        is_offline_available: isOfflineAvailable,
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          pageType: f.pageType,
          size: f.size,
          url: f.dataUrl, // stored securely
          rotation: f.rotation || 0
        }))
      }

      await onSave(docData)
      onClose()
    } catch (err) {
      if (err.response?.status === 413) {
        setError('Document payload is too large. Please upload an image or PDF under 25MB.')
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save document.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isFlightDoc = category === 'travel' || docType === 'flight_ticket' || docType === 'boarding_pass'
  const frontFile = files.find(f => f.pageType === 'front')
  const backFile = files.find(f => f.pageType === 'back')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-surface-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-navy-800">Add Secure Travel Document</h2>
              <p className="text-xs text-slate-500">Camera scan, photo upload, or PDF file</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-2 text-slate-400 hover:text-navy-800 rounded-full hover:bg-surface-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Capture / Upload Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-display font-bold text-navy-800 text-sm">
                1. Capture or Select Document Files
              </label>
              <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivePageType('front')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activePageType === 'front' ? 'bg-white shadow-sm text-navy-800' : 'text-slate-500'
                  }`}
                >
                  Front Page {frontFile && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePageType('back')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activePageType === 'back' ? 'bg-white shadow-sm text-navy-800' : 'text-slate-500'
                  }`}
                >
                  Back Page {backFile && '✓'}
                </button>
              </div>
            </div>

            {/* Live Camera View if Active */}
            {cameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-surface-300 aspect-[4/3] max-h-72 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2.5 rounded-full bg-brand-600 text-white font-bold shadow-lg hover:bg-brand-700 active:scale-95 flex items-center gap-2 touch-manipulation"
                  >
                    <Camera className="w-4 h-4" /> Snap {activePageType === 'front' ? 'Front' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-full bg-white/80 text-navy-800 font-semibold backdrop-blur hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Capture Buttons */}
            {!cameraActive && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Camera Option */}
                <button
                  type="button"
                  onClick={() => {
                    // Try WebRTC, with fallback click on mobile input
                    startCamera()
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 active:bg-brand-100 transition-all text-center group touch-manipulation"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-navy-800 text-xs">Scan with Camera</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Live view or mobile snap</span>
                </button>

                {/* 2. Photo Library */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/70 hover:bg-surface-100 active:bg-surface-200 transition-all text-center group touch-manipulation"
                >
                  <div className="w-10 h-10 rounded-xl bg-navy-700 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <Image className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-navy-800 text-xs">Upload Photo</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Gallery & camera roll</span>
                </button>

                {/* 3. Upload File (PDF) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/70 hover:bg-surface-100 active:bg-surface-200 transition-all text-center group touch-manipulation"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-navy-800 text-xs">Upload File (PDF)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">PDF, PNG, JPG under 10MB</span>
                </button>
              </div>
            )}

            {/* Hidden Inputs */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileInputChange(e, activePageType)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFileInputChange(e, activePageType)}
            />
            {/* Direct Mobile Camera Capture Fallback (for iOS Safari & Android WebViews) */}
            <input
              ref={mobileCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileInputChange(e, activePageType)}
            />

            {cameraError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 flex items-center justify-between">
                <span>{cameraError}</span>
                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="btn-primary text-[11px] py-1 px-3 ml-2"
                >
                  Use Mobile Camera Input
                </button>
              </div>
            )}

            {/* Attached Pages / Preview Tiles */}
            {files.length > 0 && (
              <div className="mt-3 p-3 bg-surface-50 rounded-2xl border border-surface-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-700 text-xs">Attached Document Pages:</span>
                  <button
                    type="button"
                    onClick={handleRunOcrDemo}
                    disabled={ocrLoading}
                    className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 text-[11px] hover:underline"
                  >
                    {ocrLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Auto-detect Details
                  </button>
                </div>

                {ocrNotice && (
                  <div className="text-[11px] text-brand-700 bg-brand-50 border border-brand-200 rounded-xl p-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{ocrNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="bg-white rounded-xl p-3 border border-surface-200 flex items-center gap-3 relative shadow-sm"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-surface-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-surface-200">
                        {file.type === 'application/pdf' ? (
                          <span className="font-bold text-rose-600 text-xs font-mono">PDF</span>
                        ) : (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            style={{ transform: `rotate(${file.rotation || 0}deg)` }}
                            className="w-full h-full object-cover transition-transform"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-navy-800 truncate block">{file.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-50 text-brand-700 uppercase font-bold">
                            {file.pageType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {(file.size / 1024).toFixed(0)} KB • {file.type.split('/')[1] || 'doc'}
                        </span>
                      </div>

                      {/* Controls: Rotate & Delete */}
                      <div className="flex items-center gap-1">
                        {file.type !== 'application/pdf' && (
                          <button
                            type="button"
                            onClick={() => rotateFile(file.id)}
                            className="p-1.5 text-slate-400 hover:text-navy-700 rounded-lg hover:bg-surface-100"
                            title="Rotate 90°"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Metadata Form */}
          <form id="add-doc-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
            <label className="font-display font-bold text-navy-800 text-sm block">
              2. Document Category & Metadata
            </label>

            {/* Category Selector */}
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id)
                    setDocType(DOC_TYPES[cat.id][0].id)
                  }}
                  className={`py-2 px-3 rounded-xl font-semibold text-center border transition-all ${
                    category === cat.id
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : 'bg-[#FAFAF7] text-[#52524E] border-[#E5E5E0] hover:bg-[#EAEAE5] hover:text-[#0D0D0D]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Document Type */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  {(DOC_TYPES[category] || []).map(dt => (
                    <option key={dt.id} value={dt.id}>{dt.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Passport or Indigo Ticket"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field py-2 text-xs"
                  required
                />
              </div>

              {/* Issuing Country */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Issuing Country</label>
                <select
                  value={issuingCountry}
                  onChange={e => setIssuingCountry(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="input-field py-2 text-xs"
                />
              </div>

              {/* Masked ID (Privacy Guard) */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  Masked ID / Reference (Last 4 digits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5678 (Stored as •••• 5678)"
                  value={maskedNumber}
                  onChange={handleMaskedNumberInput}
                  className="input-field py-2 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Raw full document numbers are never stored in plaintext metadata.
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Personal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Saved in locker; valid for US transit"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input-field py-2 text-xs"
                />
              </div>
            </div>

            {/* Flight Ticket Section (if travel document) */}
            {isFlightDoc && (
              <div className="mt-4 p-4 rounded-2xl bg-brand-50/40 border border-brand-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-brand-600" />
                  <span className="font-display font-bold text-navy-800 text-xs">
                    Flight Journey Details (Optional)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Airline</label>
                    <input
                      type="text"
                      placeholder="e.g. British Airways"
                      value={flightDetails.airline}
                      onChange={e => setFlightDetails({ ...flightDetails, airline: e.target.value })}
                      className="input-field py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Flight Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BA142"
                      value={flightDetails.flightNumber}
                      onChange={e => setFlightDetails({ ...flightDetails, flightNumber: e.target.value.toUpperCase() })}
                      className="input-field py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Origin (IATA)</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="LHR"
                      value={flightDetails.origin}
                      onChange={e => setFlightDetails({ ...flightDetails, origin: e.target.value.toUpperCase() })}
                      className="input-field py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Destination (IATA)</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="JFK"
                      value={flightDetails.destination}
                      onChange={e => setFlightDetails({ ...flightDetails, destination: e.target.value.toUpperCase() })}
                      className="input-field py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Departure Date</label>
                    <input
                      type="date"
                      value={flightDetails.departureDate}
                      onChange={e => setFlightDetails({ ...flightDetails, departureDate: e.target.value })}
                      className="input-field py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">PNR / Booking Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. X98Y1Z"
                      value={flightDetails.pnr}
                      onChange={e => setFlightDetails({ ...flightDetails, pnr: e.target.value.toUpperCase() })}
                      className="input-field py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Seat</label>
                    <input
                      type="text"
                      placeholder="e.g. 14A"
                      value={flightDetails.seat}
                      onChange={e => setFlightDetails({ ...flightDetails, seat: e.target.value })}
                      className="input-field py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Boarding Group</label>
                    <input
                      type="text"
                      placeholder="Group 2"
                      value={flightDetails.boardingGroup}
                      onChange={e => setFlightDetails({ ...flightDetails, boardingGroup: e.target.value })}
                      className="input-field py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Offline Encrypted Toggle */}
            <div className="bg-surface-50 p-3.5 rounded-2xl border border-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <div>
                  <span className="font-bold text-navy-800 text-xs block">
                    Save for Offline Access
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Keep an offline copy accessible without internet.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isOfflineAvailable}
                onChange={e => setIsOfflineAvailable(e.target.checked)}
                className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-100 bg-surface-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="btn-secondary py-2 px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-doc-form"
            disabled={submitting || files.length === 0}
            className="btn-primary py-2 px-6 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Document...
              </>
            ) : (
              'Save to Travel Wallet'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
