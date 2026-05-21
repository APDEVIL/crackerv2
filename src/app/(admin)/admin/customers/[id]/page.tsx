"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, MapPin,
  Package, ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { formatPrice, formatDate, cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: customer, isLoading } =
    api.customers.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!customer) return notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/customers"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl border border-orange-100 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#D4380D]/10 font-serif text-2xl font-black text-[#D4380D]">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl font-black text-gray-900">
              {customer.name}
            </h2>
            <p className="text-sm text-gray-500">
              Customer since {formatDate(customer.createdAt.toString())}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { label: "Total Orders", value: customer.totalOrders },
                { label: "Total Spent",  value: formatPrice(customer.totalSpent) },
                {
                  label: "Avg. Order",
                  value: formatPrice(
                    Math.round(
                      customer.totalSpent / (customer.totalOrders || 1)
                    )
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-orange-50/60 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact & address */}
      <div className="rounded-2xl border border-orange-100 bg-white p-6">
        <h3 className="mb-4 font-serif text-base font-bold text-gray-900">
          Contact Details
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-gray-700">{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-gray-700">{customer.phone}</span>
            </div>
          )}
          {customer.address?.line1 && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="text-gray-700">
                <p>
                  {customer.address.line1}
                  {customer.address.line2
                    ? `, ${customer.address.line2}`
                    : ""}
                </p>
                <p>
                  {customer.address.city}, {customer.address.state} –{" "}
                  {customer.address.pincode}
                </p>
                {customer.address.district && (
                  <p className="text-gray-400">{customer.address.district}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order history */}
      <div className="rounded-2xl border border-orange-100 bg-white">
        <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
          <h3 className="font-serif text-base font-bold text-gray-900">
            Order History
          </h3>
          <span className="text-xs text-gray-400">
            {customer.orders.length} orders
          </span>
        </div>

        {customer.orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-orange-50">
            {customer.orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/40 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    {order.items.length} items ·{" "}
                    {formatDate(order.createdAt.toString())}
                  </p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                  STATUS_COLOR[order.status]
                )}>
                  {order.status}
                </span>
                <span className="text-sm font-bold text-[#D4380D]">
                  {formatPrice(order.total)}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}