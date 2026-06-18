import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
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
        await supabase.storage
          .from('avatars')
          .remove([profile.avatar_path])
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          avatar_path: filePath,
        })
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
          <Loader2 className="w-8 h-8 animate-spin text-tertiary" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Profile" showBack onBack={() => navigate('/me')}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-background rounded-none shadow-elevated p-10 md:p-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted/10 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={nickname || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-3 rounded-full shadow-elevated hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Upload profile picture"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
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
            
            <p className="text-sm text-muted-foreground mt-4 text-center font-light">
              Click the camera icon to upload a new profile picture
              <br />
              <span className="text-xs">Max size: 2MB</span>
            </p>
          </div>

          {/* Nickname Section */}
          <form onSubmit={handleSaveNickname} className="space-y-6">
            <div>
              <label htmlFor="nickname" className="block text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-[1.65px]">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={50}
                className="w-full px-4 py-3 border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-2 font-light">
                This is how you'll appear to others
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-[1.65px]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-border/30 rounded-full bg-muted/5 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-none text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-none text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving || nickname === profile?.nickname}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold text-[11px] uppercase tracking-[1.65px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
