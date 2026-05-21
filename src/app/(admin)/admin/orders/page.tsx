"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";

type Order = RouterOutputs["orders"]["listAll"][number];

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("all");
  const [district, setDistrict] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  const { data: orders = [], isLoading } = api.orders.listAll.useQuery(
    status !== "all"
      ? { status: status as Order["status"] }
      : {}
  );

  // Unique districts derived from live data
  const districts = useMemo(
    () => [...new Set(orders.map((o) => o.addrDistrict))].sort(),
    [orders]
  );

  const filtered = useMemo(() => {
    let list = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.addrName.toLowerCase().includes(q)
      );
    }

    if (district !== "all") {
      list = list.filter((o) => o.addrDistrict === district);
    }

    if (dateFrom) {
      list = list.filter(
        (o) => new Date(o.createdAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      list = list.filter(
        (o) =>
          new Date(o.createdAt) <= new Date(dateTo + "T23:59:59")
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, search, district, dateFrom, dateTo]);

  const activeFilters = [
    district !== "all",
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by order ID or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["pending","confirmed","shipped","delivered","cancelled"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-xl text-sm relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4380D] text-[9px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <div>
                <Label className="text-xs font-semibold text-gray-600">
                  District
                </Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="All districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600">
                  Date From
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600">
                  Date To
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl text-sm"
                onClick={() => {
                  setDistrict("all");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <p className="ml-auto text-xs text-gray-400">{filtered.length} orders</p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-orange-100 bg-gray-50/70">
              <tr>
                {["Order ID","Customer","Date","Items","Status","Total",""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.addrName}</p>
                      <p className="text-xs text-gray-400">{order.addrDistrict}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(order.createdAt.toString())}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.items.length}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                        STATUS_COLOR[order.status]
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#D4380D]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`}>
                        <button className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-[#D4380D] transition">
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}