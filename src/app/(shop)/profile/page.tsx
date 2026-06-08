'use client'

import {
  Camera,
  ChevronRight,
  Edit2,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/lib/store'
import { UploadButton } from '@/lib/uploadthing'
import { cn, formatDate, formatPrice } from '@/lib/utils'
import { authClient } from '@/server/better-auth/client'
import { api } from '@/trpc/react'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function ProfilePage() {
  const router = useRouter()
  const utils = api.useUtils()
  const { wishlist } = useStore()

  // ── Queries ────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } =
    api.profile.get.useQuery()

  const { data: orders = [], isLoading: ordersLoading } =
    api.orders.myOrders.useQuery({})

  // ── Mutations ──────────────────────────────────────────────
  const updatePhoneMutation = api.profile.updatePhone.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate()
      toast.success('Phone updated')
    },
    onError: (err) => toast.error(err.message),
  })

  const updateAddressMutation = api.profile.updateAddress.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate()
      toast.success('Address saved')
    },
    onError: (err) => toast.error(err.message),
  })

  const updateAvatarMutation = api.profile.updateAvatar.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate()
      toast.success('Avatar updated')
    },
    onError: (err) => toast.error(err.message),
  })

  // ── Local form state ───────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [addrOpen, setAddrOpen] = useState(false)

  const [phoneForm, setPhoneForm] = useState('')
  const [addrForm, setAddrForm] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    district: '',
  })

  function openEdit() {
    setPhoneForm(profile?.phone ?? '')
    setEditOpen(true)
  }

  function openAddr() {
    setAddrForm({
      name: profile?.address?.name ?? '',
      line1: profile?.address?.line1 ?? '',
      line2: profile?.address?.line2 ?? '',
      city: profile?.address?.city ?? '',
      state: profile?.address?.state ?? '',
      pincode: profile?.address?.pincode ?? '',
      district: profile?.address?.district ?? '',
    })
    setAddrOpen(true)
  }

  function handleSavePhone() {
    if (!phoneForm.trim()) return
    updatePhoneMutation.mutate(
      { phone: phoneForm },
      { onSuccess: () => setEditOpen(false) },
    )
  }

  function handleSaveAddress() {
    updateAddressMutation.mutate(addrForm, {
      onSuccess: () => setAddrOpen(false),
    })
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  // ── Derived ────────────────────────────────────────────────
  const recentOrders = orders.slice(0, 3)
  const totalSpent = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0)

  const isLoading = profileLoading || ordersLoading

  if (isLoading) {
    return (
      <div className="min-h-screen max-w-xl mx-auto space-y-4 px-4 py-6 pb-20">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const initials = profile?.name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen max-w-xl mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <User className="h-5 w-5 text-[#D4380D]" />
        <h1 className="font-serif text-2xl font-black text-gray-900">
          My Profile
        </h1>
      </div>

      {/* Avatar + Info */}
      <div className="mb-4 rounded-2xl border border-orange-100 bg-white p-5">
        <div className="flex items-center gap-4">
          {/* Avatar with upload */}
          <div className="relative shrink-0">
            {profile?.image ? (
              <Image
                src={profile.image}
                alt={profile.name ?? 'avatar'}
                width={64}
                height={64}
                className="rounded-full border border-orange-100 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-2xl font-black text-[#D4380D]">
                {initials}
              </div>
            )}
            {/* Upload overlay */}
            <UploadButton
              endpoint="userAvatar"
              onClientUploadComplete={(res) => {
                const url = res[0]?.url
                if (url) updateAvatarMutation.mutate({ imageUrl: url })
              }}
              onUploadError={(err) => {
                toast.error(err.message)
              }}
              appearance={{
                button:
                  'absolute bottom-0 right-0 h-5 w-5 rounded-full bg-[#D4380D] text-white p-0 after:hidden ut-uploading:bg-orange-400',
                allowedContent: 'hidden',
              }}
              content={{
                button: <Camera className="h-2.5 w-2.5" />,
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-gray-900">
              {profile?.name ?? '—'}
            </p>
            <p className="truncate text-xs text-gray-400">
              {profile?.email ?? '—'}
            </p>
            {profile?.createdAt && (
              <p className="mt-0.5 text-xs text-gray-400">
                Member since {formatDate(profile.createdAt.toString())}
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-xl"
            onClick={openEdit}
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Contact details */}
        <div className="space-y-2">
          {profile?.phone && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {profile.phone}
            </div>
          )}
          {profile?.email && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {profile.email}
            </div>
          )}
          {profile?.address?.line1 ? (
            <div className="flex items-start gap-2.5 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>
                {profile.address.line1}, {profile.address.city},{' '}
                {profile.address.state} – {profile.address.pincode}
              </span>
            </div>
          ) : (
            <button
              onClick={openAddr}
              className="flex items-center gap-2 text-xs text-[#D4380D] hover:underline"
            >
              <MapPin className="h-3.5 w-3.5" />
              Add delivery address
            </button>
          )}
        </div>

        {/* Edit address link */}
        {profile?.address?.line1 && (
          <button
            onClick={openAddr}
            className="mt-3 text-xs text-[#D4380D] hover:underline"
          >
            Edit address
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Orders', value: orders.length, icon: '📦' },
          { label: 'Wishlist', value: wishlist.length, icon: '❤️' },
          { label: 'Spent', value: formatPrice(totalSpent), icon: '💰' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-orange-100 bg-white p-3 text-center"
          >
            <p className="mb-1 text-xl">{stat.icon}</p>
            <p className="text-sm font-bold text-gray-900">{stat.value}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-orange-100 bg-white">
        {[
          { label: 'My Orders', href: '/orders', icon: ShoppingBag },
          { label: 'Wishlist', href: '/wishlist', icon: Heart },
        ].map((link, i) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition',
                  i > 0 && 'border-t border-gray-100',
                )}
              >
                <Icon className="h-4 w-4 text-[#D4380D]" />
                <span className="flex-1 text-sm font-medium text-gray-700">
                  {link.label}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Recent Orders</p>
            <Link href="/orders" className="text-xs font-medium text-[#D4380D]">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3"
              >
                <Package className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-gray-400">
                    {order.orderNumber}
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {order.items[0]?.product.name}
                    {order.items.length > 1 && (
                      <span className="font-normal text-gray-400">
                        {' '}
                        +{order.items.length - 1} more
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    className={cn(
                      'rounded-full border-0 px-2 py-0.5 text-[10px]',
                      STATUS_COLOR[order.status],
                    )}
                  >
                    {order.status}
                  </Badge>
                  <p className="mt-1 text-xs font-semibold text-[#D4380D]">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      {/* ── Edit Phone Dialog ──────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-black">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Full Name</Label>
              <Input
                value={profile?.name ?? ''}
                disabled
                className="rounded-xl bg-gray-50 text-gray-400"
              />
              <p className="text-[10px] text-gray-400">
                Name is managed by your account provider
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Phone</Label>
              <Input
                value={phoneForm}
                onChange={(e) => setPhoneForm(e.target.value)}
                placeholder="9876543210"
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]"
              onClick={handleSavePhone}
              disabled={updatePhoneMutation.isPending}
            >
              {updatePhoneMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Address Dialog ────────────────────────────── */}
      <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
        <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-black">
              Delivery Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {(
              [
                {
                  key: 'name',
                  label: 'Full Name',
                  placeholder: 'Ramesh Kumar',
                },
                {
                  key: 'line1',
                  label: 'Address Line 1',
                  placeholder: '12, Rose Nagar',
                },
                {
                  key: 'line2',
                  label: 'Address Line 2 (opt.)',
                  placeholder: 'Near Bus Stand',
                },
                { key: 'city', label: 'City', placeholder: 'Sivakasi' },
                {
                  key: 'district',
                  label: 'District',
                  placeholder: 'Virudhunagar',
                },
                { key: 'state', label: 'State', placeholder: 'Tamil Nadu' },
                { key: 'pincode', label: 'Pincode', placeholder: '626189' },
              ] as {
                key: keyof typeof addrForm
                label: string
                placeholder: string
              }[]
            ).map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-gray-500">{label}</Label>
                <Input
                  value={addrForm[key]}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="rounded-xl"
                />
              </div>
            ))}
            <Button
              className="w-full rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]"
              onClick={handleSaveAddress}
              disabled={updateAddressMutation.isPending}
            >
              {updateAddressMutation.isPending ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
