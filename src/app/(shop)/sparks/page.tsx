'use client'

import { Sparkles } from 'lucide-react'
import { ProductGrid, ProductGridSkeleton } from '@/components/shop/ProductGrid'
import { toProducts } from '@/lib/types'
import { api } from '@/trpc/react'

export default function SparkZonePage() {
  const { data: rawProducts = [], isLoading: productsLoading } =
    api.products.list.useQuery({})

  const { data: categories = [], isLoading: categoriesLoading } =
    api.categories.list.useQuery()

  const products = toProducts(rawProducts)
  const isLoading = productsLoading || categoriesLoading

  return (
    <div className="min-h-screen px-4 py-6 pb-16 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[#D4380D]" />
        <div>
          <h1 className="font-serif text-2xl font-black text-gray-900">
            Spark Zone
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isLoading
              ? 'Loading...'
              : `${products.length} crackers — same great picks, your personal space`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <ProductGrid
          crackers={products}
          categories={categories}
          showFilters={true}
        />
      )}
    </div>
  )
}
