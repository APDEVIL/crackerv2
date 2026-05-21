"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } =
    api.customers.list.useQuery();

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-60 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} customers</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-60 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <Users className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-orange-50">
            {/* Head */}
            <div className="grid grid-cols-5 gap-4 bg-gray-50/70 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <span className="col-span-2">Customer</span>
              <span>Joined</span>
              <span>Orders</span>
              <span className="text-right">Total Spent</span>
            </div>

            {filtered.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="grid grid-cols-5 items-center gap-4 px-5 py-4 hover:bg-orange-50/40 transition"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4380D]/10 text-sm font-bold text-[#D4380D]">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(customer.createdAt.toString())}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {customer.totalOrders}
                </span>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-sm font-bold text-[#D4380D]">
                    {formatPrice(customer.totalSpent)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}