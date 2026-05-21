"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { type Product } from "@/lib/types";
import { formatPrice, getDiscount, cn } from "@/lib/utils";

const fallbackGradients: Record<string, string> = {
  rocket: "from-slate-900 to-blue-950",
  bijli: "from-violet-950 to-purple-950",
  atom: "from-emerald-950 to-green-950",
  "flower-pot": "from-amber-950 to-yellow-950",
  sparklers: "from-orange-950 to-red-950",
  chakkar: "from-neutral-900 to-stone-950",
};

const fallbackEmoji: Record<string, string> = {
  rocket: "🚀",
  bijli: "⚡",
  atom: "💥",
  "flower-pot": "🌸",
  sparklers: "✨",
  chakkar: "🌀",
};

type Props = {
  cracker: Product;
  compact?: boolean;
};

export function ProductCard({ cracker, compact = false }: Props) {
  const { cart, addToCart, updateQty, removeFromCart, toggleWishlist, isWishlisted } =
    useStore();

  const wishlisted = isWishlisted(cracker.id);
  const discount = cracker.originalPrice
    ? getDiscount(cracker.price, cracker.originalPrice)
    : null;

  const gradient =
    fallbackGradients[cracker.categorySlug] ?? "from-neutral-900 to-stone-950";
  const emoji = fallbackEmoji[cracker.categorySlug] ?? "🎆";

  const cartItem = cart.find((i) => i.productId === cracker.id);
  const inCart = !!cartItem;

  const [qty, setQty] = useState(cartItem?.quantity ?? 1);
  const isFirstRender = useRef(true);

  // Keep local qty in sync when cart updates externally
  useEffect(() => {
    if (cartItem) setQty(cartItem.quantity);
  }, [cartItem?.quantity]);

  // ✅ FIXED: Only calls updateQty for items already in cart.
  //    Never calls addToCart — that only happens via explicit handleAddClick.
  //    This was the root cause of cart.add receiving {} — the old else branch
  //    called addToCart(cracker, qty) on every +/− click before the item was
  //    in cart, with a stale cracker reference where product.id was undefined.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (inCart) {
      updateQty(cracker.id, qty);
    }
    // No else — addToCart is ONLY called from handleAddClick
  }, [qty]);

  function handleDecrement() {
    setQty((q) => Math.max(1, q - 1));
  }

  function handleIncrement() {
    setQty((q) => q + 1);
  }

  function handleManualInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setQty(val);
  }

  // ✅ Sole place addToCart is ever called from this component
  function handleAddClick() {
    if (!inCart) {
      addToCart(cracker, qty);
    }
  }

  const lineTotal = cracker.price * qty;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white transition-shadow hover:shadow-md hover:shadow-orange-100">

      {cracker.tag && (
        <div className="absolute left-2 top-2 z-10">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold",
              cracker.tag === "Best Seller" && "bg-yellow-300 text-yellow-900",
              cracker.tag === "New" && "bg-sky-200 text-sky-900",
              cracker.tag === "Sale" && "bg-red-500 text-white",
              cracker.tag === "Popular" && "bg-orange-200 text-orange-900"
            )}
          >
            {cracker.tag}
          </span>
        </div>
      )}

      <button
        onClick={() => toggleWishlist(cracker.id, cracker.name)}
        className={cn(
          "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-white/90 transition",
          wishlisted
            ? "border-red-200 text-red-500"
            : "border-gray-200 text-gray-400 hover:text-red-400"
        )}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-red-500")} />
      </button>

      <Link href={`/products/${cracker.id}`} className="block">
        <div className={cn("relative w-full overflow-hidden", compact ? "h-28" : "h-36")}>
          {cracker.images[0] && cracker.images[0].includes("utfs.io") ? (
            <Image
              src={cracker.images[0]}
              alt={cracker.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center bg-gradient-to-br",
                gradient
              )}
            >
              <span className="text-4xl">{emoji}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${cracker.id}`}>
          <p className="truncate text-[13px] font-semibold text-gray-900 hover:text-[#D4380D]">
            {cracker.name}
          </p>
        </Link>
        <p className="mb-1 text-[11px] text-gray-400">{cracker.packSize}</p>

        {!compact && (
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] text-gray-500">
              {cracker.rating} ({cracker.reviewCount})
            </span>
          </div>
        )}

        <div className="mt-auto">
          <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-[#D4380D]">
              {formatPrice(cracker.price)}
            </span>
            {cracker.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(cracker.originalPrice)}
              </span>
            )}
            {discount && (
              <span className="ml-auto text-[10px] font-semibold text-green-600">
                {discount}% off
              </span>
            )}
          </div>

          {qty > 1 && (
            <div className="mb-1.5 flex items-center justify-between rounded-lg bg-orange-50 px-2 py-1">
              <span className="text-[10px] text-gray-500">
                {qty} × {formatPrice(cracker.price)}
              </span>
              <span className="text-[11px] font-bold text-[#D4380D]">
                {formatPrice(lineTotal)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDecrement}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={handleManualInput}
              className="h-6 w-8 rounded-md border border-gray-200 text-center text-xs font-medium text-gray-800 outline-none focus:border-orange-300"
            />
            <button
              onClick={handleIncrement}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              +
            </button>

            {inCart ? (
              <div className="ml-auto flex items-center gap-1 rounded-md bg-green-50 border border-green-200 px-2 h-6">
                <ShoppingCart className="h-3 w-3 text-green-600" />
                <span className="text-[10px] font-semibold text-green-600">
                  In Cart
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleAddClick}
                className="ml-auto h-6 rounded-md px-2.5 text-[11px] font-semibold bg-[#D4380D] text-white hover:bg-[#b82e08]"
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}