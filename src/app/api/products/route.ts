import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { auth } from "@/lib/auth";
import { ok, fail, paginationSchema, productCreateSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

// GET /api/products?page&limit&q&category&sort — cached 60s in Redis
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid query", 422, parsed.error.flatten());
  const { page, limit, q, category, sort } = parsed.data;

  const cacheKey = `products:${page}:${limit}:${q ?? ""}:${category ?? ""}:${sort}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return ok(JSON.parse(cached));

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];
  if (category) where.category = { slug: category };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { images: { orderBy: { position: "asc" } }, category: true },
    }),
    db.product.count({ where }),
  ]);

  const payload = { items, total, page, pages: Math.ceil(total / limit) };
  await redis.set(cacheKey, JSON.stringify(payload), "EX", 60).catch(() => {});
  return ok(payload);
}

// POST /api/products — ADMIN only
export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return fail("Forbidden", 403);
  const body = await req.json().catch(() => null);
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const { images, slug, ...data } = parsed.data;
  const finalSlug = slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const product = await db.product.create({
    data: {
      ...data,
      slug: finalSlug,
      images: { create: images.map((img, i) => ({ ...img, position: i })) },
    },
    include: { images: true },
  });
  await redis.keys("products:*").then((keys) => keys.length && redis.del(keys)).catch(() => {});
  return ok(product, 201);
}
