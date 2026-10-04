import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/");
  const [orders, products, users] = await Promise.all([
    db.order.count(),
    db.product.count(),
    db.user.count(),
  ]);
  const recent = await db.order.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { items: true } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-3 gap-4">
        {[["Orders", orders], ["Products", products], ["Users", users]].map(([label, n]) => (
          <div key={label as string} className="rounded-xl border bg-white p-4"><p className="text-sm text-zinc-500">{label}</p><p className="text-2xl font-bold">{n as number}</p></div>
        ))}
      </div>
      <h2 className="font-semibold">Recent orders</h2>
      <ul className="space-y-2">
        {recent.map((o) => <li key={o.id} className="rounded border bg-white p-3 text-sm">{o.email} · {o.status} · {formatPrice(o.total)}</li>)}
      </ul>
    </div>
  );
}
