'use client'

import {
  Heart,
  Package,
  Play,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { use, useState } from 'react'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/lib/store'
import { toProduct, toProducts } from '@/lib/types'
import { cn, formatPrice, getDiscount } from '@/lib/utils'
import { api } from '@/trpc/react'

const fallbackGradients: Record<string, string> = {
  rocket: 'from-slate-900 to-blue-950',
  bijli: 'from-violet-950 to-purple-950',
  atom: 'from-emerald-950 to-green-950',
  'flower-pot': 'from-amber-950 to-yellow-950',
  sparklers: 'from-orange-950 to-red-950',
  chakkar: 'from-neutral-900 to-stone-950',
}

const fallbackEmoji: Record<string, string> = {
  rocket: '🚀',
  bijli: '⚡',
  atom: '💥',
  'flower-pot': '🌸',
  sparklers: '✨',
  chakkar: '🌀',
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const { data: raw, isLoading, error } = api.products.getById.useQuery({ id })
  const cracker = raw ? toProduct(raw) : null

  const { data: rawRelated = [] } = api.products.getByCategory.useQuery(
    { slug: cracker?.categorySlug ?? '' },
    { enabled: !!cracker },
  )

  const related = toProducts(rawRelated)
    .filter((c) => c.id !== id)
    .slice(0, 4)

  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [added, setAdded] = useState(false)

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-6 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !cracker) return notFound()

  const wishlisted = isWishlisted(cracker.id)
  const discount = cracker.originalPrice
    ? getDiscount(cracker.price, cracker.originalPrice)
    : null
  const gradient =
    fallbackGradients[cracker.categorySlug] ?? 'from-neutral-900 to-stone-950'
  const emoji = fallbackEmoji[cracker.categorySlug] ?? '🎆'

  function handleAdd() {
    addToCart(cracker!, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-4 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-600">
          Products
        </Link>
        <span>/</span>
        <Link
          href={`/products?category=${cracker.categorySlug}`}
          className="hover:text-gray-600"
        >
          {cracker.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-700">{cracker.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 px-4 lg:grid-cols-2">
        {/* ── Left: Image + Video Gallery ───────────────────── */}
        <div>
          <div className="relative mb-3 overflow-hidden rounded-2xl">
            {showVideo && cracker.videoUrl ? (
              <video
                src={cracker.videoUrl}
                controls
                autoPlay
                className="aspect-video w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                <div
                  className={cn(
                    'flex h-full w-full items-center justify-center bg-gradient-to-br',
                    gradient,
                  )}
                >
                  <span className="text-8xl">{emoji}</span>
                </div>
                {cracker.images[activeImg]?.includes('utfs.io') && (
                  <Image
                    src={cracker.images[activeImg]!}
                    alt={cracker.name}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            )}

            {cracker.videoUrl && !showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70 transition"
              >
                <Play className="h-3 w-3 fill-white" />
                Watch demo
              </button>
            )}
            {showVideo && (
              <button
                onClick={() => setShowVideo(false)}
                className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80"
              >
                ✕ Close video
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {(cracker.images.length > 1 || cracker.videoUrl) && (
            <div className="flex gap-2">
              {cracker.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setShowVideo(false)
                    setActiveImg(i)
                  }}
                  className={cn(
                    'relative h-16 w-16 overflow-hidden rounded-xl border-2 transition',
                    activeImg === i && !showVideo
                      ? 'border-[#D4380D]'
                      : 'border-transparent hover:border-orange-200',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-full w-full items-center justify-center bg-gradient-to-br text-2xl',
                      gradient,
                    )}
                  >
                    {emoji}
                  </div>
                </button>
              ))}
              {cracker.videoUrl && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-xl border-2 bg-black/80 transition',
                    showVideo
                      ? 'border-[#D4380D]'
                      : 'border-transparent hover:border-orange-200',
                  )}
                >
                  <Play className="h-6 w-6 fill-white text-white" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Details ─────────────────────────────────── */}
        <div>
          {/* Tag + category */}
          <div className="mb-3 flex items-center gap-2">
            <Link
              href={`/products?category=${cracker.categorySlug}`}
              className="text-xs font-medium text-[#D4380D] hover:underline"
            >
              {cracker.category.name}
            </Link>
            {cracker.tag && (
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-bold',
                  cracker.tag === 'Best Seller' &&
                    'bg-yellow-200 text-yellow-900',
                  cracker.tag === 'New' && 'bg-sky-200 text-sky-900',
                  cracker.tag === 'Sale' && 'bg-red-500 text-white',
                  cracker.tag === 'Popular' && 'bg-orange-200 text-orange-900',
                )}
              >
                {cracker.tag}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="mb-1 font-serif text-3xl font-black text-gray-900">
            {cracker.name}
          </h1>

          {/* Rating */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'h-4 w-4',
                    s <= Math.round(cracker.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200',
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {cracker.rating} · {cracker.reviewCount} reviews
            </span>
          </div>

          {/* Price */}
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-serif text-3xl font-black text-[#D4380D]">
              {formatPrice(cracker.price)}
            </span>
            {cracker.originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(cracker.originalPrice)}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                {discount}% off
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mb-5 leading-relaxed text-gray-600">
            {cracker.description}
          </p>

          {/* Pack info */}
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3">
            <Package className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {cracker.packSize}
            </span>
            <span className="ml-auto text-xs text-orange-600">
              {cracker.stock > 0 ? `${cracker.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <Separator className="mb-5" />

          {/* Qty + Add to Cart */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-gray-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-xl"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-xl"
              >
                +
              </button>
            </div>

            <Button
              onClick={handleAdd}
              disabled={cracker.stock === 0}
              className={cn(
                'flex-1 gap-2 rounded-xl transition-all',
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-[#D4380D] text-white hover:bg-[#b82e08]',
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              {added
                ? 'Added to Cart!'
                : cracker.stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
            </Button>

            <button
              onClick={() => toggleWishlist(cracker.id, cracker.name)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border-2 transition',
                wishlisted
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400',
              )}
              aria-label="Add to wishlist"
            >
              <Heart className={cn('h-5 w-5', wishlisted && 'fill-red-500')} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Shield, text: 'Safe & certified' },
              { icon: Truck, text: 'Fast delivery' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5"
              >
                <Icon className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-600">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-12 px-4">
          <h2 className="mb-4 font-serif text-xl font-black text-gray-900">
            More in {cracker.category.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((c) => (
              <ProductCard key={c.id} cracker={c} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
