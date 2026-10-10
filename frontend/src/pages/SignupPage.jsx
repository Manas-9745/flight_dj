import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plane, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react'

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
    <div className="min-h-[75vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Plane className="w-7 h-7 text-brand-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-navy-700">Create an Account</h1>
          <p className="text-slate-500 text-sm mt-1">Get real-time flight telemetry, transfer guidance & AI copilot</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 shadow-card">
          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="label-field" htmlFor="signup-name">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="signup-name"
                type="text"
                placeholder="Captain John Doe"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-field" htmlFor="signup-email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="signup-email"
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
            <label className="label-field" htmlFor="signup-password">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-surface-200">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
