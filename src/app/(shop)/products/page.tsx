"use client";

import { Package } from "lucide-react";
import { api } from "@/trpc/react";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/ProductGrid";
import { toProducts } from "@/lib/types";

export default function ProductsPage() {
  const { data: rawProducts = [], isLoading: productsLoading } =
    api.products.list.useQuery({});

  const { data: categories = [], isLoading: categoriesLoading } =
    api.categories.list.useQuery();

  const products = toProducts(rawProducts);
  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="min-h-screen px-4 py-6 pb-16 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Package className="h-5 w-5 text-[#D4380D]" />
        <div>
          <h1 className="font-serif text-2xl font-black text-gray-900">
            All Products
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isLoading ? "Loading..." : `${products.length} crackers available`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <ProductGrid
          crackers={products}
          categories={categories}
          showFilters={true}
        />
      )}
    </div>
  );
}