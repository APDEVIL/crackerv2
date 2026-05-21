"use client";

import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowUpRight, ArrowRight,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toProducts } from "@/lib/types";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { data: rawOrders = [], isLoading: ordersLoading } =
    api.orders.listAll.useQuery({});

  const { data: rawProducts = [], isLoading: productsLoading } =
    api.products.list.useQuery({ onlyActive: false });

  const { data: customers = [], isLoading: customersLoading } =
    api.customers.list.useQuery();

  const products = toProducts(rawProducts);
  const isLoading = ordersLoading || productsLoading || customersLoading;

  // ── Derived stats ──────────────────────────────────────────
  const totalRevenue = rawOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);

  const recentOrders = [...rawOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const topProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5);

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue),
      change: "+12.5%",
      up: true,
      icon: TrendingUp,
      bg: "bg-orange-50",
      iconColor: "text-[#D4380D]",
    },
    {
      label: "Total Orders",
      value: rawOrders.length,
      change: "+8.2%",
      up: true,
      icon: ShoppingBag,
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Customers",
      value: customers.length,
      change: "+4.1%",
      up: true,
      icon: Users,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Products",
      value: products.length,
      change: "active",
      up: null,
      icon: Package,
      bg: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl xl:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-orange-100 bg-white p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {card.label}
              </p>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  card.bg
                )}
              >
                <card.icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
            </div>
            <p className="mb-1 font-serif text-2xl font-black text-gray-900">
              {card.value}
            </p>
            {card.up !== null ? (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  card.up ? "text-green-600" : "text-red-500"
                )}
              >
                <ArrowUpRight
                  className={cn("h-3 w-3", !card.up && "rotate-180")}
                />
                {card.change} this month
              </p>
            ) : (
              <p className="text-xs text-gray-400">{card.change}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-orange-100 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <h2 className="font-serif text-base font-bold text-gray-900">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium text-[#D4380D] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-orange-50">
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No orders yet
              </p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-orange-50/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.addrName} · {formatDate(order.createdAt.toString())}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                      STATUS_COLOR[order.status]
                    )}
                  >
                    {order.status}
                  </span>
                  <span className="flex-shrink-0 text-sm font-bold text-[#D4380D]">
                    {formatPrice(order.total)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-orange-100 bg-white">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <h2 className="font-serif text-base font-bold text-gray-900">
              Top Products
            </h2>
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-xs font-medium text-[#D4380D] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-orange-50 p-2">
            {topProducts.map((p, i) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-orange-50/50 transition"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-400">{p.reviewCount} reviews</p>
                </div>
                <span className="flex-shrink-0 text-sm font-bold text-[#D4380D]">
                  {formatPrice(p.price)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/admin/products/new", label: "Add Product", emoji: "➕" },
          { href: "/admin/orders",       label: "View Orders", emoji: "📦" },
          { href: "/admin/customers",    label: "Customers",   emoji: "👥" },
          { href: "/admin/slides",       label: "Edit Slides", emoji: "🖼️" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-orange-100 bg-white p-5 text-center transition hover:border-orange-200 hover:shadow-sm hover:shadow-orange-100"
          >
            <span className="text-2xl">{action.emoji}</span>
            <span className="text-sm font-medium text-gray-700">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}