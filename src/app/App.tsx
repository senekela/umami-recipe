import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { AuthGuard } from '../components/AuthGuard'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Home } from '../pages/Home'
import { Search } from '../pages/Search'
import { RecipeDetail } from '../pages/RecipeDetail'
import { Login } from '../pages/Login'
import { AdminSignup } from '../pages/AdminSignup'
import { Import } from '../pages/Import'
import { DraftEditor } from '../pages/DraftEditor'
import { MyRecipes } from '../pages/MyRecipes'
import { Profile } from '../pages/Profile'
import { ShareView } from '../pages/ShareView'
import { supabase } from '../lib/supabase'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const next = searchParams.get('next')
        navigate(next || '/me')
      } else {
        navigate('/login')
      }
    })
  }, [navigate, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#C0622F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#1A1A18]/60">Signing you in...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/recipes/:slug" element={<RecipeDetail />} />
        <Route path="/share/:token" element={<ShareView />} />
        <Route
          path="/import"
          element={
            <AuthGuard>
              <Import />
            </AuthGuard>
          }
        />
        <Route
          path="/drafts/:id"
          element={
            <AuthGuard>
              <DraftEditor />
            </AuthGuard>
          }
        />
        <Route
          path="/me"
          element={
            <AuthGuard>
              <MyRecipes />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          }
        />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}