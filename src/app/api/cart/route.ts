import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, fail, cartAddSchema } from "@/lib/validations";
import { cacheCart, cartKeys, getCachedCart, invalidateCart } from "@/lib/redis";

// GET /api/cart — current user (or guest via x-guest-id header)
export async function GET(req: Request) {
  const session = await auth();
  const guestId = req.headers.get("x-guest-id");
  const key = session?.user?.id ? cartKeys.byUser(session.user.id) : guestId ? cartKeys.byGuest(guestId) : null;
  if (!key) return ok({ items: [] });

  const cached = await getCachedCart(key).catch(() => null);
  if (cached) return ok(cached);

  const cart = await db.cart.findFirst({
    where: session?.user?.id ? { userId: session.user.id } : undefined,
    include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
    orderBy: { updatedAt: "desc" },
  });
  const payload = cart ?? { items: [] };
  await cacheCart(key, payload).catch(() => {});
  return ok(payload);
}

// POST /api/cart { productId, quantity }
export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = cartAddSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.isActive) return fail("Product unavailable", 404);
  if (product.stock < parsed.data.quantity) return fail("Insufficient stock", 409);

  const userId = session?.user?.id ?? null;
  let cart = await db.cart.findFirst({ where: userId ? { userId } : { userId: null }, orderBy: { updatedAt: "desc" } });
  if (!cart) cart = await db.cart.create({ data: { userId } });

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    update: { quantity: { increment: parsed.data.quantity } },
    create: { cartId: cart.id, productId: product.id, quantity: parsed.data.quantity },
  });

  if (userId) await invalidateCart(cartKeys.byUser(userId)).catch(() => {});
  return ok({ added: true }, 201);
}

// DELETE /api/cart — clear cart
export async function DELETE(req: Request) {
  const session = await auth();
  const guestId = req.headers.get("x-guest-id");
  const userId = session?.user?.id;
  if (userId) {
    await db.cart.deleteMany({ where: { userId } });
    await invalidateCart(cartKeys.byUser(userId)).catch(() => {});
  } else if (guestId) {
    await invalidateCart(cartKeys.byGuest(guestId)).catch(() => {});
  }
  return ok({ cleared: true });
}
