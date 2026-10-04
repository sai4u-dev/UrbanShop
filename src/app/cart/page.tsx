"use client";
import { useCart } from "@/store/cart";
import Link from "next/link";

export default function CartPage() {
  const { lines, setQty, remove, clear, count } = useCart();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cart ({count()})</h1>
      {lines.length === 0 ? (
        <p>No items yet. <Link href="/products" className="underline">Continue shopping</Link></p>
      ) : (
        <>
          <ul className="divide-y rounded-xl border bg-white">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center justify-between p-4">
                <span className="font-mono text-sm">{l.productId}</span>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value))} className="w-16 rounded border px-2 py-1" />
                  <button onClick={() => remove(l.productId)} className="text-sm text-red-600">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button onClick={clear} className="rounded border px-4 py-2">Clear</button>
            <Link href="/checkout" className="rounded bg-zinc-900 px-4 py-2 text-white">Checkout</Link>
          </div>
        </>
      )}
    </div>
  );
}
