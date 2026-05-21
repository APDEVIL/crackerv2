"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import { type Product, type CartItem } from "@/lib/types";

type StoreContextType = {
  cart: CartItem[];
  cartLoading: boolean;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  wishlist: string[];
  toggleWishlist: (productId: string, name: string) => void;
  isWishlisted: (productId: string) => boolean;
  budget: number | null;
  setBudget: (amount: number | null) => void;
  budgetExceeded: boolean;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const utils = api.useUtils();

  // ── Auth state — only run protected queries when logged in ─
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  const [budget, setBudgetState] = useState<number | null>(null);

  // ── Cart — only fetch when authenticated ──────────────────
  const { data: rawCart = [], isLoading: cartLoading } =
    api.cart.list.useQuery(undefined, {
      enabled: isLoggedIn,
      retry: false, // don't retry on UNAUTHORIZED
    });

  const cart: CartItem[] = rawCart.map((item) => ({
    id:         item.id,
    userId:     item.userId,
    productId:  item.productId,
    quantity:   item.quantity,
    createdAt:  item.createdAt,
    updatedAt:  item.updatedAt,
    product: {
      ...item.product,
      rating:       parseFloat(item.product.rating),
      categorySlug: item.product.category.slug,
    },
  }));

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addMutation = api.cart.add.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
    onError:   (err) => toast.error(err.message),
  });

  const removeMutation = api.cart.remove.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
    onError:   (err) => toast.error(err.message),
  });

  const updateMutation = api.cart.updateQty.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
    onError:   (err) => toast.error(err.message),
  });

  const clearMutation = api.cart.clear.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
    onError:   (err) => toast.error(err.message),
  });

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      if (!isLoggedIn) {
        toast.error("Please sign in to add items to cart");
        return;
      }
      const newTotal = cartTotal + product.price * qty;
      if (budget && newTotal > budget) {
        toast.warning("Budget limit reached!", {
          description: `Your cart (₹${newTotal}) exceeds your budget of ₹${budget}.`,
        });
      }
      addMutation.mutate(
        { productId: product.id, quantity: qty },
        {
          onSuccess: () => {
            toast.success(`${product.name} added to cart`, {
              description: `${qty} × ₹${product.price}`,
            });
          },
        }
      );
    },
    [addMutation, cartTotal, budget, isLoggedIn]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      removeMutation.mutate(
        { productId },
        { onSuccess: () => toast.info("Item removed from cart") }
      );
    },
    [removeMutation]
  );

  const updateQty = useCallback(
    (productId: string, qty: number) => {
      if (qty < 1) return;
      updateMutation.mutate({ productId, quantity: qty });
    },
    [updateMutation]
  );

  const clearCart = useCallback(() => {
    clearMutation.mutate(undefined, {
      onSuccess: () => toast.info("Cart cleared"),
    });
  }, [clearMutation]);

  // ── Wishlist — only fetch when authenticated ───────────────
  const { data: wishlist = [] } = api.wishlist.ids.useQuery(undefined, {
    enabled: isLoggedIn,
    retry: false,
  });

  const toggleMutation = api.wishlist.toggle.useMutation({
    onSuccess: () => {
      utils.wishlist.ids.invalidate();
      utils.wishlist.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleWishlist = useCallback(
    (productId: string, name: string) => {
      if (!isLoggedIn) {
        toast.error("Please sign in to save items");
        return;
      }
      const currently = wishlist.includes(productId);
      toggleMutation.mutate(
        { productId },
        {
          onSuccess: (result) => {
            if (result.action === "added") {
              toast.success(`${name} added to wishlist`);
            } else {
              toast.info(`${name} removed from wishlist`);
            }
          },
        }
      );
    },
    [toggleMutation, wishlist, isLoggedIn]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  // ── Budget ─────────────────────────────────────────────────
  const setBudgetMutation = api.profile.setBudget.useMutation();

  const setBudget = useCallback(
    (amount: number | null) => {
      setBudgetState(amount);
      if (isLoggedIn) {
        setBudgetMutation.mutate({ budget: amount });
      }
      if (amount === null) {
        toast.info("Budget limit removed");
      } else {
        toast.success(`Budget set to ₹${amount}`);
      }
    },
    [setBudgetMutation, isLoggedIn]
  );

  const budgetExceeded = budget !== null && cartTotal > budget;

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartLoading: isLoggedIn ? cartLoading : false,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal,
        wishlist,
        toggleWishlist,
        isWishlisted,
        budget,
        setBudget,
        budgetExceeded,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}