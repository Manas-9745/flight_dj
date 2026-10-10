import { useState, useEffect } from 'react'
import { ShieldCheck, Lock, Unlock, KeyRound, AlertTriangle, X } from 'lucide-react'
import { verifyWalletPin, setWalletPin, isWalletPinSet } from '../../services/walletStorage'

export default function WalletLockOverlay({ isOpen, onClose, onUnlocked, isSettingNewPin = false }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState(isSettingNewPin ? 'set' : 'unlock') // 'unlock' | 'set' | 'confirm'
  const [error, setError] = useState('')
  const [pinConfigured, setPinConfigured] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setConfirmPin('')
      setError('')
      checkPinStatus()
    }
  }, [isOpen, isSettingNewPin])

  const checkPinStatus = async () => {
    const isSet = await isWalletPinSet()
    setPinConfigured(isSet)
    if (!isSet && !isSettingNewPin) {
      // If no PIN has been configured yet, suggest setting a 4-digit PIN for device encryption
      setStep('set')
    } else if (isSettingNewPin) {
      setStep('set')
    } else {
      setStep('unlock')
    }
  }

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      const nextPin = pin + num
      setPin(nextPin)
      setError('')
      if (step === 'unlock' && nextPin.length >= 4) {
        attemptUnlock(nextPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const attemptUnlock = async (enteredPin) => {
    setLoading(true)
    try {
      const isValid = await verifyWalletPin(enteredPin)
      if (isValid) {
        onUnlocked(enteredPin)
      } else {
        setError('Incorrect Wallet Security PIN. Please try again.')
        setPin('')
      }
    } catch (err) {
      setError('Decryption verification error. Try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const handleSetProceed = () => {
    if (pin.length < 4) {
      setError('Security PIN must be at least 4 digits.')
      return
    }
    setConfirmPin(pin)
    setPin('')
    setStep('confirm')
  }

  const handleConfirmPin = async () => {
    if (pin !== confirmPin) {
      setError('PIN numbers do not match. Please re-enter.')
      setPin('')
      return
    }
    setLoading(true)
    try {
      await setWalletPin(pin)
      onUnlocked(pin)
    } catch (err) {
      setError(err.message || 'Failed to save security PIN')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-surface-200 text-center relative overflow-hidden">
        {/* Close / Bypass button if user wants to close lock dialog */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-navy-800 rounded-full hover:bg-surface-100 transition-colors"
            title="Cancel"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          {step === 'unlock' ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-display font-bold text-navy-800 mb-1">
          {step === 'unlock' && 'Wallet Security Lock'}
          {step === 'set' && 'Set Wallet Security PIN'}
          {step === 'confirm' && 'Confirm Security PIN'}
        </h2>

        <p className="text-xs text-slate-500 mb-6">
          {step === 'unlock' && 'Enter your device PIN to view and decrypt your sensitive travel documents.'}
          {step === 'set' && 'Create a 4 to 6-digit PIN used to encrypt documents locally on this device with AES-GCM-256.'}
          {step === 'confirm' && 'Re-enter your PIN to verify device key setup.'}
        </p>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-brand-600 border-brand-600 scale-110 shadow-sm'
                  : 'bg-surface-100 border-surface-300'
              }`}
            />
          ))}
          {pin.length > 4 && (
            <div className="w-4 h-4 rounded-full bg-brand-600 border-2 border-brand-600 scale-110 shadow-sm" />
          )}
        </div>

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-4 flex items-center gap-1.5 justify-center animate-shake">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad for Mobile and Touch Accessibility */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-13 rounded-2xl bg-surface-50 hover:bg-brand-50 active:bg-brand-100 border border-surface-200 text-lg font-bold text-navy-800 transition-all flex items-center justify-center select-none shadow-sm touch-manipulation active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-2xl bg-surface-50 hover:bg-surface-100 active:bg-surface-200 text-xs font-semibold text-slate-500 transition-all flex items-center justify-center select-none touch-manipulation active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-2xl bg-surface-50 hover:bg-brand-50 active:bg-brand-100 border border-surface-200 text-lg font-bold text-navy-800 transition-all flex items-center justify-center select-none shadow-sm touch-manipulation active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-surface-50 hover:bg-surface-100 active:bg-surface-200 text-xs font-semibold text-slate-500 transition-all flex items-center justify-center select-none touch-manipulation active:scale-95"
          >
            ⌫
          </button>
        </div>

        {/* Setup Action Buttons */}
        {step === 'set' && (
          <button
            type="button"
            onClick={handleSetProceed}
            disabled={pin.length < 4 || loading}
            className="btn-primary w-full py-3 text-sm rounded-xl"
          >
            Continue
          </button>
        )}

        {step === 'confirm' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleConfirmPin}
              disabled={pin.length < 4 || loading}
              className="btn-primary w-full py-3 text-sm rounded-xl"
            >
              {loading ? 'Configuring Encryption Key...' : 'Confirm & Encrypt Wallet'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('set')
                setPin('')
              }}
              className="text-xs text-slate-500 hover:text-navy-700 py-1"
            >
              Back to change PIN
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-surface-100 text-[11px] text-slate-400">
          <p>Local Web Crypto AES-GCM-256 • AeroMate Privacy Guard</p>
        </div>
      </div>
    </div>
  )
}
