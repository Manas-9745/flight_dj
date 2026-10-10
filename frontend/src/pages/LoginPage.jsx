import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plane, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

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
      // Demo / client login — persistent session
      await new Promise(r => setTimeout(r, 600))
      if (form.email && form.password.length >= 6) {
        onLogin({ email: form.email, name: form.email.split('@')[0] })
        navigate('/')
      } else {
        setError('Invalid credentials. Password must be at least 6 characters.')
      }
    } catch {
      setError('Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Plane className="w-7 h-7 text-brand-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-navy-700">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your AeroMate aviation dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 shadow-card">
          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="label-field" htmlFor="login-email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="label-field !mb-0" htmlFor="login-password">Password</label>
              <span className="text-xs text-brand-600 hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Authenticating...' : 'Sign In to AeroMate'}
          </button>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-surface-200">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-semibold">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
