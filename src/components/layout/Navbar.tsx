"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Heart, Search, Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { cartCount, wishlist } = useStore();
  const pathname  = usePathname();
  const router    = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  // Session — to show login vs profile
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  // Profile for avatar initial
  const { data: profile } = api.profile.get.useQuery(undefined, {
    enabled: isLoggedIn,
  });
  const initial = profile?.name?.charAt(0)?.toUpperCase() ?? "U";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/",         label: "Home"       },
    { href: "/products", label: "Explore"    },
    { href: "/sparks",   label: "Spark Zone" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">

        {/* Logo */}
        <Link href="/" className="shrink-0">
          <div className="leading-tight">
            <p className="font-serif text-base font-black text-[#D4380D]">
              DS Cracker
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[2px] text-gray-400">
              Cracker Market
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#D4380D]",
                pathname === link.href ? "text-[#D4380D]" : "text-gray-500"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="flex flex-1 items-center">
          {searchOpen ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                autoFocus
                placeholder="Search crackers..."
                className="h-8 rounded-full pl-9 text-sm"
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 hover:border-orange-200 transition"
            >
              <Search className="h-3 w-3" />
              <span>Type a command or search...</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">

          {/* Wishlist */}
          <Link href="/wishlist">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 transition">
              <Heart className="h-3.5 w-3.5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <button className="relative flex h-8 items-center gap-1.5 rounded-full bg-[#D4380D] px-3 text-xs font-medium text-white hover:bg-[#b82e08] transition">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#D4380D]">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>

          {/* Profile / Auth */}
          {isLoggedIn ? (
            <Link href="/profile">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4380D]/10 text-xs font-bold text-[#D4380D] border border-[#D4380D]/20 hover:bg-[#D4380D]/20 transition"
                title={profile?.name ?? "Profile"}
              >
                {initial}
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                <User className="h-3.5 w-3.5" />
              </button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 md:hidden">
                <Menu className="h-3.5 w-3.5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium text-gray-700 hover:text-[#D4380D]"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/orders"
                  className="text-base font-medium text-gray-700 hover:text-[#D4380D]"
                >
                  My Orders
                </Link>
                <Link
                  href="/profile"
                  className="text-base font-medium text-gray-700 hover:text-[#D4380D]"
                >
                  Profile
                </Link>

                {isLoggedIn && (
                  <>
                    <Separator />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-base font-medium text-red-500 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                )}

                {!isLoggedIn && (
                  <>
                    <Separator />
                    <Link
                      href="/login"
                      className="text-base font-medium text-[#D4380D] hover:underline"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}