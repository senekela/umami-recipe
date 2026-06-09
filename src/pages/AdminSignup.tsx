import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function AdminSignup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signUpWithPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // Sign up the user
      const { data, error: signUpError } = await signUpWithPassword(email, password)

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Set the user as admin in the profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Failed to set admin status:', updateError)
          setError('Account created but failed to set admin status. Please contact support.')
          setLoading(false)
          return
        }

        // Success - redirect to login or home
        navigate('/login')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-none shadow-elevated p-12 max-w-md w-full border border-border">
        <h1 className="font-display text-4xl text-primary text-center mb-3 font-normal">Create Admin Account</h1>
        <p className="text-center text-muted-foreground mb-10 text-base font-light">
          Set up your admin account with email and password
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
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary placeholder:text-muted-foreground"
            />
          </div>

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
              minLength={8}
              className="w-full px-4 py-3 border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-2 font-light">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-[1.65px]">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={8}
              className="w-full px-4 py-3 border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary placeholder:text-muted-foreground"
            />
          </div>

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
            {loading ? 'Creating account...' : 'Create Admin Account'}
          </button>

          <div className="text-center pt-6 border-t border-border/20">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-tertiary hover:underline font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Made with Bob
