import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, User, ArrowLeft, ChefHat, Clock, Leaf, Plus } from 'lucide-react'

type NavItem = { to: string; label: string; icon: typeof Home; match: (path: string) => boolean }

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' || p.startsWith('/recipes') },
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
  quickFilters?: Array<{ label: string; icon: any; active: boolean; onClick: () => void }>
  showAvatar?: boolean
  avatarUrl?: string
  onAvatarClick?: () => void
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
  quickFilters,
  showAvatar = true,
  avatarUrl,
  onAvatarClick,
}: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick()
    } else {
      navigate('/me')
    }
  }

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F1E8] text-stone-950 relative">
      {/* Ambient background gradients */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#E7D7C3] blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#DAD4C7] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#EFD6A8] blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-3 sm:py-4 lg:px-8">
        {/* Modern rounded navigation bar */}
        <nav className="sticky top-3 sm:top-4 z-40 flex items-center justify-between rounded-[1.5rem] sm:rounded-[2rem] border border-black/10 bg-[#fbf7ef]/75 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
            {showBack ? (
              <button
                onClick={handleBack}
                aria-label="Go back"
                className="grid h-10 w-10 place-items-center rounded-2xl text-stone-950 hover:bg-black/5 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0" aria-label="Umami home">
                <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl sm:rounded-2xl bg-stone-950 text-[#F6F1E8] shadow-lg shadow-stone-950/15 flex-shrink-0">
                  <ChefHat className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-[-0.03em] truncate" style={{ fontFamily: 'UberMove, "Uber Move", "Uber Move Text", Inter, system-ui, sans-serif' }}>
                    Umami
                  </p>
                  <p className="hidden sm:block text-xs text-stone-500 truncate">Cook smarter, not harder</p>
                </div>
              </Link>
            )}
          </div>

          {/* Quick filter buttons or custom right slot */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {quickFilters ? (
              <div className="hidden items-center gap-1.5 sm:gap-2 lg:flex">
                {quickFilters.map((filter) => {
                  const Icon = filter.icon
                  return (
                    <button
                      key={filter.label}
                      onClick={filter.onClick}
                      className={`rounded-full px-4 py-2 text-sm transition flex items-center gap-2 ${
                        filter.active ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-black/5 hover:text-stone-950'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {filter.label}
                    </button>
                  )
                })}
              </div>
            ) : rightSlot ? (
              <div className="flex items-center gap-2">{rightSlot}</div>
            ) : null}
            
            {/* Add Recipe Button */}
            <Link
              to="/import"
              className="rounded-full bg-stone-950 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#F6F1E8] hover:bg-stone-800 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Add recipe</span>
              <span className="xs:hidden">Add</span>
            </Link>

            {/* Avatar Button */}
            {showAvatar && (
              <button
                onClick={handleAvatarClick}
                className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-stone-950 text-white hover:bg-stone-800 transition-colors overflow-hidden ring-2 ring-white/50 flex-shrink-0"
                aria-label="Go to profile"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            )}
          </div>
        </nav>

        {belowHeader && <div>{belowHeader}</div>}
        {banner && <div>{banner}</div>}

        {/* Main content */}
        <main className={`flex-1 w-full ${contained ? '' : ''} ${hideNav ? '' : 'pb-20 sm:pb-24 md:pb-6'}`}>
          {children}
        </main>

        {/* Mobile bottom navigation */}
        {!hideNav && (
          <nav
            className="md:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-50 rounded-[1.5rem] sm:rounded-[2rem] border border-black/10 bg-[#fbf7ef]/95 backdrop-blur-xl shadow-xl"
            aria-label="Main"
          >
            <div className="flex justify-around items-stretch h-14 sm:h-16 min-h-[56px] sm:min-h-[64px] px-1 sm:px-2">
              {NAV_ITEMS.map((item) => {
                const active = item.match(location.pathname)
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center flex-1 gap-0.5 sm:gap-1 transition-colors rounded-xl sm:rounded-2xl ${
                      active ? 'text-stone-950' : 'text-stone-500'
                    }`}
                  >
                    <Icon size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={active ? 2.5 : 2} />
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </section>
    </div>
  )
}
