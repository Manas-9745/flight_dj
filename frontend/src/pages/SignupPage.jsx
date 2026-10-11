import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../App'

export default function SignupPage({ onSignup }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)

    try {
      const emailClean = form.email.toLowerCase().trim()
      let newUser = null

      // 1. Supabase registration if configured
      if (supabase) {
        try {
          const { data, error: supaErr } = await supabase.auth.signUp({
            email: emailClean,
            password: form.password,
            options: {
              data: { full_name: form.name, name: form.name }
            }
          })
          if (!supaErr && data?.user) {
            newUser = {
              id: data.user.id,
              email: data.user.email,
              name: form.name || data.user.email.split('@')[0],
              access_token: data.session?.access_token || `usr_${btoa(emailClean)}`
            }
          } else if (supaErr) {
            console.warn('Supabase signup notice:', supaErr.message)
            setError(supaErr.message)
            setLoading(false)
            return
          }
        } catch (supaErr) {
          console.warn('Supabase signup caught exception:', supaErr)
        }
      }

      // 2. Deterministic isolated user session fallback if Supabase not configured
      if (!newUser) {
        const b64 = btoa(emailClean)
        newUser = {
          id: `usr_${b64.replace(/=/g, '')}`,
          email: emailClean,
          name: form.name || emailClean.split('@')[0],
          access_token: `usr_${b64}`
        }
      }

      onSignup(newUser)

      const searchParams = new URLSearchParams(location.search)
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect)
    } catch (err) {
      console.error('Signup error:', err)
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      if (!supabase) throw new Error("Supabase client is not configured.")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.')
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

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-aeromate-border"></div>
            <span className="flex-shrink-0 mx-4 text-aeromate-muted text-xs font-bold uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-aeromate-border"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-aeromate-border rounded-xl text-sm font-bold text-aeromate-ink bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
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
