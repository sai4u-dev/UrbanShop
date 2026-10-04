import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");
  const orders = await db.order.findMany({ where: { userId: session.user.id }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hi, {session.user.name ?? session.user.email}</h1>
      <h2 className="font-semibold">Orders</h2>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded border bg-white p-4 text-sm">
            <span className="font-mono">{o.orderNumber.slice(0, 8)}</span> · {o.status} · {formatPrice(o.total)} · {o.items.length} items
          </li>
        ))}
      </ul>
      {orders.length === 0 && <p className="text-zinc-500">No orders yet.</p>}
    </div>
  );
}
