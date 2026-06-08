'use client'

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  Flame,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  Truck,
  XCircle,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { api } from '@/trpc/react'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

const statusConfig: Record<
  OrderStatus,
  {
    label: string
    color: string
    icon: React.ElementType
    bg: string
  }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30 border-amber-700/40',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-blue-400',
    bg: 'bg-blue-900/30 border-blue-700/40',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-400',
    bg: 'bg-purple-900/30 border-purple-700/40',
  },
  delivered: {
    label: 'Delivered',
    icon: Package,
    color: 'text-green-400',
    bg: 'bg-green-900/30 border-green-700/40',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/30 border-red-700/40',
  },
}

const STATUS_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
]

function isOrderStatus(v: string): v is OrderStatus {
  return Object.keys(statusConfig).includes(v)
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const utils = api.useUtils()

  const rawId = Array.isArray(params.id)
    ? (params.id[0] ?? '')
    : (params.id ?? '')

  const { data: order, isLoading } = api.orders.getById.useQuery(
    { id: rawId },
    { enabled: !!rawId },
  )

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('pending')

  // Sync local state when order loads
  useEffect(() => {
    if (order && isOrderStatus(order.status)) {
      setCurrentStatus(order.status)
    }
  }, [order?.status, order])

  const updateMutation = api.orders.updateStatus.useMutation({
    onSuccess: (updated) => {
      utils.orders.getById.invalidate({ id: rawId })
      utils.orders.listAll.invalidate()
      if (isOrderStatus(updated.status)) {
        setCurrentStatus(updated.status)
      }
      toast.success('Order status updated')
    },
    onError: (err) => toast.error(err.message),
  })

  function handleStatusSave() {
    updateMutation.mutate({ id: rawId, status: currentStatus })
  }

  if (isLoading || !order) {
    return (
      <div className="min-h-screen space-y-4 bg-zinc-950 p-6">
        <Skeleton className="h-10 w-48 bg-zinc-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-zinc-800" />
      </div>
    )
  }

  const statusInfo = statusConfig[currentStatus]
  const StatusIcon = statusInfo.icon
  const stepIndex = STATUS_STEPS.indexOf(currentStatus)

  // Use snapshotted address columns
  const shipping = order.shipping

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 transition-colors hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold">
                Order{' '}
                <span className="font-mono text-orange-400">
                  {order.orderNumber}
                </span>
              </h1>
              <p className="text-xs text-zinc-500">
                Placed on {formatDate(order.createdAt.toString())}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Status + update */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
              statusInfo.bg,
              statusInfo.color,
            )}
          >
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </div>

          {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
            <div className="flex items-center gap-2 print:hidden">
              <span className="text-sm text-zinc-500">Update status:</span>
              <Select
                value={currentStatus}
                onValueChange={(v) => {
                  if (isOrderStatus(v)) setCurrentStatus(v)
                }}
              >
                <SelectTrigger className="h-9 w-40 border-zinc-700 bg-zinc-800 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-800">
                  {(Object.keys(statusConfig) as OrderStatus[]).map((key) => (
                    <SelectItem key={key} value={key} className="text-zinc-200">
                      {statusConfig[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 bg-orange-600 text-white hover:bg-orange-700"
                onClick={handleStatusSave}
                disabled={
                  updateMutation.isPending || currentStatus === order.status
                }
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        {/* Progress tracker */}
        {currentStatus !== 'cancelled' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Order Progress
            </p>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= stepIndex
                const isCurrent = i === stepIndex
                const cfg = statusConfig[step]
                const StepIcon = cfg.icon
                return (
                  <div
                    key={step}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                          isCompleted
                            ? isCurrent
                              ? 'border-orange-500 bg-orange-600 text-white shadow-lg shadow-orange-900/40'
                              : 'border-green-600 bg-green-900/40 text-green-400'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-600',
                        )}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          'mt-1.5 text-xs font-medium',
                          isCompleted ? 'text-zinc-300' : 'text-zinc-600',
                        )}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'mx-1 mb-5 h-0.5 flex-1',
                          i < stepIndex ? 'bg-green-700' : 'bg-zinc-700',
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left — items + totals */}
          <div className="space-y-4 lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <h2 className="font-semibold text-zinc-100">
                  Items ({order.items.length})
                </h2>
                <span className="text-sm text-zinc-500">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>
              <div className="divide-y divide-zinc-800">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-900 to-red-900 text-xl">
                      🎆
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-100">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatPrice(item.priceAtPurchase)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-zinc-100">
                      {formatPrice(item.priceAtPurchase * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-4 font-semibold text-zinc-100">
                Price Breakdown
              </h2>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-400' : ''}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator className="bg-zinc-800" />
              <div className="flex justify-between text-lg font-bold text-zinc-100">
                <span>Total</span>
                <span className="text-orange-400">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Right — customer, address, payment */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600/20 text-xs text-orange-400">
                  C
                </span>
                Customer
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-zinc-100">{order.user.name}</p>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Mail className="h-3.5 w-3.5" />
                  {order.user.email}
                </div>
              </div>
            </div>

            {/* Delivery address — from snapshot columns */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-100">
                <MapPin className="h-4 w-4 text-orange-400" />
                Delivery Address
              </h2>
              <div className="space-y-0.5 text-sm leading-relaxed text-zinc-400">
                <p className="font-medium text-zinc-200">{order.addrName}</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {order.addrPhone}
                </div>
                <p>{order.addrLine1}</p>
                {order.addrLine2 && <p>{order.addrLine2}</p>}
                <p>
                  {order.addrCity}, {order.addrDistrict}
                </p>
                <p>
                  {order.addrState} – {order.addrPincode}
                </p>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-4 font-semibold text-zinc-100">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Method</span>
                  <span className="uppercase text-zinc-200">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span
                    className={cn(
                      'font-medium capitalize',
                      order.paymentStatus === 'paid'
                        ? 'text-green-400'
                        : order.paymentStatus === 'failed'
                          ? 'text-red-400'
                          : 'text-amber-400',
                    )}
                  >
                    {order.paymentStatus}
                    {order.paymentStatus === 'paid' && ' ✓'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print receipt */}
        <div className="mt-8 hidden border-t-2 border-black pt-6 print:block">
          <div className="mb-6 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <Flame className="h-5 w-5" />
              <span className="text-xl font-bold">DS Cracker</span>
            </div>
            <p className="text-sm text-gray-600">Official Receipt</p>
          </div>
          <div className="mb-4 flex justify-between text-sm">
            <span>Order: {order.orderNumber}</span>
            <span>Date: {formatDate(order.createdAt.toString())}</span>
          </div>
          <div className="space-y-1 border-b border-t border-gray-300 py-3 text-sm">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.priceAtPurchase * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-gray-300 pt-2 text-base font-bold">
              <span>TOTAL</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            Thank you for shopping with DS Cracker! Happy Diwali 🎆
          </p>
        </div>
      </div>
    </div>
  )
}
