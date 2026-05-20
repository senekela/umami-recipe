# User Profile Feature

This document describes the new user profile feature that allows authenticated users to customize their nickname and profile picture.

## Features

- **Customizable Nickname**: Users can set a display name that appears throughout the app
- **Profile Picture Upload**: Users can upload and update their avatar image
- **Automatic Profile Creation**: Profiles are automatically created when users sign up
- **Secure Storage**: Profile pictures are stored in Supabase Storage with proper access controls

## Database Setup

### 1. Apply the Migration

Run the SQL migration to create the profiles table and storage bucket:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard
# Go to SQL Editor and run the contents of:
# supabase/migrations/20260520_create_profiles_table.sql
```

### 2. What the Migration Creates

The migration sets up:

- **`profiles` table**: Stores user nickname and avatar URL
- **Row Level Security (RLS)**: Users can only view/edit their own profile
- **Auto-creation trigger**: Automatically creates a profile when a user signs up
- **`avatars` storage bucket**: Stores profile pictures with public access
- **Storage policies**: Users can only upload/modify their own avatars

## File Structure

```
src/
├── lib/types/
│   └── profile.ts              # Profile TypeScript interface
├── hooks/
│   └── useAuth.ts              # Updated to include profile data
├── pages/
│   ├── Profile.tsx             # Profile editing page
│   └── MyRecipes.tsx           # Updated to show profile info
└── app/
    └── App.tsx                 # Added /profile route

supabase/
└── migrations/
    └── 20260520_create_profiles_table.sql  # Database migration
```

## Usage

### For Users

1. Navigate to "Me" tab
2. Click "Edit Profile" or the "Profile" button in the header
3. Upload a profile picture by clicking the camera icon
4. Edit your nickname
5. Click "Save Changes"

### For Developers

#### Access Profile Data

```typescript
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { user, profile } = useAuth()
  
  return (
    <div>
      <p>Nickname: {profile?.nickname}</p>
      <img src={profile?.avatar_url} alt="Avatar" />
    </div>
  )
}
```

#### Refresh Profile Data

```typescript
const { refreshProfile } = useAuth()

// After updating profile elsewhere
await refreshProfile()
```

## API Reference

### Profile Type

```typescript
interface Profile {
  id: string              // User ID (references auth.users)
  nickname: string | null // Display name
  avatar_url: string | null // Public URL to avatar image
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp
}
```

### useAuth Hook

```typescript
const {
  user,           // Supabase User object
  profile,        // User's profile data
  loading,        // Loading state
  sendMagicLink,  // Send login email
  logout,         // Sign out
  refreshProfile  // Reload profile data
} = useAuth()
```

## Storage Configuration

### Avatar Upload Constraints

- **Max file size**: 2MB
- **Allowed formats**: All image types (image/*)
- **Storage path**: `avatars/{user_id}/{timestamp}.{ext}`
- **Access**: Public read, authenticated write (own files only)

### Storage Policies

1. **Public Read**: Anyone can view avatar images
2. **Authenticated Upload**: Users can upload to their own folder
3. **Owner Update/Delete**: Users can modify/delete their own avatars

## Security

- **Row Level Security (RLS)**: Enabled on profiles table
- **User Isolation**: Users can only access their own profile data
- **Storage Policies**: Users can only modify their own avatar files
- **Automatic Cleanup**: Old avatars are deleted when uploading new ones

## Troubleshooting

### Profile Not Loading

1. Check if the migration was applied successfully
2. Verify RLS policies are enabled
3. Check browser console for errors

### Avatar Upload Fails

1. Verify file size is under 2MB
2. Check file is an image format
3. Ensure storage bucket "avatars" exists
4. Verify storage policies are configured

### Profile Not Created on Signup

1. Check if the `on_auth_user_created` trigger exists
2. Verify the trigger function `handle_new_user()` is working
3. Check Supabase logs for errors

## Future Enhancements

Potential improvements:

- Bio/description field
- Social media links
- Privacy settings (public/private profile)
- Profile visibility controls
- Avatar cropping/editing
- Multiple avatar options