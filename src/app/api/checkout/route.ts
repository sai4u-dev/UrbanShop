import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { ok, fail, checkoutSchema } from "@/lib/validations";

const TAX_RATE = 0.08;
const FLAT_SHIPPING = 599; // cents

// POST /api/checkout — creates Order + Stripe Checkout Session
export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const { email, address, items } = parsed.data;
  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) } }, include: { images: { take: 1 } } });
  if (products.length !== items.length) return fail("One or more products not found", 404);

  const qtyById = new Map(items.map((i) => [i.productId, i.quantity]));
  for (const p of products) {
    if (!p.isActive || p.stock < (qtyById.get(p.id) ?? 0)) return fail(`Insufficient stock: ${p.name}`, 409);
  }

  const subtotal = products.reduce((s, p) => s + p.price * (qtyById.get(p.id) ?? 0), 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax + FLAT_SHIPPING;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const shippingAddress = await db.address.create({ data: { ...address, userId: session?.user?.id ?? null } });

  const order = await db.order.create({
    data: {
      userId: session?.user?.id ?? null,
      email,
      subtotal,
      shipping: FLAT_SHIPPING,
      tax,
      total,
      shippingAddressId: shippingAddress.id,
      items: {
        create: products.map((p) => ({
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: qtyById.get(p.id) ?? 1,
          image: p.images[0]?.url,
        })),
      },
    },
  });

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    metadata: { orderId: order.id },
    line_items: products.map((p) => ({
      price_data: {
        currency: "usd",
        product_data: { name: p.name, images: p.images[0]?.url ? [p.images[0].url] : [] },
        unit_amount: p.price,
      },
      quantity: qtyById.get(p.id) ?? 1,
    })),
    shipping_options: [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: FLAT_SHIPPING, currency: "usd" }, display_name: "Standard" } }],
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel?order=${order.id}`,
  });

  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: stripeSession.id } });
  return ok({ orderId: order.id, url: stripeSession.url }, 201);
}
