import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartLine = { productId: string; quantity: number };

type CartState = {
  lines: CartLine[];
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (productId, qty = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.productId === productId);
          if (found) return { lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + qty } : l)) };
          return { lines: [...s.lines, { productId, quantity: qty }] };
        }),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({ lines: qty <= 0 ? s.lines.filter((l) => l.productId !== productId) : s.lines.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)) })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((n, l) => n + l.quantity, 0),
    }),
    { name: "urbanshop-cart" },
  ),
);
