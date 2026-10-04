import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const { id } = await params;
  const role = (session.user as { role?: string }).role;

  const order = await db.order.findUnique({ where: { id }, include: { items: true, payment: true, shippingAddress: true } });
  if (!order) return fail("Not found", 404);
  if (role !== "ADMIN" && order.userId !== session.user.id) return fail("Forbidden", 403);
  return ok(order);
}
