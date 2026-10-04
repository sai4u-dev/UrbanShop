import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    db.product.findMany({ where: { isActive: true, isFeatured: true }, take: 8, include: { images: { take: 1 } }, orderBy: { createdAt: "desc" } }),
    db.category.findMany({ take: 6, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-zinc-900 p-10 text-white">
        <h1 className="text-4xl font-bold">UrbanShop — essentials, engineered.</h1>
        <p className="mt-2 text-zinc-300">Next.js + Prisma + Stripe + Redis + S3 reference store.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/products" className="rounded-lg bg-white px-4 py-2 font-medium text-zinc-900">Shop all</Link>
          <Link href="/cart" className="rounded-lg border border-zinc-700 px-4 py-2">View cart</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="rounded-full border px-4 py-1.5 text-sm hover:bg-zinc-900 hover:text-white">{c.name}</Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Featured</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p as never} />)}
        </div>
      </section>
    </div>
  );
}
