// ============================================================
// SHARED TYPES — replaces Cracker/Category from mock-data.ts
// These match both the tRPC response shape AND what components expect
// ============================================================

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryId: string;
  category: Category;
  // flat fields components expect
  categorySlug: string;
  images: string[];
  videoUrl: string | null;
  packSize: string;
  stock: number;
  tag: "Best Seller" | "New" | "Sale" | "Popular" | null;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CartItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
  createdAt: Date;
  updatedAt: Date;
};

export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: Date;
};

export type SlideItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ── Mapper — tRPC response → Product ──────────────────────
// tRPC returns rating as string (numeric drizzle column)
// components expect rating as number
// categorySlug lives on category.slug — flatten it here
export function toProduct(raw: {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryId: string;
  category: { id: string; name: string; slug: string; image: string };
  images: string[];
  videoUrl: string | null;
  packSize: string;
  stock: number;
  tag: "Best Seller" | "New" | "Sale" | "Popular" | null;
  isActive: boolean;
  rating: string;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}): Product {
  return {
    ...raw,
    rating: parseFloat(raw.rating),
    categorySlug: raw.category.slug,
  };
}

export function toProducts(raws: Parameters<typeof toProduct>[0][]): Product[] {
  return raws.map(toProduct);
}