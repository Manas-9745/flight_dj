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
      await new Promise(r => setTimeout(r, 800))
      onSignup({ email: form.email, name: form.name })
      navigate('/')
    } catch {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-7 h-7 text-sky-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1">Start tracking your flights with AI guidance.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input id="signup-name" type="text" placeholder="Manas Parekar" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field pl-11" required />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input id="signup-email" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field pl-11" required />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input id="signup-password" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pl-11" required />
            </div>
          </div>
          <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
