export interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  avatar_path: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}
