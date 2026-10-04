import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/validations";

// GET /api/orders — own orders (ADMIN sees all via ?all=1)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const role = (session.user as { role?: string }).role;
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1" && role === "ADMIN";

  const orders = await db.order.findMany({
    where: all ? {} : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true, payment: true },
  });
  return ok(orders);
}
