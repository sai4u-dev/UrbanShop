"use client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Props = {
  product: { id: string; slug: string; name: string; price: number; images: { url: string; alt?: string | null }[] };
};

export function ProductCard({ product }: Props) {
  const img = product.images[0]?.url ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800";
  return (
    <Link href={`/products/${product.slug}`} className="overflow-hidden rounded-xl border bg-white hover:shadow">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={product.name} className="aspect-square w-full object-cover" loading="lazy" />
      <div className="p-3">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-sm text-zinc-600">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
