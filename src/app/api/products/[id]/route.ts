import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { auth } from "@/lib/auth";
import { ok, fail, productUpdateSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cacheKey = `product:${id}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return ok(JSON.parse(cached));

  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { images: { orderBy: { position: "asc" } }, category: true, reviews: { take: 10, orderBy: { createdAt: "desc" } } },
  });
  if (!product) return fail("Not found", 404);
  await redis.set(cacheKey, JSON.stringify(product), "EX", 120).catch(() => {});
  return ok(product);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return fail("Forbidden", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());
  const { images, ...data } = parsed.data;
  const product = await db.product.update({
    where: { id },
    data: images ? { ...data, images: { deleteMany: {}, create: images.map((img, i) => ({ ...img, position: i })) } } : data,
    include: { images: true },
  });
  await redis.del([`product:${id}`, `product:${product.slug}`]).catch(() => {});
  return ok(product);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return fail("Forbidden", 403);
  const { id } = await params;
  await db.product.update({ where: { id }, data: { isActive: false } });
  await redis.del(`product:${id}`).catch(() => {});
  return ok({ deleted: true });
}
