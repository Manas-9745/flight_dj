import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      if (form.email && form.password.length >= 6) {
        onLogin({ email: form.email })
        navigate('/')
      } else {
        setError('Invalid credentials. Password must be at least 6 characters.')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-28">
      <div className="w-full max-w-md animate-slide-up space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-aeromate-ink text-white font-bold text-xl mb-1 shadow-sm">
            ✈
          </div>
          <h1 className="font-display font-extrabold text-3xl text-aeromate-ink tracking-tight">
            AeroMate<span className="text-blue-600 text-lg">®</span>
          </h1>
          <p className="text-sm font-medium text-aeromate-muted">
            Sign in to manage your journeys and AI disruption alerts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-8 border border-aeromate-border shadow-card space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-aeromate-muted uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aeromate-muted/60" />
              <input
                id="login-email"
                type="email"
                placeholder="passenger@example.com"
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
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pl-10 text-sm font-semibold"
                required
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-bold mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-xs font-medium text-aeromate-muted pt-2 border-t border-aeromate-border">
            Don't have an account?{' '}
            <Link to="/signup" className="text-aeromate-ink hover:underline font-bold">Sign up free</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
