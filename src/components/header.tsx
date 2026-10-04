import Link from "next/link";
import { useCart } from "@/store/cart";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">UrbanShop</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/account">Account</Link>
          <Link href="/admin" className="rounded bg-zinc-900 px-3 py-1.5 text-white">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-zinc-500">
        © {new Date().getFullYear()} UrbanShop — TypeScript · Next.js · Prisma · Redis · Stripe
      </div>
    </footer>
  );
}
