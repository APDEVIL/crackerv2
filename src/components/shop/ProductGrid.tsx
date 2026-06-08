'use client'

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { type Category, type Product } from '@/lib/types'
import { ProductCard } from './ProductCard'

type Props = {
  // ✅ uses Product instead of Cracker
  crackers: Product[]
  categories: Category[]
  title?: string
  showFilters?: boolean
}

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'name'

export function ProductGrid({
  crackers,
  categories,
  title,
  showFilters = true,
}: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [maxPrice, setMaxPrice] = useState('all')

  const filtered = useMemo(() => {
    let list = [...crackers]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.name.toLowerCase().includes(q),
      )
    }

    if (category !== 'all') {
      list = list.filter((c) => c.categorySlug === category)
    }

    if (maxPrice !== 'all') {
      list = list.filter((c) => c.price <= parseInt(maxPrice))
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return list
  }, [crackers, search, category, sort, maxPrice])

  return (
    <div>
      {(title || showFilters) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {title && (
            <h2 className="font-serif text-xl font-bold text-gray-900">
              {title}
            </h2>
          )}

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search crackers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-44 pl-8 text-xs"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Max price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any price</SelectItem>
                  <SelectItem value="100">Under ₹100</SelectItem>
                  <SelectItem value="200">Under ₹200</SelectItem>
                  <SelectItem value="300">Under ₹300</SelectItem>
                  <SelectItem value="500">Under ₹500</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-2xl">🔍</p>
          <p className="mt-2 text-sm text-gray-500">No crackers found</p>
          <p className="text-xs text-gray-400">
            Try a different search or filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((cracker) => (
            <ProductCard key={cracker.id} cracker={cracker} />
          ))}
        </div>
      )}

      {showFilters && filtered.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          Showing {filtered.length} of {crackers.length} products
        </p>
      )}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
