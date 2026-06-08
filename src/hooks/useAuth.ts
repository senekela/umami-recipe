import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../lib/types/profile'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        loadProfile(data.session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session)
        if (session?.user) {
          loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const sendMagicLink = async (email: string) => {
    // Use the current origin for redirect to support both local dev and production
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : 'http://localhost:5173/'
    
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
  }

  const signInWithPassword = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email,
      password
    })
  }

  const signUpWithPassword = async (email: string, password: string) => {
    return supabase.auth.signUp({
      email,
      password
    })
  }

  const logout = () => supabase.auth.signOut()

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    sendMagicLink,
    signInWithPassword,
    signUpWithPassword,
    logout,
    refreshProfile: () => session?.user && loadProfile(session.user.id)
  }
}
