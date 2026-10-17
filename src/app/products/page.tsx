import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  let products: Array<{ id: string; slug: string; name: string; price: number; images: { url: string; alt?: string | null }[] }> = [];
  try {
    products = await db.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { images: { take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
  } catch {
    // DB unavailable during build — render empty state
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products {category ? `— ${category}` : ""}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p as never} />)}
      </div>
      {products.length === 0 && <p className="text-zinc-500">No products found.</p>}
    </div>
  );
}
