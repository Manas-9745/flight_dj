import { useState } from 'react'
import {
  X, ZoomIn, ZoomOut, RotateCw, Download, Share2, Trash2,
  Shield, Calendar, Globe, MapPin, Plane, AlertTriangle,
  CheckCircle2, FileText, ArrowLeft, ArrowRight, HardDriveDownload
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  onDeleteCloud,
  onToggleOffline,
  isOfflineSaved = false
}) {
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [confirmDeleteType, setConfirmDeleteType] = useState(null) // 'cloud' | 'offline' | null

  if (!isOpen || !document) return null

  const files = document.files || []
  const currentFile = files[activePageIndex] || files[0]

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  // Download current file
  const handleDownload = () => {
    if (!currentFile || !currentFile.url) return
    const a = window.document.createElement('a')
    a.href = currentFile.url
    a.download = currentFile.name || `${document.title}_document`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
  }

  // Web Share API
  const handleShare = async () => {
    if (navigator.share && currentFile) {
      try {
        await navigator.share({
          title: document.title,
          text: `AeroMate Secure Travel Document: ${document.title}`
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleDownload()
    }
  }

  // Calculate Expiry Status
  const getExpiryStatus = (dateStr) => {
    if (!dateStr) return null
    const exp = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'expired', text: `Expired on ${dateStr}`, color: 'bg-rose-50 text-rose-700 border-rose-200' }
    }
    if (diffDays <= 60) {
      return { status: 'soon', text: `Expires in ${diffDays} days (${dateStr})`, color: 'bg-amber-50 text-amber-700 border-amber-200' }
    }
    return { status: 'valid', text: `Valid until ${dateStr}`, color: 'bg-teal-50 text-teal-700 border-teal-200' }
  }

  const expiryBadge = getExpiryStatus(document.expiry_date)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-surface-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-navy-800">{document.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-100 text-navy-700">
                  {document.category}
                </span>
              </div>
              <span className="text-xs text-slate-400 block">
                {document.doc_type.replace('_', ' ').toUpperCase()} • Country: {document.issuing_country || 'IND'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-navy-800 rounded-full hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Status and Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-50 p-3 rounded-2xl border border-surface-200">
            <div className="flex flex-wrap items-center gap-2">
              {expiryBadge && (
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 ${expiryBadge.color}`}>
                  {expiryBadge.status === 'expired' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                  {expiryBadge.text}
                </span>
              )}
              {document.masked_number && (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-navy-50 text-navy-800 border border-navy-100">
                  Ref: {document.masked_number}
                </span>
              )}
            </div>

            {/* Offline Storage Toggle */}
            <button
              onClick={() => onToggleOffline(document)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs touch-manipulation ${
                isOfflineSaved
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-surface-200 text-slate-700 hover:bg-surface-300'
              }`}
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              {isOfflineSaved ? 'Available Offline (Encrypted)' : 'Make Available Offline'}
            </button>
          </div>

          {/* Document Viewer Frame with Controls */}
          {files.length > 0 ? (
            <div className="space-y-3">
              {/* Page Tabs if Multiple Pages */}
              {files.length > 1 && (
                <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
                  {files.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActivePageIndex(idx)
                        setZoomLevel(1)
                        setRotation(0)
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        activePageIndex === idx
                          ? 'bg-navy-800 text-white shadow-sm'
                          : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
                      }`}
                    >
                      {f.pageType ? f.pageType.toUpperCase() : `Page ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Viewer Container */}
              <div className="relative rounded-2xl bg-surface-900 border border-surface-300 min-h-[300px] max-h-[440px] flex items-center justify-center overflow-hidden p-4">
                {currentFile?.type === 'application/pdf' ? (
                  <div className="text-center text-white space-y-3 p-8">
                    <FileText className="w-16 h-16 text-brand-400 mx-auto" />
                    <p className="font-bold text-sm">{currentFile.name}</p>
                    <p className="text-xs text-slate-300">PDF document is securely loaded.</p>
                    <button
                      onClick={handleDownload}
                      className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Open / Download PDF
                    </button>
                  </div>
                ) : (
                  <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                    <img
                      src={currentFile?.url}
                      alt={document.title}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-h-[380px] max-w-full object-contain rounded-lg shadow-lg select-none"
                    />
                  </div>
                )}

                {/* Floating Image Control Bar */}
                {currentFile?.type !== 'application/pdf' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-navy-950/80 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 text-white shadow-lg z-10">
                    <button
                      onClick={handleZoomOut}
                      className="p-1 hover:text-brand-400"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1 hover:text-brand-400"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-3 bg-white/20 mx-1" />
                    <button
                      onClick={handleRotate}
                      className="p-1 hover:text-brand-400"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-50 border border-dashed border-surface-200 rounded-2xl p-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No document scan or file attached.</p>
            </div>
          )}

          {/* Flight Details Card if applicable */}
          {document.flight_details && (
            <div className="bg-brand-50/50 border border-brand-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-brand-600" />
                  <span className="font-display font-bold text-navy-800 text-xs">
                    Linked Flight Details: {document.flight_details.airline} {document.flight_details.flightNumber}
                  </span>
                </div>
                {document.flight_details.flightNumber && (
                  <Link
                    to={`/flight-status?flight=${document.flight_details.flightNumber}`}
                    className="text-brand-600 hover:text-brand-700 font-bold text-[11px] underline"
                  >
                    Track Flight Live →
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-surface-200">
                  <span className="text-[10px] text-slate-400 block">Route</span>
                  <span className="font-bold text-navy-800">
                    {document.flight_details.origin} ➔ {document.flight_details.destination}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-surface-200">
                  <span className="text-[10px] text-slate-400 block">Departure</span>
                  <span className="font-bold text-navy-800">{document.flight_details.departureDate || '—'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-surface-200">
                  <span className="text-[10px] text-slate-400 block">Booking Ref / PNR</span>
                  <span className="font-mono font-bold text-brand-600">{document.flight_details.pnr || '—'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-surface-200">
                  <span className="text-[10px] text-slate-400 block">Seat / Group</span>
                  <span className="font-bold text-navy-800">
                    {document.flight_details.seat || '—'} ({document.flight_details.boardingGroup || '—'})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {document.notes && (
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-3 text-slate-600 text-xs">
              <span className="font-bold text-navy-800 block mb-0.5">Notes:</span>
              <p>{document.notes}</p>
            </div>
          )}

          {/* Delete Confirmation Modal Layer */}
          {confirmDeleteType && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>
                  {confirmDeleteType === 'cloud'
                    ? 'Permanently Delete Cloud Document?'
                    : 'Remove Offline Device Copy?'}
                </span>
              </div>
              <p className="text-xs text-rose-700">
                {confirmDeleteType === 'cloud'
                  ? 'This will delete this document from your AeroMate secure cloud storage. If an offline copy exists on this device, it will also be removed.'
                  : 'This will remove the local encrypted copy from this browser. Your cloud document remains safe.'}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteType(null)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDeleteType === 'cloud') {
                      onDeleteCloud(document.id)
                    } else {
                      onToggleOffline(document)
                    }
                    setConfirmDeleteType(null)
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-100 bg-surface-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDeleteType('cloud')}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="w-4 h-4" /> Delete Document
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={handleDownload}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
