import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react'

export default function SignupPage({ onSignup }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      onSignup({ email: form.email, name: form.name })
      navigate('/')
    } catch {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-28">
      <div className="w-full max-w-md animate-slide-up space-y-8">
        <div className="text-center space-y-3">
          <span className="font-display font-extrabold text-5xl text-aeromate-ink tracking-tight">
            AeroMate®
          </span>
          <p className="text-sm font-medium text-aeromate-muted">
            Create your account to start tracking flights.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-8 border border-aeromate-border shadow-card space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-aeromate-muted uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aeromate-muted/60" />
              <input
                id="signup-name"
                type="text"
                placeholder="Alex Morgan"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field pl-10 text-sm font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-aeromate-muted uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aeromate-muted/60" />
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field pl-10 text-sm font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-aeromate-muted uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aeromate-muted/60" />
              <input
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pl-10 text-sm font-semibold"
                required
              />
            </div>
          </div>

          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-bold mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Creating Account...' : 'Create Free Account'}
          </button>

          <p className="text-center text-xs font-medium text-aeromate-muted pt-2 border-t border-aeromate-border">
            Already have an account?{' '}
            <Link to="/login" className="text-aeromate-ink hover:underline font-bold">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
