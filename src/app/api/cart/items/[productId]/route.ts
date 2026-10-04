import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, fail, cartUpdateSchema } from "@/lib/validations";
import { cartKeys, invalidateCart } from "@/lib/redis";

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const { productId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = cartUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const cart = await db.cart.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
  if (!cart) return fail("Cart not found", 404);

  if (parsed.data.quantity === 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    await db.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity: parsed.data.quantity },
    });
  }
  await invalidateCart(cartKeys.byUser(session.user.id)).catch(() => {});
  return ok({ updated: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const { productId } = await params;
  const cart = await db.cart.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  await invalidateCart(cartKeys.byUser(session.user.id)).catch(() => {});
  return ok({ removed: true });
}
