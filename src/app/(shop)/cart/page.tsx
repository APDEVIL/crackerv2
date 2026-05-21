"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/components/shop/CartItem";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  district: z.string().min(1, "District is required"),
});

type AddressForm = z.infer<typeof addressSchema>;

const emptyAddress: AddressForm = {
  name: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", district: "",
};

export default function CartPage() {
  const { cart, cartLoading, clearCart, cartTotal, cartCount, budget, budgetExceeded } =
    useStore();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  const utils = api.useUtils();

  // Pre-fill form from saved profile address
  const { data: profile } = api.profile.get.useQuery();

  const placeMutation = api.orders.place.useMutation({
    onSuccess: (order) => {
      setCheckoutOpen(false);
      setForm(emptyAddress);
      utils.cart.list.invalidate();
      utils.orders.myOrders.invalidate();
      toast.success(`Order ${order.orderNumber} placed!`, {
        description: "We'll confirm your order shortly.",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const shipping = cartTotal >= 500 ? 0 : 49;
  const grandTotal = cartTotal + shipping;

  function openCheckout() {
    // Pre-fill with profile address if available
    if (profile?.address) {
      setForm({
        name: profile.address.name ?? "",
        phone: profile.phone ?? "",
        line1: profile.address.line1 ?? "",
        line2: profile.address.line2 ?? "",
        city: profile.address.city ?? "",
        state: profile.address.state ?? "",
        pincode: profile.address.pincode ?? "",
        district: profile.address.district ?? "",
      });
    }
    setCheckoutOpen(true);
  }

  function handleField(key: keyof AddressForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handlePlaceOrder() {
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(flat).map(([k, v]) => [k, v?.[0]])
        ) as Partial<Record<keyof AddressForm, string>>
      );
      return;
    }
    placeMutation.mutate({ address: result.data });
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen px-4 py-6 pb-16">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
          🛒
        </div>
        <h2 className="font-serif text-2xl font-black text-gray-900">
          Your cart is empty
        </h2>
        <p className="text-sm text-gray-500">Add some crackers to get started!</p>
        <Link href="/products">
          <Button className="mt-2 gap-2 rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]">
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-gray-900">
          Your Cart
          <span className="ml-2 font-sans text-base font-normal text-gray-400">
            ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
        </h1>
        <button
          onClick={() => clearCart()}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      {/* Budget warning */}
      {budgetExceeded && budget && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Budget limit exceeded!
            </p>
            <p className="text-xs text-red-600">
              Your cart ({formatPrice(cartTotal)}) is over your ₹{budget} budget
              by {formatPrice(cartTotal - budget)}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart items */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {cart.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          <Link
            href="/products"
            className="mt-2 text-center text-sm font-medium text-[#D4380D] hover:underline"
          >
            + Continue shopping
          </Link>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-2xl border border-orange-100 bg-white p-5">
          <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({cartCount} items)</span>
              <span className="font-medium text-gray-900">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              {shipping === 0 ? (
                <span className="font-medium text-green-600">Free</span>
              ) : (
                <span className="font-medium text-gray-900">
                  {formatPrice(shipping)}
                </span>
              )}
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-400">
                Add {formatPrice(500 - cartTotal)} more for free shipping
              </p>
            )}
          </div>

          <Separator className="my-4" />

          <div className="mb-5 flex justify-between font-serif text-lg font-black">
            <span>Total</span>
            <span className="text-[#D4380D]">{formatPrice(grandTotal)}</span>
          </div>

          <Button
            className="w-full gap-2 rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]"
            onClick={openCheckout}
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Cash on delivery · Orders ship within 2–3 days
          </p>
        </div>
      </div>

      {/* ── Checkout Dialog ──────────────────────────────────── */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-black">
              Delivery Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {(
              [
                { key: "name", label: "Full Name", placeholder: "Ramesh Kumar" },
                { key: "phone", label: "Phone", placeholder: "9876543210" },
                { key: "line1", label: "Address Line 1", placeholder: "12, Rose Nagar" },
                { key: "line2", label: "Address Line 2 (optional)", placeholder: "Near Bus Stand" },
                { key: "city", label: "City", placeholder: "Sivakasi" },
                { key: "district", label: "District", placeholder: "Virudhunagar" },
                { key: "state", label: "State", placeholder: "Tamil Nadu" },
                { key: "pincode", label: "Pincode", placeholder: "626189" },
              ] as { key: keyof AddressForm; label: string; placeholder: string }[]
            ).map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs font-medium text-gray-700">
                  {label}
                </Label>
                <Input
                  value={form[key]}
                  onChange={(e) => handleField(key, e.target.value)}
                  placeholder={placeholder}
                  className={errors[key] ? "border-red-400" : ""}
                />
                {errors[key] && (
                  <p className="mt-0.5 text-[11px] text-red-500">{errors[key]}</p>
                )}
              </div>
            ))}

            <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
              <p className="font-semibold text-orange-800">
                Cash on Delivery (COD)
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Pay when your order arrives. Total:{" "}
                <strong>{formatPrice(grandTotal)}</strong>
              </p>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={placeMutation.isPending}
              className="w-full rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]"
            >
              {placeMutation.isPending ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}