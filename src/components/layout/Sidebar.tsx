import {
  Home,
  List,
  LayoutGrid,
  Calendar,
  Headset,
  Users,
  BarChart,
  Settings,
  Flag,
  LogOut,
  Bell,
  User
} from 'lucide-react'
import logoLong from '../../assets/icons/logo-long.svg'
import { signOut } from '../../api/auth.api'
import type { AppRole, Profile } from '../../types/auth'

type SidebarProps = {
  role: AppRole | null
  profile: Profile | null
  currentPath?: string
}

type NavItem = {
  label: string
  icon: React.ElementType
  path: string
  roles: AppRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Strona główna', icon: Home, path: '/dashboard', roles: ['user', 'mentor', 'admin'] },
  { label: 'Quiz', icon: List, path: '/quiz', roles: ['admin'] },
  { label: 'Moduły', icon: LayoutGrid, path: '/modules', roles: ['admin'] },
  { label: 'Kalendarz', icon: Calendar, path: '/calendar', roles: ['admin'] },
  { label: 'Mentorzy', icon: Headset, path: '/mentors', roles: ['admin'] },
  { label: 'Użytkownicy', icon: Users, path: '/users', roles: ['admin'] },
  { label: 'Analityka', icon: BarChart, path: '/analytics', roles: ['admin'] },
]

export function Sidebar({ role, profile, currentPath = '/dashboard' }: SidebarProps) {
  const visibleNavItems = NAV_ITEMS.filter(item => role && item.roles.includes(role))

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const roleLabels: Record<AppRole, string> = {
    user: 'Użytkownik',
    mentor: 'Mentor',
    admin: 'Admin'
  }

  return (
    <aside className="h-screen sticky top-0 bg-[#ffffff] shadow-[4px_0_24px_rgba(0,0,0,0.03)] flex flex-col py-18 px-6 lg:px-8 z-20">

      {/* Top Block: Logo and Profile */}
      <div className="flex flex-col items-center mb-10 lg:mb-12">
        <img src={logoLong} alt="Relme" className="h-8 lg:h-10 w-auto object-contain mb-10" />

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-6">
            <div className="size-14 lg:size-16 rounded-full shadow-large overflow-hidden flex items-center justify-center border-4 border-[#F9F9F9] bg-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="size-5 lg:size-6 text-dark/50" />
              )}
            </div>

            <button className="cursor-pointer relative size-14 lg:size-16 flex items-center justify-center rounded-full shadow-large border-4 border-[#F9F9F9] bg-white transition-colors hover:bg-gray/20">
              <Bell className="size-[20px] lg:size-[24px] text-dark/80" />
              {/* Notification Badge Example */}
              <span className="absolute top-0 right-0 size-6 lg:size-7 rounded-full bg-[#E1AAA7] border-[3px] border-white text-[10px] font-bold text-white flex items-center justify-center translate-x-1/4 -translate-y-1/4">
                2
              </span>
            </button>
          </div>

          {role && (
            <div className="mt-8 lg:mt-10 px-4 py-1.5 lg:py-2 rounded-full bg-[#E1AAA7] text-white text-[10px] font-bold tracking-[1.07px] uppercase shadow-sm">
              {roleLabels[role]}
            </div>
          )}
        </div>
      </div>

      {/* Middle Block: Navigation */}
      <div className="flex-1 overflow-y-auto w-full">
        <nav className="flex flex-col gap-2">
          {visibleNavItems.map((item) => {
            const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/dashboard')
            return (
              <button
                key={item.label}
                onClick={() => {
                  window.history.pushState({}, '', item.path)
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
                className={`group cursor-pointer w-full flex items-center gap-3 lg:gap-4 px-[18px] lg:px-[20px] py-[14px] lg:py-[16px] rounded-[12px] lg:rounded-[14px] transition-all duration-200 font-manrope font-medium text-[14px] lg:text-[16px] leading-[24px] border ${isActive
                  ? 'bg-neutral text-dark border-dark'
                  : 'text-dark/60 hover:bg-gray/20 hover:text-dark border-transparent'
                  }`}
              >
                <item.icon className={`size-[16px] lg:size-[18px] transition-colors duration-200 ${isActive ? 'text-dark' : 'text-dark/60 group-hover:text-dark'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {role === 'admin' && (
          <>
            <div className="my-6 mx-4 border-t border-gray" />

            <nav className="flex flex-col gap-2">
              <button className="group cursor-pointer w-full flex items-center gap-3 lg:gap-4 px-[18px] lg:px-[20px] py-[14px] lg:py-[16px] rounded-[12px] lg:rounded-[14px] transition-all duration-200 font-manrope font-medium text-[14px] lg:text-[16px] leading-[24px] text-dark/60 hover:bg-gray/20 hover:text-dark border border-transparent">
                <Settings className="size-[16px] lg:size-[18px] text-dark/60 transition-colors duration-200 group-hover:text-dark" />
                <span>Ustawienia</span>
              </button>
              <button className="group cursor-pointer w-full flex items-center gap-3 lg:gap-4 px-[18px] lg:px-[20px] py-[14px] lg:py-[16px] rounded-[12px] lg:rounded-[14px] transition-all duration-200 font-manrope font-medium text-[14px] lg:text-[16px] leading-[24px] text-dark/60 hover:bg-gray/20 hover:text-dark border border-transparent">
                <Flag className="size-[16px] lg:size-[18px] text-dark/60 transition-colors duration-200 group-hover:text-dark" />
                <span>Pomoc</span>
              </button>
            </nav>
          </>
        )}
      </div>

      {/* Bottom Block: Logout */}
      <div className="mt-auto pt-4 w-full">
        <button
          onClick={handleLogout}
          className="group cursor-pointer w-full flex items-center justify-center gap-3 lg:gap-4 px-[18px] lg:px-[20px] py-[14px] lg:py-[16px] rounded-[12px] lg:rounded-[14px] transition-all duration-200 font-manrope font-medium text-[14px] lg:text-[16px] leading-[24px] text-dark/60 hover:bg-gray/20 hover:text-dark border border-transparent"
        >
          <LogOut className="size-[16px] lg:size-[18px] text-dark/60 transition-colors duration-200 group-hover:text-dark" />
          <span>Wyloguj się</span>
        </button>
      </div>

    </aside>
  )
}

export default Sidebar
