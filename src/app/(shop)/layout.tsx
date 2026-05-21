"use client";

import { Navbar } from "@/components/layout/Navbar";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <Navbar />
      <main className="mx-auto max-w-6xl">{children}</main>
    </div>
  );
}