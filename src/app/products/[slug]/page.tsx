import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, include: { images: true, category: true } });
  if (!product) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {product.images.map((img) => <img key={img.id} src={img.url} alt={img.alt ?? product.name} className="w-full rounded-xl border object-cover" />)}
      </div>
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">{product.category?.name}</p>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-2xl">{formatPrice(product.price)}</p>
        <p className="text-zinc-600">{product.description}</p>
        <p className="text-sm text-zinc-500">Stock: {product.stock} · SKU: {product.sku ?? "—"}</p>
        <AddToCartButton productId={product.id} />
      </div>
    </div>
  );
}
