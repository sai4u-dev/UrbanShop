"use client";
import { useState } from "react";
import { useCart } from "@/store/cart";

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          address: { fullName: "Demo User", line1: "123 Main St", city: "New York", postalCode: "10001", country: "US" },
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        clear();
        window.location.href = json.data.url;
      } else alert(json.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Checkout ({lines.length} lines)</h1>
      <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-3 py-2" />
      <button disabled={loading || lines.length === 0} className="w-full rounded bg-zinc-900 py-2.5 text-white disabled:opacity-50">
        {loading ? "Redirecting to Stripe…" : "Pay with Stripe"}
      </button>
    </form>
  );
}
