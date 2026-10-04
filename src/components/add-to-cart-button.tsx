"use client";
import { useState } from "react";
import { useCart } from "@/store/cart";

export function AddToCartButton({ productId }: { productId: string }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);

  async function handle() {
    add(productId, 1);
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    }).catch(() => {});
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  }

  return (
    <button onClick={handle} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700">
      {done ? "Added ✓" : "Add to cart"}
    </button>
  );
}
