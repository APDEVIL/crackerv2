'use client'

import {
  Bell,
  ChevronLeft,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { authClient } from '@/server/better-auth/client'
import { api } from '@/trpc/react'

const NAV = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products', icon: Package, label: 'Products' },
      { href: '/admin/slides', icon: ImageIcon, label: 'Hero Slides' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
      { href: '/admin/customers', icon: Users, label: 'Customers' },
    ],
  },
]

function Sidebar({
  collapsed,
  onToggle,
  userName,
}: {
  collapsed: boolean
  onToggle: () => void
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-orange-100 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-orange-100 px-4">
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-serif text-sm font-black text-[#D4380D]">
              DS Cracker
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[2px] text-gray-400">
              Admin Panel
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {NAV.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === '/admin/dashboard'
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-[#D4380D]/10 text-[#D4380D]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                      collapsed && 'justify-center',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-orange-100 p-3 space-y-0.5">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Back to store' : undefined}
        >
          {!collapsed && <span>← View Store</span>}
          {collapsed && <span className="text-xs">←</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // ✅ Session guard
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return
    if (!session || session.user?.role !== 'admin') {
      router.replace('/')
    }
  }, [session, isPending, router])

  const { data: profile } = api.profile.get.useQuery()
  const userName = profile?.name ?? 'Admin'
  const initial = userName.charAt(0).toUpperCase()

  const pageTitle = (() => {
    if (pathname === '/admin/dashboard') return 'Dashboard'
    if (pathname.startsWith('/admin/products/new')) return 'New Product'
    if (pathname.match(/\/admin\/products\/.+/)) return 'Edit Product'
    if (pathname === '/admin/products') return 'Products'
    if (pathname === '/admin/customers') return 'Customers'
    if (pathname.match(/\/admin\/customers\/.+/)) return 'Customer Details'
    if (pathname === '/admin/orders') return 'Orders'
    if (pathname.match(/\/admin\/orders\/.+/)) return 'Order Details'
    if (pathname === '/admin/slides') return 'Hero Slides'
    return 'Admin'
  })()

  // ✅ Show spinner while checking session
  if (isPending || !session || session.user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf7f4]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4380D]" />
          <p className="text-sm text-gray-500">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf7f4]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        userName={userName}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-orange-100 bg-white px-6">
          <h1 className="font-serif text-lg font-black text-gray-900">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
              <Bell className="h-3.5 w-3.5" />
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4380D] text-xs font-bold text-white"
              title={userName}
            >
              {initial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
