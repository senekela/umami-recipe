# Admin Authentication Setup

This document describes the email and password authentication system for admin users in the Umami Recipe app.

## Overview

The app now supports two authentication methods:

1. **Magic Link (Regular Users)**: Passwordless authentication via email link
2. **Email & Password (Admin Users)**: Traditional authentication with email and password

## Features Added

### 1. Database Schema
- Added `is_admin` boolean column to the `profiles` table
- Default value is `false` for all users
- Indexed for faster admin queries

**Migration file**: `supabase/migrations/20260520_add_is_admin_to_profiles.sql`

### 2. Authentication Hooks
Updated [`useAuth.ts`](src/hooks/useAuth.ts) to include:
- `signInWithPassword(email, password)` - Sign in with email and password
- `signUpWithPassword(email, password)` - Create new account with email and password

### 3. Login Page
Updated [`Login.tsx`](src/pages/Login.tsx) with:
- Toggle between magic link and password authentication
- Admin mode shows password field
- Regular mode shows magic link option
- Clear UI indication of which mode is active

### 4. Admin Signup Page
Created [`AdminSignup.tsx`](src/pages/AdminSignup.tsx) for initial admin account creation:
- Email and password fields
- Password confirmation
- Minimum 8 character password requirement
- Automatically sets `is_admin = true` in the profile
- Accessible at `/admin/signup`

### 5. Type Definitions
Updated [`profile.ts`](src/lib/types/profile.ts) to include:
- `is_admin: boolean` field in the Profile interface

## Setup Instructions

### 1. Run Database Migration

Apply the migration to add the `is_admin` column:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard
```

The migration file is located at: `supabase/migrations/20260520_add_is_admin_to_profiles.sql`

### 2. Enable Email/Password Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Configure email templates if needed

### 3. Create First Admin Account

Visit `/admin/signup` in your app to create the first admin account:

```
https://your-app-url.com/admin/signup
```

Fill in:
- Email address
- Password (minimum 8 characters)
- Confirm password

The account will automatically be marked as admin.

### 4. Subsequent Admin Accounts

For security, you may want to:

1. **Option A**: Remove the `/admin/signup` route after creating the first admin
2. **Option B**: Add authentication guard to the signup page
3. **Option C**: Manually set `is_admin = true` in the database for existing users

To manually promote a user to admin:

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'user-uuid-here';
```

## Usage

### For Regular Users
1. Go to `/login`
2. Enter email address
3. Click "Send me a link"
4. Check email and click the magic link

### For Admin Users
1. Go to `/login`
2. Click "Admin? Sign in with password"
3. Enter email and password
4. Click "Sign in"

### Switching Between Modes
On the login page, users can toggle between:
- "Admin? Sign in with password" (switches to password mode)
- "Sign in with magic link instead" (switches to magic link mode)

## Security Considerations

1. **Password Requirements**: Minimum 8 characters enforced
2. **Admin Signup Route**: Consider restricting access after initial setup
3. **Password Reset**: Admins can use Supabase's built-in password reset flow
4. **Session Management**: Both auth methods use the same session handling

## API Reference

### useAuth Hook

```typescript
const {
  session,           // Current session
  user,              // Current user
  profile,           // User profile (includes is_admin)
  loading,           // Loading state
  sendMagicLink,     // (email: string) => Promise
  signInWithPassword,// (email: string, password: string) => Promise
  signUpWithPassword,// (email: string, password: string) => Promise
  logout,            // () => Promise
  refreshProfile     // () => void
} = useAuth()
```

### Profile Type

```typescript
interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  avatar_path: string | null
  is_admin: boolean        // New field
  created_at: string
  updated_at: string
}
```

## Troubleshooting

### "Invalid login credentials" error
- Verify the email and password are correct
- Ensure the user account exists
- Check that email confirmation is not required in Supabase settings

### Admin status not set
- Verify the migration ran successfully
- Check the `profiles` table has the `is_admin` column
- Manually update the database if needed

### Can't access admin signup page
- Ensure the route is added in [`App.tsx`](src/app/App.tsx)
- Check for any route guards that might block access
- Verify the component is imported correctly

## Future Enhancements

Consider adding:
- Admin dashboard with user management
- Role-based access control (RBAC)
- Admin-only features and routes
- Audit logging for admin actions
- Two-factor authentication for admin accounts
- Password strength meter on signup
- Rate limiting for login attempts

## Files Modified

- `src/lib/types/profile.ts` - Added `is_admin` field
- `src/hooks/useAuth.ts` - Added password authentication methods
- `src/pages/Login.tsx` - Added admin login mode
- `src/pages/AdminSignup.tsx` - Created admin signup page
- `src/app/App.tsx` - Added admin signup route
- `supabase/migrations/20260520_add_is_admin_to_profiles.sql` - Database migration

---

**Made with Bob** 🤖