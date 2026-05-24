import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Image,
  Video,
  Film,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useHealth } from '@/api/hooks'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/image', icon: Image, label: 'Image' },
  { to: '/video', icon: Video, label: 'Video' },
  { to: '/storyboard', icon: Film, label: 'Storyboard' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppLayout() {
  const { data: healthData } = useHealth()
  const connected = healthData?.extension_connected ?? false

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 gap-2 border-r border-border bg-bg-secondary">
        <div className="w-9 h-9 rounded-lg bg-accent-purple flex items-center justify-center text-white font-bold text-sm mb-4">
          FK
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={label}
              className={({ isActive }) =>
                `w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent-purple/20 text-accent-purple'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`
              }
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </nav>

        <div
          title={connected ? 'Extension connected' : 'Extension disconnected'}
          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
            connected ? 'text-accent-green' : 'text-accent-red'
          }`}
        >
          {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
