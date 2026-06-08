'use client'

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Search,
  Truck,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate, formatPrice } from '@/lib/utils'
import type { RouterOutputs } from '@/trpc/react'
import { api } from '@/trpc/react'

// ── Derive order type from tRPC output ─────────────────────
type Order = RouterOutputs['orders']['myOrders'][number]

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-amber-100 text-amber-800',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'bg-blue-100 text-blue-800',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
  },
}

const MONTHS = [
  'All',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// ── Order Card ─────────────────────────────────────────────
function OrderCard({ order, onView }: { order: Order; onView: () => void }) {
  const status = STATUS_CONFIG[order.status]
  const Icon = status.icon

  return (
    <div
      className="cursor-pointer rounded-2xl border border-orange-100 bg-white p-4 transition hover:shadow-sm hover:shadow-orange-100"
      onClick={onView}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-gray-400">{order.orderNumber}</p>
          <p className="text-sm font-semibold text-gray-900">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            status.color,
          )}
        >
          <Icon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {order.items.slice(0, 3).map((item, i) => (
          <span
            key={i}
            className="rounded-lg bg-gray-50 px-2 py-1 text-[11px] text-gray-600"
          >
            {item.product.name} ×{item.quantity}
          </span>
        ))}
        {order.items.length > 3 && (
          <span className="rounded-lg bg-gray-50 px-2 py-1 text-[11px] text-gray-400">
            +{order.items.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(order.createdAt.toString())}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#D4380D]">
            {formatPrice(order.total)}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

// ── Order Detail Modal ─────────────────────────────────────
function OrderDetailModal({
  order,
  open,
  onClose,
}: {
  order: Order | null
  open: boolean
  onClose: () => void
}) {
  if (!order) return null
  const status = STATUS_CONFIG[order.status]
  const Icon = status.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-black">
            Order {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                status.color,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {status.label}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(order.createdAt.toString())}
            </span>
          </div>

          {/* Items */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Items
            </p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product.name}
                    <span className="ml-1 text-gray-400">×{item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.priceAtPurchase * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-[#D4380D]">{formatPrice(order.total)}</span>
            </div>
          </div>

          <Separator />

          {/* Delivery address — from snapshotted columns */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Delivery address
            </p>
            <p className="text-sm text-gray-700">
              {order.addrName} · {order.addrPhone}
            </p>
            <p className="text-sm text-gray-500">
              {order.addrLine1}
              {order.addrLine2 ? `, ${order.addrLine2}` : ''}
            </p>
            <p className="text-sm text-gray-500">
              {order.addrCity}, {order.addrState} – {order.addrPincode}
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
            <p className="font-semibold text-orange-800">Cash on Delivery</p>
            <p className="text-xs text-orange-600 mt-0.5">
              Payment status:{' '}
              <span className="font-semibold capitalize">
                {order.paymentStatus}
              </span>
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => window.print()}
          >
            🖨 Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ───────────────────────────────────────────────────
export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('All')
  const [selected, setSelected] = useState<Order | null>(null)

  const { data: orders = [], isLoading } = api.orders.myOrders.useQuery({})

  const filtered = useMemo(() => {
    let list = [...orders]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.items.some((i) => i.product.name.toLowerCase().includes(q)),
      )
    }

    if (month !== 'All') {
      const mIdx = MONTHS.indexOf(month) - 1
      list = list.filter((o) => new Date(o.createdAt).getMonth() === mIdx)
    }

    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [orders, search, month])

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-6 pb-16">
        <Skeleton className="mb-6 h-8 w-36" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-16">
      <div className="mb-6 flex items-center gap-3">
        <Package className="h-5 w-5 text-[#D4380D]" />
        <h1 className="font-serif text-2xl font-black text-gray-900">
          My Orders
        </h1>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 pl-8 text-xs"
          />
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-4xl">📦</span>
          <p className="text-sm text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => setSelected(order)}
            />
          ))}
        </div>
      )}

      <OrderDetailModal
        order={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
