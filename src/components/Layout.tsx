import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Plus, User, ArrowLeft } from 'lucide-react'

type NavItem = { to: string; label: string; icon: typeof Home; match: (path: string) => boolean }

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' || p.startsWith('/recipes') },
  { to: '/search', label: 'Search', icon: Search, match: (p) => p.startsWith('/search') },
  { to: '/import', label: 'Import', icon: Plus, match: (p) => p.startsWith('/import') },
  { to: '/me', label: 'Me', icon: User, match: (p) => p.startsWith('/me') || p.startsWith('/drafts') },
]

interface LayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
  onBack?: () => void
  rightSlot?: ReactNode
  belowHeader?: ReactNode
  hideNav?: boolean
  contained?: boolean
  banner?: ReactNode
}

export function Layout({
  children,
  title,
  showBack = false,
  onBack,
  rightSlot,
  belowHeader,
  hideNav = false,
  contained = true,
  banner,
}: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 h-16">
            {showBack ? (
              <button
                onClick={handleBack}
                aria-label="Go back"
                className="-ml-2 p-2 rounded-full hover:bg-gray-100 text-[#1A1A18]"
              >
                <ArrowLeft size={22} />
              </button>
            ) : (
              <Link to="/" className="flex items-center" aria-label="Umami home">
                <span className="font-serif text-2xl text-[#1A1A18] leading-none">Umami</span>
              </Link>
            )}

            {title && (
              <h1
                className={`font-serif text-xl text-[#1A1A18] truncate ${
                  showBack ? '' : 'hidden sm:block'
                }`}
              >
                {title}
              </h1>
            )}

            <nav className="ml-auto hidden md:flex items-center gap-1" aria-label="Main">
              {NAV_ITEMS.map((item) => {
                const active = item.match(location.pathname)
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? 'text-[#C0622F] bg-[#C0622F]/10'
                        : 'text-[#1A1A18]/70 hover:text-[#1A1A18] hover:bg-gray-100'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {rightSlot && <div className="ml-auto md:ml-2 flex items-center gap-2">{rightSlot}</div>}
          </div>

          {belowHeader && <div className="pb-3">{belowHeader}</div>}
        </div>
      </header>

      {banner && <div>{banner}</div>}

      <main
        className={`flex-1 w-full ${
          contained ? 'max-w-5xl mx-auto px-4 py-6' : ''
        } ${hideNav ? '' : 'pb-24 md:pb-6'}`}
      >
        {children}
      </main>

      {!hideNav && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-20"
          aria-label="Main"
        >
          <div className="flex justify-around items-stretch h-16">
            {NAV_ITEMS.map((item) => {
              const active = item.match(location.pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                    active ? 'text-[#C0622F]' : 'text-[#1A1A18]/60'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
