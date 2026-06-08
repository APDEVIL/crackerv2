'use client'

import Link from 'next/link'
import { BudgetLimiter } from '@/components/shop/BudgetLimiter'
import { HeroCarousel } from '@/components/shop/HeroCarousel'
import { ProductCard } from '@/components/shop/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { type Category, toProducts } from '@/lib/types'
import { api } from '@/trpc/react'

// ── Category Card ──────────────────────────────────────────
const gradients: Record<string, string> = {
  rocket: 'from-slate-900 via-blue-950 to-slate-900',
  bijli: 'from-violet-950 via-purple-900 to-violet-950',
  atom: 'from-emerald-950 via-green-900 to-emerald-950',
  'flower-pot': 'from-amber-950 via-yellow-900 to-amber-950',
  sparklers: 'from-orange-950 via-red-900 to-orange-950',
  chakkar: 'from-stone-900 via-neutral-800 to-stone-900',
}

const emojis: Record<string, string> = {
  rocket: '🚀',
  bijli: '⚡',
  atom: '💥',
  'flower-pot': '🌸',
  sparklers: '✨',
  chakkar: '🌀',
}

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link href={`/products?category=${cat.slug}`}>
      <div className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            gradients[cat.slug] ?? 'from-neutral-900 to-stone-900'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/5" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-3xl">{emojis[cat.slug] ?? '🎆'}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="font-serif text-sm font-bold text-white drop-shadow-lg">
            {cat.name}
          </p>
        </div>
      </div>
    </Link>
  )
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between px-4">
      <h2 className="font-serif text-xl font-black text-gray-900">{title}</h2>
      <Link
        href={href}
        className="text-xs font-medium text-[#D4380D] hover:underline"
      >
        View all →
      </Link>
    </div>
  )
}

function ProductRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-orange-100 bg-white p-3"
        >
          <Skeleton className="mb-3 h-36 w-full rounded-xl" />
          <Skeleton className="mb-1.5 h-4 w-3/4" />
          <Skeleton className="mb-3 h-3 w-1/2" />
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const { data: rawProducts = [], isLoading: productsLoading } =
    api.products.list.useQuery({})

  const { data: categories = [], isLoading: categoriesLoading } =
    api.categories.list.useQuery()

  const products = toProducts(rawProducts)

  const topSellers = products
    .filter((c) => c.tag === 'Best Seller' || c.tag === 'Popular')
    .slice(0, 6)

  const newArrivals = products.filter((c) => c.tag === 'New').slice(0, 3)

  return (
    <div className="pb-16">
      {/* Hero Slideshow — self-fetching */}
      <HeroCarousel />

      {/* Budget Limiter */}
      <div className="mt-4">
        <BudgetLimiter />
      </div>

      {/* Categories */}
      <section className="mb-8 mt-2">
        <SectionHeader title="Our Products" href="/products" />
        {categoriesLoading ? (
          <div className="grid grid-cols-4 gap-2.5 px-4 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 px-4 sm:grid-cols-6">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>

      {/* Top Sellers */}
      <section className="mb-8">
        <SectionHeader title="Top Sellers" href="/products?tag=Best+Seller" />
        {productsLoading ? (
          <ProductRowSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4">
            {topSellers.map((cracker) => (
              <ProductCard key={cracker.id} cracker={cracker} />
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      {(productsLoading || newArrivals.length > 0) && (
        <section className="mb-8">
          <SectionHeader title="New Arrivals" href="/products?tag=New" />
          {productsLoading ? (
            <ProductRowSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
              {newArrivals.map((cracker) => (
                <ProductCard key={cracker.id} cracker={cracker} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* All Products */}
      <section>
        <SectionHeader title="All Products" href="/products" />
        {productsLoading ? (
          <ProductRowSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((cracker) => (
              <ProductCard key={cracker.id} cracker={cracker} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
