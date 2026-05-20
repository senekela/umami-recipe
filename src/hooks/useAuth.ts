import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  const sendMagicLink = async (email: string) => {
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://umami-recipe-4blp34o2v-mayortone-gmailcoms-projects.vercel.app/'
      }
    })
  }

  const logout = () => supabase.auth.signOut()

  return {
    session,
    user: session?.user ?? null,
    loading,
    sendMagicLink,
    logout
  }
}
