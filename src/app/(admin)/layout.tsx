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
  X,
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

function SidebarContent({
  collapsed,
  onToggle,
  onNavClick,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col">
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
                    onClick={onNavClick}
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
          onClick={onNavClick}
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
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [])

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

      {/* ── DESKTOP sidebar ─────────────────────────────────── */}
      <aside
        className={cn(
          'hidden md:flex h-screen flex-col border-r border-orange-100 bg-white transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* ── MOBILE drawer backdrop ───────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE drawer ────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-orange-100 flex flex-col transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-orange-100 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="font-serif text-lg font-black text-gray-900">
              {pageTitle}
            </h1>
          </div>
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}