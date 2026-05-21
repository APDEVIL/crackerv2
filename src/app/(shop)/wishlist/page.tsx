"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { toProduct } from "@/lib/types";

export default function WishlistPage() {
  const { data: wishlistItems = [], isLoading } =
    api.wishlist.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-6 pb-16">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-orange-100 bg-white p-3"
            >
              <Skeleton className="mb-3 h-36 w-full rounded-xl" />
              <Skeleton className="mb-1.5 h-4 w-3/4" />
              <Skeleton className="mb-3 h-3 w-1/2" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl">
          🤍
        </div>
        <h2 className="font-serif text-2xl font-black text-gray-900">
          Wishlist is empty
        </h2>
        <p className="text-sm text-gray-500">
          Tap the heart on any product to save it here.
        </p>
        <Link href="/products">
          <Button className="mt-2 gap-2 rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-16">
      <div className="mb-6 flex items-center gap-3">
        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
        <h1 className="font-serif text-2xl font-black text-gray-900">
          Wishlist
          <span className="ml-2 font-sans text-base font-normal text-gray-400">
            ({wishlistItems.length} saved)
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {wishlistItems.map((item) => (
          <ProductCard
            key={item.id}
            cracker={toProduct(item.product)}
          />
        ))}
      </div>
    </div>
  );
}