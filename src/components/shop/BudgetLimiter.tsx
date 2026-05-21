"use client";

import { useState } from "react";
import { Wallet, X, PencilLine } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { formatPrice, cn } from "@/lib/utils";

export function BudgetLimiter() {
  const { budget, setBudget, cartTotal } = useStore();
  const [open, setOpen]   = useState(false);
  const [input, setInput] = useState("");

  if (budget === null) {
    return (
      <button
        onClick={() => { setInput(""); setOpen(true); }}
        className="mx-4 mb-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-dashed border-orange-200 bg-orange-50/50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-50 transition"
      >
        <Wallet className="h-4 w-4" />
        <span className="font-medium">Set a budget limit</span>
        <span className="text-orange-400">
          — get notified when you're close
        </span>
      </button>
    );
  }

  const pct    = Math.min((cartTotal / budget) * 100, 100);
  const isOver = cartTotal > budget;
  const isNear = !isOver && pct >= 80;

  return (
    <>
      <div
        className={cn(
          "mx-4 mb-4 flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
          isOver ? "border-red-200 bg-red-50/50" : "border-orange-100"
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
            isOver ? "bg-red-100" : "bg-orange-50"
          )}
        >
          <Wallet
            className={cn(
              "h-4 w-4",
              isOver ? "text-red-500" : "text-orange-500"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
              Budget Limiter
            </p>
            {isOver && (
              <span className="text-[10px] font-semibold text-red-500 animate-pulse">
                ⚠ Limit exceeded!
              </span>
            )}
            {isNear && !isOver && (
              <span className="text-[10px] font-semibold text-amber-500">
                Almost at limit
              </span>
            )}
          </div>

          <Progress
            value={pct}
            className={cn(
              "mb-1.5 h-1.5",
              isOver
                ? "[&>div]:bg-red-500"
                : isNear
                ? "[&>div]:bg-amber-400"
                : "[&>div]:bg-green-500"
            )}
          />

          <p className="text-xs text-gray-500">
            Spent{" "}
            <span className="font-semibold text-gray-800">
              {formatPrice(cartTotal)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {formatPrice(budget)}
            </span>
            <span className="ml-1 text-gray-400">
              — {Math.round(pct)}% used
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => { setInput(String(budget)); setOpen(true); }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Edit budget"
          >
            <PencilLine className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setBudget(null)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
            aria-label="Remove budget"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Your Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="budget-input" className="text-sm text-gray-600">
                Maximum spend limit (₹)
              </Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₹
                </span>
                <Input
                  id="budget-input"
                  type="number"
                  min={1}
                  placeholder="e.g. 5000"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="pl-7"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                You'll get a warning when your cart exceeds this amount.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-600"
              onClick={() => { setBudget(null); setOpen(false); }}
            >
              Remove limit
            </Button>
            <Button
              onClick={() => {
                const val = parseInt(input);
                if (val > 0) { setBudget(val); setOpen(false); }
              }}
              className="bg-[#D4380D] text-white hover:bg-[#b82e08]"
            >
              Save Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}