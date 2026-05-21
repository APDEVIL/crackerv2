"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Search, Pencil, Trash2, Eye,
  ChevronUp, ChevronDown, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { toProducts, type Product } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";

const TAG_COLOR: Record<string, string> = {
  "Best Seller": "bg-yellow-100 text-yellow-800",
  "New": "bg-sky-100 text-sky-800",
  "Sale": "bg-red-100 text-red-700",
  "Popular": "bg-orange-100 text-orange-800",
};

type SortKey = "name" | "price" | "stock";

export default function AdminProductsPage() {
  const utils = api.useUtils();

  const { data: rawProducts = [], isLoading: productsLoading } =
    api.products.list.useQuery({ onlyActive: false });

  const { data: categories = [], isLoading: categoriesLoading } =
    api.categories.list.useQuery();

  const products = toProducts(rawProducts);

  const deleteMutation = api.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Product deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      list = list.filter((p) => p.categorySlug === category);
    }

    list.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });

    return list;
  }, [products, search, category, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-[#D4380D]" />
      : <ChevronDown className="h-3 w-3 text-[#D4380D]" />;
  }

  const isLoading = productsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} products</p>
        <Link href="/admin/products/new">
          <Button className="gap-2 rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-52 pl-8 text-sm"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-orange-100 bg-gray-50/70">
              <tr>
                {[
                  { label: "Product", col: "name" as SortKey },
                  { label: "Category", col: null },
                  { label: "Price", col: "price" as SortKey },
                  { label: "Stock", col: "stock" as SortKey },
                  { label: "Tag", col: null },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={() => col && toggleSort(col)}
                    className={cn(
                      "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500",
                      col && "cursor-pointer select-none hover:text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No products found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-orange-50/30 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.packSize}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.category.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#D4380D]">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="ml-1 text-xs text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-medium",
                        product.stock === 0
                          ? "text-red-500"
                          : product.stock < 20
                          ? "text-amber-600"
                          : "text-green-600"
                      )}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.tag ? (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          TAG_COLOR[product.tag] ?? "bg-gray-100 text-gray-600"
                        )}>
                          {product.tag}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/products/${product.id}`} target="_blank">
                          <button
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <Link href={`/admin/products/${product.id}`}>
                          <button
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-[#D4380D] transition"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This action cannot be undone. The product and its uploaded images
            will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}