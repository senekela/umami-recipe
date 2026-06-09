import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sendMagicLink, signInWithPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isAdminMode) {
      // Admin login with password
      const { error } = await signInWithPassword(email, password)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Redirect to the next page or default to /me
        navigate(searchParams.get('next') || '/me')
      }
    } else {
      // Regular user login with magic link
      const { error } = await sendMagicLink(email)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSent(true)
        setLoading(false)
      }
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-none shadow-elevated p-12 max-w-md w-full text-center border border-border">
          <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-primary mb-3 font-normal">Check your email</h1>
          <p className="text-muted-foreground mb-4 text-base font-light">
            We sent a sign-in link to <strong className="text-primary">{email}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the sign-in link</li>
              <li>You'll be automatically signed in</li>
            </ol>
            <p className="text-xs text-blue-700 mt-3">
              💡 Keep this tab open while you check your email
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="text-tertiary hover:underline font-medium"
            >
              ← Back to login
            </button>
            <button
              onClick={() => handleSubmit(new Event('submit') as any)}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Didn't receive it? Resend email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-none shadow-elevated p-12 max-w-md w-full border border-border">
        <h1 className="font-display text-4xl text-primary text-center mb-3 font-normal">Umami</h1>
        <p className="text-center text-muted-foreground mb-10 text-base font-light">
          {isAdminMode ? 'Admin sign in' : 'Sign in to save and share recipes'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-[1.65px]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary placeholder:text-muted-foreground"
            />
          </div>

          {isAdminMode && (
            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-[1.65px]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary placeholder:text-muted-foreground"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-none text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold text-[11px] uppercase tracking-[1.65px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isAdminMode ? 'Signing in...' : 'Sending...') : (isAdminMode ? 'Sign in' : 'Send me a link')}
          </button>

          <div className="text-center pt-6 border-t border-border/20 space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode)
                setError(null)
                setPassword('')
              }}
              className="text-sm text-tertiary hover:underline block w-full font-medium"
            >
              {isAdminMode ? 'Sign in with magic link instead' : 'Admin? Sign in with password'}
            </button>
            {isAdminMode && (
              <button
                type="button"
                onClick={() => navigate('/admin/signup')}
                className="text-sm text-muted-foreground hover:text-tertiary hover:underline block w-full"
              >
                Need to create an admin account?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
