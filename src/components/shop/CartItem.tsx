'use client'

import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { type CartItem as CartItemType } from '@/lib/types'
import { cn, formatPrice } from '@/lib/utils'

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

type Props = {
  item: CartItemType
}

export function CartItem({ item }: Props) {
  const { updateQty, removeFromCart } = useStore()
  const { product, quantity } = item

  const gradient =
    fallbackGradients[product.categorySlug] ?? 'from-neutral-900 to-stone-950'
  const emoji = fallbackEmoji[product.categorySlug] ?? '🎆'

  return (
    <div className="flex gap-3 rounded-2xl border border-orange-100 bg-white p-3">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="flex-shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl">
          {product.images[0] && product.images[0].includes('utfs.io') ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center bg-gradient-to-br',
                gradient,
              )}
            >
              <span className="text-2xl">{emoji}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/products/${product.id}`}>
              <p className="text-sm font-semibold text-gray-900 hover:text-[#D4380D]">
                {product.name}
              </p>
            </Link>
            <p className="text-xs text-gray-400">{product.packSize}</p>
          </div>
          <button
            onClick={() => removeFromCart(product.id)}
            className="ml-2 rounded-lg p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition"
            aria-label="Remove from cart"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Qty stepper */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                quantity === 1
                  ? removeFromCart(product.id)
                  : updateQty(product.id, quantity - 1)
              }
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              onClick={() => updateQty(product.id, quantity + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              +
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-bold text-[#D4380D]">
              {formatPrice(product.price * quantity)}
            </p>
            {quantity > 1 && (
              <p className="text-[11px] text-gray-400">
                {formatPrice(product.price)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
