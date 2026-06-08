'use client'

import { ArrowLeft, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toProduct } from '@/lib/types'
import { UploadButton } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'

const TAGS = ['Best Seller', 'New', 'Sale', 'Popular'] as const

type FormState = {
  name: string
  description: string
  price: string
  originalPrice: string
  categoryId: string
  packSize: string
  stock: string
  outOfStock: boolean
  tag: string
  isActive: boolean
  videoUrl: string
  images: string[]
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  categoryId: '',
  packSize: '',
  stock: '',
  outOfStock: false,
  tag: '',
  isActive: true,
  videoUrl: '',
  images: [],
}

export default function ProductFormPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const utils = api.useUtils()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  // ── Queries ────────────────────────────────────────────────
  const { data: categories = [], isLoading: categoriesLoading } =
    api.categories.list.useQuery()

  const { data: rawProduct, isLoading: productLoading } =
    api.products.getById.useQuery({ id }, { enabled: !isNew })

  // Pre-fill form when editing
  useEffect(() => {
    if (!rawProduct) return
    const p = toProduct(rawProduct)
    setForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      originalPrice: p.originalPrice?.toString() ?? '',
      categoryId: p.categoryId,
      packSize: p.packSize,
      stock: p.stock === 0 ? '' : p.stock.toString(),
      outOfStock: p.stock === 0,
      tag: p.tag ?? '',
      isActive: p.isActive,
      videoUrl: p.videoUrl ?? '',
      images: p.images,
    })
  }, [rawProduct])

  // ── Mutations ──────────────────────────────────────────────
  const createMutation = api.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate()
      toast.success('Product created!')
      router.push('/admin/products')
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = api.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate()
      utils.products.getById.invalidate({ id })
      toast.success('Product updated!')
      router.push('/admin/products')
    },
    onError: (err) => toast.error(err.message),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function removeImage(index: number) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!form.outOfStock && !form.stock) {
      toast.error('Please enter a stock quantity or mark as Out of Stock')
      return
    }

    const stockValue = form.outOfStock ? 0 : parseInt(form.stock)

    const payload = {
      name: form.name,
      description: form.description,
      price: parseInt(form.price),
      originalPrice: form.originalPrice
        ? parseInt(form.originalPrice)
        : undefined,
      categoryId: form.categoryId,
      packSize: form.packSize,
      stock: stockValue,
      tag: (form.tag as (typeof TAGS)[number]) || undefined,
      isActive: form.isActive,
      videoUrl: form.videoUrl || undefined,
      images: form.images,
    }

    if (isNew) {
      createMutation.mutate(payload)
    } else {
      updateMutation.mutate({ id, ...payload })
    }
  }

  const priceNum = parseFloat(form.price)
  const origNum = parseFloat(form.originalPrice)
  const discount =
    form.originalPrice && origNum > priceNum
      ? Math.round(((origNum - priceNum) / origNum) * 100)
      : null

  const isLoading = !isNew && (productLoading || categoriesLoading)

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/products"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="rounded-2xl border border-orange-100 bg-white">
        {/* Basic Info */}
        <div className="p-6">
          <h2 className="mb-4 font-serif text-base font-bold text-gray-900">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-gray-600">
                Product Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="e.g. Sky Shot 7 Color"
                value={form.name}
                onChange={set('name')}
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-gray-600">
                Description
              </Label>
              <textarea
                rows={3}
                placeholder="Describe the product..."
                value={form.description}
                onChange={set('description')}
                className="mt-1 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600">
                Category <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600">
                Pack Size
              </Label>
              <Input
                placeholder="e.g. Pack of 10"
                value={form.packSize}
                onChange={set('packSize')}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing & Stock */}
        <div className="p-6">
          <h2 className="mb-4 font-serif text-base font-bold text-gray-900">
            Pricing & Stock
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-gray-600">
                Selling Price (₹) <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="299"
                value={form.price}
                onChange={set('price')}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">
                Original Price (₹)
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="399"
                value={form.originalPrice}
                onChange={set('originalPrice')}
                className="mt-1 rounded-xl"
              />
              {discount && (
                <p className="mt-1 text-xs font-medium text-green-600">
                  {discount}% discount
                </p>
              )}
            </div>

            {/* Stock — full width row */}
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-gray-600">
                Stock <span className="text-red-400">*</span>
              </Label>

              {/* Toggle */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, outOfStock: false }))}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-xs font-semibold transition',
                    !form.outOfStock
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300',
                  )}
                >
                  In Stock
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, outOfStock: true, stock: '' }))
                  }
                  className={cn(
                    'rounded-xl border px-4 py-2 text-xs font-semibold transition',
                    form.outOfStock
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300',
                  )}
                >
                  Out of Stock
                </button>
              </div>

              {/* Quantity input — only shown when In Stock */}
              {!form.outOfStock && (
                <div className="mt-3">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter quantity e.g. 100"
                    value={form.stock}
                    onChange={set('stock')}
                    className="rounded-xl"
                  />
                </div>
              )}

              {/* Out of stock note */}
              {form.outOfStock && (
                <p className="mt-2 text-xs text-red-400">
                  Product will be marked as unavailable on the store.
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Badge & Status */}
        <div className="p-6">
          <h2 className="mb-4 font-serif text-base font-bold text-gray-900">
            Badge & Status
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-gray-600">
                Product Tag
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setForm((f) => ({ ...f, tag: '' }))}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold border transition',
                    !form.tag
                      ? 'border-gray-400 bg-gray-800 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400',
                  )}
                >
                  None
                </button>
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setForm((f) => ({ ...f, tag }))}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold border transition',
                      form.tag === tag
                        ? 'border-[#D4380D] bg-[#D4380D] text-white'
                        : 'border-gray-200 text-gray-500 hover:border-orange-300',
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600">
                Listing Status
              </Label>
              <div className="mt-2 flex gap-3">
                {([true, false] as const).map((active) => (
                  <button
                    key={String(active)}
                    onClick={() => setForm((f) => ({ ...f, isActive: active }))}
                    className={cn(
                      'flex-1 rounded-xl border py-2 text-xs font-semibold transition',
                      form.isActive === active
                        ? active
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-red-300 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300',
                    )}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Media */}
        <div className="p-6">
          <h2 className="mb-4 font-serif text-base font-bold text-gray-900">
            Media
          </h2>

          {/* Product Images */}
          <div className="mb-6">
            <Label className="text-xs font-semibold text-gray-600">
              Product Images
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.images.map((img, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-orange-100"
                >
                  <Image
                    src={img}
                    alt={`product-${i}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}

              {form.images.length < 8 && (
                <UploadButton
                  endpoint="productImages"
                  onClientUploadComplete={(res) => {
                    const urls = res.map((r) => r.url)
                    setForm((f) => ({
                      ...f,
                      images: [...f.images, ...urls].slice(0, 8),
                    }))
                    toast.success(`${urls.length} image(s) uploaded`)
                  }}
                  onUploadError={(err) => {
                    toast.error(err.message)
                  }}
                  appearance={{
                    button:
                      'h-20 w-20 rounded-xl border-2 border-dashed border-orange-200 bg-white text-gray-400 hover:border-orange-400 hover:text-orange-500 ut-uploading:border-orange-400',
                    allowedContent: 'hidden',
                  }}
                  content={{
                    button: (
                      <div className="flex flex-col items-center gap-1 text-[10px]">
                        <span className="text-lg">+</span>
                        Upload
                      </div>
                    ),
                  }}
                />
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Up to 8 images · JPG, PNG, WEBP · Max 4MB each
            </p>
          </div>

          {/* Product Video */}
          <div className="mb-4">
            <Label className="text-xs font-semibold text-gray-600">
              Demo Video
            </Label>
            {form.videoUrl ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs text-gray-600">
                  {form.videoUrl}
                </span>
                <button
                  onClick={() => setForm((f) => ({ ...f, videoUrl: '' }))}
                  className="rounded-full p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <UploadButton
                  endpoint="productVideo"
                  onClientUploadComplete={(res) => {
                    const url = res[0]?.url
                    if (url) {
                      setForm((f) => ({ ...f, videoUrl: url }))
                      toast.success('Video uploaded')
                    }
                  }}
                  onUploadError={(err) => {
                    toast.error(err.message)
                  }}
                  appearance={{
                    button:
                      'rounded-xl border-2 border-dashed border-orange-200 bg-white text-xs text-gray-500 hover:border-orange-400 px-4 py-2',
                    allowedContent: 'hidden',
                  }}
                  content={{ button: 'Upload Demo Video (max 64MB)' }}
                />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Shown on product detail page as "Watch demo"
            </p>
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center justify-between">
        <Link href="/admin/products">
          <Button variant="outline" className="rounded-xl">
            Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="gap-2 rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : isNew ? (
            'Create Product'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
