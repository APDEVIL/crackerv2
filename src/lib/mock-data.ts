// ============================================================
// MOCK DATA — Replace each query with tRPC call when backend ready
// Pattern: const products = mockProducts  →  api.products.list.useQuery()
// ============================================================

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
};

export type Cracker = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categorySlug: string;
  images: string[];
  videoUrl?: string;
  packSize: string;
  stock: number;
  tag?: "Best Seller" | "New" | "Sale" | "Popular";
  isActive: boolean;
  rating: number;
  reviewCount: number;
};

export type SlideItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
};

export type WishlistItem = {
  crackerId: string;
};

export type CartItem = {
  id: string;
  crackerId: string;
  quantity: number;
  cracker: Cracker;
};

export type Order = {
  customer: string;
  email: string;
  phone: string;
  pincode: string;
  paymentMethod: string;
  id: string;
  orderNumber: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
  createdAt: string;
  items: { cracker: Cracker; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  address: Address;
  district: string;
};

export type Address = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  district: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  address?: Address;
};

// ─── Slideshow (Admin can add/edit via dashboard) ──────────────────────────
export const mockSlides: SlideItem[] = [
  {
    id: "slide-1",
    title: "Celebrate Your Diwali",
    subtitle: "With Premium Crackers",
    image: "/slides/diwali-hero.jpg", // Replace with real uploaded image path
    ctaText: "Start Shopping",
    ctaLink: "/products",
    badge: "Diwali Collection 2024",
  },
  {
    id: "slide-2",
    title: "New Arrivals",
    subtitle: "Rockets, Bijli & More",
    image: "/slides/new-arrivals.jpg",
    ctaText: "Explore Now",
    ctaLink: "/products?tag=new",
    badge: "Just Launched",
  },
  {
    id: "slide-3",
    title: "Bulk Orders Welcome",
    subtitle: "Save up to 30% on bulk",
    image: "/slides/bulk-order.jpg",
    ctaText: "Get Quote",
    ctaLink: "/contact",
    badge: "Special Offer",
  },
];

// ─── Categories ────────────────────────────────────────────────────────────
export const mockCategories: Category[] = [
  { id: "cat-1", name: "Rocket", slug: "rocket", image: "/categories/rocket.jpg" },
  { id: "cat-2", name: "Bijli", slug: "bijli", image: "/categories/bijli.jpg" },
  { id: "cat-3", name: "Atom Bomb", slug: "atom", image: "/categories/atom.jpg" },
  { id: "cat-4", name: "Flower Pot", slug: "flower-pot", image: "/categories/flower-pot.jpg" },
  { id: "cat-5", name: "Sparklers", slug: "sparklers", image: "/categories/sparklers.jpg" },
  { id: "cat-6", name: "Ground Chakkars", slug: "chakkar", image: "/categories/chakkar.jpg" },
];

// ─── Crackers ──────────────────────────────────────────────────────────────
export const mockCrackers: Cracker[] = [
  {
    id: "cr-1",
    name: "Sara Pkt",
    description: "A classic assorted cracker pack perfect for families. Safe, vibrant, and long-lasting with a beautiful color spread. Ideal for home celebrations.",
    price: 299,
    originalPrice: 399,
    category: "Sparklers",
    categorySlug: "sparklers",
    images: ["/crackers/sara-1.jpg", "/crackers/sara-2.jpg"],
    videoUrl: "/crackers/sara-demo.mp4",
    packSize: "Pack of 10",
    stock: 150,
    tag: "Best Seller",
    isActive: true,
    rating: 4.8,
    reviewCount: 342,
  },
  {
    id: "cr-2",
    name: "Bijli Chain",
    description: "Rapid-fire bijli chain with stunning electrical effect. Creates an unforgettable sound and light show.",
    price: 149,
    category: "Bijli",
    categorySlug: "bijli",
    images: ["/crackers/bijli-1.jpg"],
    packSize: "Pack of 10",
    stock: 200,
    isActive: true,
    rating: 4.5,
    reviewCount: 198,
  },
  {
    id: "cr-3",
    name: "Laksmi Bomb",
    description: "Premium ground-burst cracker with powerful sound effect. A Diwali staple for generations.",
    price: 199,
    originalPrice: 249,
    category: "Atom Bomb",
    categorySlug: "atom",
    images: ["/crackers/laksmi-1.jpg"],
    packSize: "Pack of 10",
    stock: 80,
    tag: "Sale",
    isActive: true,
    rating: 4.6,
    reviewCount: 267,
  },
  {
    id: "cr-4",
    name: "Sky Shot 7 Color",
    description: "High-altitude rocket that bursts into 7 vibrant colors at peak height. Safe launch tube included.",
    price: 499,
    category: "Rocket",
    categorySlug: "rocket",
    images: ["/crackers/skyshot-1.jpg", "/crackers/skyshot-2.jpg"],
    videoUrl: "/crackers/skyshot-demo.mp4",
    packSize: "Pack of 5",
    stock: 60,
    tag: "New",
    isActive: true,
    rating: 4.9,
    reviewCount: 89,
  },
  {
    id: "cr-5",
    name: "Sparkle Wheel",
    description: "Ground-spinning flower pot with 180-second burn time and color-changing sparks.",
    price: 349,
    originalPrice: 449,
    category: "Flower Pot",
    categorySlug: "flower-pot",
    images: ["/crackers/wheel-1.jpg"],
    packSize: "Pack of 4",
    stock: 120,
    isActive: true,
    rating: 4.4,
    reviewCount: 156,
  },
  {
    id: "cr-6",
    name: "Ground Chakkar",
    description: "Fast-spinning ground chakkar with colorful fire trails. Fun for all ages.",
    price: 179,
    category: "Ground Chakkars",
    categorySlug: "chakkar",
    images: ["/crackers/chakkar-1.jpg"],
    packSize: "Pack of 8",
    stock: 220,
    tag: "Popular",
    isActive: true,
    rating: 4.3,
    reviewCount: 412,
  },
  {
    id: "cr-7",
    name: "Pencil Rocket",
    description: "Slim pencil-style rocket with whistle effect and golden trail.",
    price: 249,
    category: "Rocket",
    categorySlug: "rocket",
    images: ["/crackers/pencil-1.jpg"],
    packSize: "Pack of 10",
    stock: 45,
    isActive: true,
    rating: 4.7,
    reviewCount: 203,
  },
  {
    id: "cr-8",
    name: "Gold Sparkler",
    description: "Classic gold sparkler — burns bright for 90 seconds. Safe for children with parental supervision.",
    price: 99,
    category: "Sparklers",
    categorySlug: "sparklers",
    images: ["/crackers/sparkler-1.jpg"],
    packSize: "Pack of 25",
    stock: 500,
    isActive: true,
    rating: 4.6,
    reviewCount: 621,
  },
];

// ─── Mock Cart ─────────────────────────────────────────────────────────────
export const mockCartItems: CartItem[] = [
  { id: "ci-1", crackerId: "cr-1", quantity: 2, cracker: mockCrackers[0]! },
  { id: "ci-2", crackerId: "cr-4", quantity: 1, cracker: mockCrackers[3]! },
  { id: "ci-3", crackerId: "cr-8", quantity: 3, cracker: mockCrackers[7]! },
];

// ─── Mock Wishlist ─────────────────────────────────────────────────────────
export const mockWishlistIds: string[] = ["cr-2", "cr-6"];

// ─── Mock Orders ───────────────────────────────────────────────────────────
const mockAddress: Address = {
  name: "Ramesh Kumar",
  phone: "9876543210",
  line1: "12, Rose Nagar",
  line2: "Near Bus Stand",
  city: "Sivakasi",
  state: "Tamil Nadu",
  pincode: "626189",
  district: "Virudhunagar",
};

export const mockOrders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "DS-2024-0001",
    status: "delivered",
    paymentStatus: "paid",
    createdAt: "2024-10-28T10:30:00Z",
    items: [
      { cracker: mockCrackers[0]!, quantity: 2, price: 299 },
      { cracker: mockCrackers[3]!, quantity: 1, price: 499 },
    ],
    subtotal: 1097,
    discount: 0,
    total: 1097,
    address: mockAddress,
    district: "Virudhunagar",
    customer: "",
    email: "",
    phone: "",
    pincode: "",
    paymentMethod: ""
  },
  {
    id: "ord-2",
    orderNumber: "DS-2024-0002",
    status: "shipped",
    paymentStatus: "paid",
    createdAt: "2024-11-01T14:15:00Z",
    items: [
      { cracker: mockCrackers[7]!, quantity: 5, price: 99 },
      { cracker: mockCrackers[1]!, quantity: 2, price: 149 },
    ],
    subtotal: 793,
    discount: 50,
    total: 743,
    address: mockAddress,
    district: "Virudhunagar",
    customer: "",
    email: "",
    phone: "",
    pincode: "",
    paymentMethod: ""
  },
  {
    id: "ord-3",
    orderNumber: "DS-2024-0003",
    status: "pending",
    paymentStatus: "pending",
    createdAt: "2024-11-05T09:00:00Z",
    items: [
      { cracker: mockCrackers[4]!, quantity: 3, price: 349 },
    ],
    subtotal: 1047,
    discount: 0,
    total: 1047,
    address: mockAddress,
    district: "Chennai",
    customer: "",
    email: "",
    phone: "",
    pincode: "",
    paymentMethod: ""
  },
];

// ─── Mock Customers (Admin view) ───────────────────────────────────────────
export const mockCustomers: Customer[] = [
  {
    id: "user-1",
    name: "Ramesh Kumar",
    email: "ramesh@example.com",
    phone: "9876543210",
    joinedAt: "2024-09-15T00:00:00Z",
    totalOrders: 3,
    totalSpent: 2887,
    address: mockAddress,
  },
  {
    id: "user-2",
    name: "Priya Nair",
    email: "priya@example.com",
    phone: "9123456780",
    joinedAt: "2024-10-01T00:00:00Z",
    totalOrders: 1,
    totalSpent: 743,
  },
  {
    id: "user-3",
    name: "Arjun Sharma",
    email: "arjun@example.com",
    phone: "9988776655",
    joinedAt: "2024-10-20T00:00:00Z",
    totalOrders: 2,
    totalSpent: 1840,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
export function getCrackerById(id: string): Cracker | undefined {
  return mockCrackers.find((c) => c.id === id);
}

export function getCrackersByCategory(slug: string): Cracker[] {
  return mockCrackers.filter((c) => c.categorySlug === slug);
}

export function searchCrackers(query: string): Cracker[] {
  const q = query.toLowerCase();
  return mockCrackers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find((o) => o.id === id);
}

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find((c) => c.id === id);
}

export function calcCartTotal(items: CartItem[]): {
  subtotal: number;
  itemCount: number;
} {
  const subtotal = items.reduce(
    (sum, item) => sum + item.cracker.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}