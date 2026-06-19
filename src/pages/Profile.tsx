import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { Card, CardContent } from '../app/components/ui/card'
import { Camera, Loader2, User } from 'lucide-react'
import type { Profile } from '../lib/types/profile'

export function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  async function loadProfile() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setNickname(data.nickname || '')
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNickname(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ nickname: nickname.trim() || null })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      if (data) {
        setProfile(data)
      }

      setSuccess('Nickname updated successfully')
      await loadProfile()
    } catch (err: any) {
      console.error('Failed to update nickname:', err)
      setError(err?.message || 'Failed to update nickname')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      if (profile?.avatar_path) {
        await supabase.storage.from('avatars').remove([profile.avatar_path])
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, avatar_path: filePath })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      if (updateData) {
        setProfile(updateData)
      }

      setSuccess('Profile picture updated successfully')
      await loadProfile()
    } catch (err: any) {
      console.error('Failed to upload avatar:', err)
      setError(err?.message || 'Failed to upload profile picture')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Profile" showBack onBack={() => navigate('/me')}>
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl">
          <CardContent className="p-6 md:p-10">

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-stone-950 flex items-center justify-center ring-4 ring-white/50">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={nickname || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-stone-950 text-white shadow-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
                  aria-label="Upload profile picture"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <p className="text-xs text-stone-400 mt-3 text-center">
                Click the camera icon to update your photo · Max 2MB
              </p>
            </div>

            {/* Nickname Section */}
            <form onSubmit={handleSaveNickname} className="space-y-5">
              <div>
                <label htmlFor="nickname" className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-[0.1em]">
                  Nickname
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-black/10 rounded-full bg-white/70 text-stone-950 placeholder:text-stone-400 focus:outline-none focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10 transition"
                />
                <p className="text-xs text-stone-400 mt-2">
                  This is how you'll appear to others
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-[0.1em]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-black/10 rounded-full bg-stone-100/60 text-stone-400 cursor-not-allowed"
                />
              </div>

              {/* Feedback Messages */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200/80 rounded-2xl text-red-700 text-sm">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-700 text-sm">
                  <span className="shrink-0 mt-0.5">✓</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving || nickname === (profile?.nickname ?? '')}
                className="w-full rounded-full bg-stone-950 text-white py-3 text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </button>
            </form>

          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
