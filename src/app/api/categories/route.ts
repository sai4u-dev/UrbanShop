import { db } from "@/lib/db";
import { ok, fail } from "@/lib/validations";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return ok(categories);
}
