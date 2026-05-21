"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Printer, Package, Truck,
  CheckCircle2, Clock, XCircle, MapPin,
  Phone, Mail, Flame, Edit,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/react";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
type Order = RouterOutputs["orders"]["getById"];

const statusConfig: Record<OrderStatus, {
  label: string;
  color: string;
  icon: React.ElementType;
  bg: string;
}> = {
  pending:   { label: "Pending",   icon: Clock,        color: "text-amber-400",  bg: "bg-amber-900/30 border-amber-700/40"   },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-blue-400",   bg: "bg-blue-900/30 border-blue-700/40"     },
  shipped:   { label: "Shipped",   icon: Truck,        color: "text-purple-400", bg: "bg-purple-900/30 border-purple-700/40" },
  delivered: { label: "Delivered", icon: Package,      color: "text-green-400",  bg: "bg-green-900/30 border-green-700/40"   },
  cancelled: { label: "Cancelled", icon: XCircle,      color: "text-red-400",    bg: "bg-red-900/30 border-red-700/40"       },
};

const STATUS_STEPS: OrderStatus[] = [
  "pending", "confirmed", "shipped", "delivered",
];

function isOrderStatus(v: string): v is OrderStatus {
  return Object.keys(statusConfig).includes(v);
}

export default function AdminOrderDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const utils   = api.useUtils();

  const rawId = Array.isArray(params.id)
    ? (params.id[0] ?? "")
    : (params.id ?? "");

  const { data: order, isLoading } = api.orders.getById.useQuery(
    { id: rawId },
    { enabled: !!rawId }
  );

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("pending");

  // Sync local state when order loads
  useEffect(() => {
    if (order && isOrderStatus(order.status)) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  const updateMutation = api.orders.updateStatus.useMutation({
    onSuccess: (updated) => {
      utils.orders.getById.invalidate({ id: rawId });
      utils.orders.listAll.invalidate();
      if (isOrderStatus(updated.status)) {
        setCurrentStatus(updated.status);
      }
      toast.success("Order status updated");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleStatusSave() {
    updateMutation.mutate({ id: rawId, status: currentStatus });
  }

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 space-y-4">
        <Skeleton className="h-10 w-48 bg-zinc-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-zinc-800" />
      </div>
    );
  }

  const statusInfo = statusConfig[currentStatus];
  const StatusIcon = statusInfo.icon;
  const stepIndex  = STATUS_STEPS.indexOf(currentStatus);

  // Use snapshotted address columns
  const shipping = order.shipping;
  const tax      = Math.round(order.subtotal * 0.05);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold">
                Order{" "}
                <span className="text-orange-400 font-mono">
                  {order.orderNumber}
                </span>
              </h1>
              <p className="text-zinc-500 text-xs">
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
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* Status + update */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium",
            statusInfo.bg, statusInfo.color
          )}>
            <StatusIcon className="w-4 h-4" />
            {statusInfo.label}
          </div>

          {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
            <div className="flex items-center gap-2 print:hidden">
              <span className="text-zinc-500 text-sm">Update status:</span>
              <Select value={currentStatus} onValueChange={(v) => {
                if (isOrderStatus(v)) setCurrentStatus(v);
              }}>
                <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-zinc-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {(Object.keys(statusConfig) as OrderStatus[]).map((key) => (
                    <SelectItem key={key} value={key} className="text-zinc-200">
                      {statusConfig[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white h-9"
                onClick={handleStatusSave}
                disabled={
                  updateMutation.isPending ||
                  currentStatus === order.status
                }
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* Progress tracker */}
        {currentStatus !== "cancelled" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-4">
              Order Progress
            </p>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= stepIndex;
                const isCurrent   = i === stepIndex;
                const cfg         = statusConfig[step];
                const StepIcon    = cfg.icon;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                        isCompleted
                          ? isCurrent
                            ? "border-orange-500 bg-orange-600 text-white shadow-lg shadow-orange-900/40"
                            : "border-green-600 bg-green-900/40 text-green-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-600"
                      )}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "text-xs mt-1.5 font-medium",
                        isCompleted ? "text-zinc-300" : "text-zinc-600"
                      )}>
                        {cfg.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mb-5 mx-1",
                        i < stepIndex ? "bg-green-700" : "bg-zinc-700"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — items + totals */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-100">
                  Items ({order.items.length})
                </h2>
                <span className="text-zinc-500 text-sm">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>
              <div className="divide-y divide-zinc-800">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-900 to-red-900 flex items-center justify-center text-xl shrink-0">
                      🎆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-zinc-500 text-sm">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-zinc-100 mb-4">
                Price Breakdown
              </h2>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-green-400" : ""}>
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator className="bg-zinc-800" />
              <div className="flex justify-between font-bold text-zinc-100 text-lg">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-600/20 flex items-center justify-center text-orange-400 text-xs">
                  C
                </span>
                Customer
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-zinc-100">
                  {order.user.name}
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  {order.user.email}
                </div>
              </div>
            </div>

            {/* Delivery address — from snapshot columns */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                Delivery Address
              </h2>
              <div className="text-zinc-400 text-sm leading-relaxed space-y-0.5">
                <p className="text-zinc-200 font-medium">{order.addrName}</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-100 mb-4">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Method</span>
                  <span className="text-zinc-200 uppercase">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className={cn(
                    "font-medium capitalize",
                    order.paymentStatus === "paid"
                      ? "text-green-400"
                      : order.paymentStatus === "failed"
                      ? "text-red-400"
                      : "text-amber-400"
                  )}>
                    {order.paymentStatus}
                    {order.paymentStatus === "paid" && " ✓"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print receipt */}
        <div className="hidden print:block mt-8 border-t-2 border-black pt-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-xl font-bold">DS Cracker</span>
            </div>
            <p className="text-sm text-gray-600">Official Receipt</p>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span>Order: {order.orderNumber}</span>
            <span>Date: {formatDate(order.createdAt.toString())}</span>
          </div>
          <div className="border-t border-b border-gray-300 py-3 space-y-1 text-sm">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>
                  {formatPrice(item.priceAtPurchase * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-3 space-y-1 text-sm">
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
            <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2 mt-2">
              <span>TOTAL</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">
            Thank you for shopping with DS Cracker! Happy Diwali 🎆
          </p>
        </div>
      </div>
    </div>
  );
}