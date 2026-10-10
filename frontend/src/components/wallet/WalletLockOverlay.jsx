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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E0] text-center relative overflow-hidden">
        {/* Close / Bypass button if user wants to close lock dialog */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#0D0D0D] rounded-full hover:bg-[#FAFAF7] transition-colors"
            title="Cancel"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#1A1A1A] flex items-center justify-center mx-auto mb-4 shadow-sm">
          {step === 'unlock' ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-display font-bold text-[#0D0D0D] mb-1">
          {step === 'unlock' && 'Wallet Security Lock'}
          {step === 'set' && 'Set Wallet Security PIN'}
          {step === 'confirm' && 'Confirm Security PIN'}
        </h2>

        <p className="text-xs text-slate-500 mb-6">
          {step === 'unlock' && 'Enter your PIN to access your travel documents.'}
          {step === 'set' && 'Create a 4-digit PIN to secure documents on this device.'}
          {step === 'confirm' && 'Re-enter your PIN to confirm.'}
        </p>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-[#1A1A1A] border-[#1A1A1A] scale-110 shadow-sm'
                  : 'bg-[#FAFAF7] border-[#E5E5E0]'
              }`}
            />
          ))}
          {pin.length > 4 && (
            <div className="w-4 h-4 rounded-full bg-[#1A1A1A] border-2 border-[#1A1A1A] scale-110 shadow-sm" />
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
              className="h-13 rounded-2xl bg-[#FAFAF7] hover:bg-[#EAEAE5] active:bg-[#DFDFD9] border border-[#E5E5E0] text-lg font-bold text-[#0D0D0D] transition-all flex items-center justify-center select-none shadow-xs touch-manipulation active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-2xl bg-[#FAFAF7] hover:bg-[#EAEAE5] active:bg-[#DFDFD9] text-xs font-semibold text-slate-500 transition-all flex items-center justify-center select-none touch-manipulation active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-2xl bg-[#FAFAF7] hover:bg-[#EAEAE5] active:bg-[#DFDFD9] border border-[#E5E5E0] text-lg font-bold text-[#0D0D0D] transition-all flex items-center justify-center select-none shadow-xs touch-manipulation active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-[#FAFAF7] hover:bg-[#EAEAE5] active:bg-[#DFDFD9] text-xs font-semibold text-slate-500 transition-all flex items-center justify-center select-none touch-manipulation active:scale-95"
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
          <p>Stored securely on your device</p>
        </div>
      </div>
    </div>
  )
}
