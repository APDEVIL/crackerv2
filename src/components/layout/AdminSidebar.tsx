'use client'

import {
  BarChart3,
  ChevronRight,
  Flame,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { authClient } from '@/server/better-auth/client'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Slides', href: '/admin/slides', icon: ImageIcon },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    disabled: true,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/40">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-wide">
            DS Cracker
          </p>
          <p className="text-zinc-500 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-600/20'
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
                item.disabled &&
                  'opacity-40 cursor-not-allowed pointer-events-none',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  isActive
                    ? 'text-orange-400'
                    : 'text-zinc-500 group-hover:text-zinc-300',
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-orange-500/70" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-0.5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="px-4 pb-4">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-zinc-200 transition-all"
        >
          ← View Store
        </Link>
      </div>
    </aside>
  )
}
