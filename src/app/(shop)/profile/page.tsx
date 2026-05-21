"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User, Package, Heart, MapPin, Phone, Mail,
  ChevronRight, Edit2, LogOut, ShoppingBag, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { useStore } from "@/lib/store";
import { UploadButton } from "@/lib/uploadthing";
import { authClient } from "@/server/better-auth/client";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped:   "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ProfilePage() {
  const router = useRouter();
  const utils = api.useUtils();
  const { wishlist } = useStore();

  // ── Queries ────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } =
    api.profile.get.useQuery();

  const { data: orders = [], isLoading: ordersLoading } =
    api.orders.myOrders.useQuery({});

  // ── Mutations ──────────────────────────────────────────────
  const updatePhoneMutation = api.profile.updatePhone.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Phone updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateAddressMutation = api.profile.updateAddress.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Address saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateAvatarMutation = api.profile.updateAvatar.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Avatar updated");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Local form state ───────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);

  const [phoneForm, setPhoneForm] = useState("");
  const [addrForm, setAddrForm] = useState({
    name: "", line1: "", line2: "",
    city: "", state: "", pincode: "", district: "",
  });

  function openEdit() {
    setPhoneForm(profile?.phone ?? "");
    setEditOpen(true);
  }

  function openAddr() {
    setAddrForm({
      name:     profile?.address?.name     ?? "",
      line1:    profile?.address?.line1    ?? "",
      line2:    profile?.address?.line2    ?? "",
      city:     profile?.address?.city     ?? "",
      state:    profile?.address?.state    ?? "",
      pincode:  profile?.address?.pincode  ?? "",
      district: profile?.address?.district ?? "",
    });
    setAddrOpen(true);
  }

  function handleSavePhone() {
    if (!phoneForm.trim()) return;
    updatePhoneMutation.mutate(
      { phone: phoneForm },
      { onSuccess: () => setEditOpen(false) }
    );
  }

  function handleSaveAddress() {
    updateAddressMutation.mutate(
      addrForm,
      { onSuccess: () => setAddrOpen(false) }
    );
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  // ── Derived ────────────────────────────────────────────────
  const recentOrders = orders.slice(0, 3);
  const totalSpent = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const isLoading = profileLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-6 pb-20 max-w-xl mx-auto space-y-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const initials = profile?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen px-4 py-6 pb-20 max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <User className="h-5 w-5 text-[#D4380D]" />
        <h1 className="font-serif text-2xl font-black text-gray-900">
          My Profile
        </h1>
      </div>

      {/* Avatar + Info */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 mb-4">
        <div className="flex items-center gap-4">

          {/* Avatar with upload */}
          <div className="relative shrink-0">
            {profile?.image ? (
              <img
                src={profile.image}
                alt={profile.name ?? "avatar"}
                className="h-16 w-16 rounded-full object-cover border border-orange-100"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl font-black text-[#D4380D] border border-orange-100">
                {initials}
              </div>
            )}
            {/* Upload overlay */}
            <UploadButton
              endpoint="userAvatar"
              onClientUploadComplete={(res) => {
                const url = res[0]?.url;
                if (url) updateAvatarMutation.mutate({ imageUrl: url });
              }}
              onUploadError={(err) => { toast.error(err.message); }}
              appearance={{
                button:
                  "absolute bottom-0 right-0 h-5 w-5 rounded-full bg-[#D4380D] text-white p-0 after:hidden ut-uploading:bg-orange-400",
                allowedContent: "hidden",
              }}
              content={{
                button: <Camera className="h-2.5 w-2.5" />,
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate">
              {profile?.name ?? "—"}
            </p>
            <p className="text-xs text-gray-400 truncate">{profile?.email ?? "—"}</p>
            {profile?.createdAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Member since {formatDate(profile.createdAt.toString())}
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl shrink-0"
            onClick={openEdit}
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Contact details */}
        <div className="space-y-2">
          {profile?.phone && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {profile.phone}
            </div>
          )}
          {profile?.email && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {profile.email}
            </div>
          )}
          {profile?.address?.line1 ? (
            <div className="flex items-start gap-2.5 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>
                {profile.address.line1}, {profile.address.city},{" "}
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
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Orders",  value: orders.length,          icon: "📦" },
          { label: "Wishlist",value: wishlist.length,         icon: "❤️" },
          { label: "Spent",   value: formatPrice(totalSpent), icon: "💰" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-orange-100 bg-white p-3 text-center"
          >
            <p className="text-xl mb-1">{stat.icon}</p>
            <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="rounded-2xl border border-orange-100 bg-white mb-4 overflow-hidden">
        {[
          { label: "My Orders", href: "/orders",   icon: ShoppingBag },
          { label: "Wishlist",  href: "/wishlist", icon: Heart },
        ].map((link, i) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition",
                  i > 0 && "border-t border-gray-100"
                )}
              >
                <Icon className="h-4 w-4 text-[#D4380D]" />
                <span className="flex-1 text-sm font-medium text-gray-700">
                  {link.label}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Recent Orders</p>
            <Link href="/orders" className="text-xs text-[#D4380D] font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-orange-100 bg-white px-4 py-3 flex items-center gap-3"
              >
                <Package className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {order.items[0]?.product.name}
                    {order.items.length > 1 && (
                      <span className="text-gray-400 font-normal">
                        {" "}+{order.items.length - 1} more
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border-0",
                      STATUS_COLOR[order.status]
                    )}
                  >
                    {order.status}
                  </Badge>
                  <p className="text-xs font-semibold text-[#D4380D] mt-1">
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
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 text-red-500 text-sm font-medium hover:bg-red-50 transition"
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
                value={profile?.name ?? ""}
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
              className="w-full rounded-xl bg-[#D4380D] hover:bg-[#b82e08] text-white"
              onClick={handleSavePhone}
              disabled={updatePhoneMutation.isPending}
            >
              {updatePhoneMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Address Dialog ────────────────────────────── */}
      <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-black">
              Delivery Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {(
              [
                { key: "name",     label: "Full Name",              placeholder: "Ramesh Kumar"   },
                { key: "line1",    label: "Address Line 1",         placeholder: "12, Rose Nagar" },
                { key: "line2",    label: "Address Line 2 (opt.)",  placeholder: "Near Bus Stand" },
                { key: "city",     label: "City",                   placeholder: "Sivakasi"       },
                { key: "district", label: "District",               placeholder: "Virudhunagar"   },
                { key: "state",    label: "State",                  placeholder: "Tamil Nadu"     },
                { key: "pincode",  label: "Pincode",                placeholder: "626189"         },
              ] as { key: keyof typeof addrForm; label: string; placeholder: string }[]
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
              className="w-full rounded-xl bg-[#D4380D] hover:bg-[#b82e08] text-white"
              onClick={handleSaveAddress}
              disabled={updateAddressMutation.isPending}
            >
              {updateAddressMutation.isPending ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}