import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.orderId;
        if (orderId) {
          await db.$transaction([
            db.order.update({ where: { id: orderId }, data: { status: "PAID", stripePaymentId: (s.payment_intent as string) ?? null } }),
            db.payment.create({ data: { orderId, amount: s.amount_total ?? 0, currency: s.currency ?? "usd", status: "SUCCEEDED", receiptUrl: null } }),
          ]);
          // Decrement stock
          const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
          if (order) {
            for (const item of order.items) {
              await db.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
            }
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const order = await db.order.findFirst({ where: { stripePaymentId: pi.id } });
        if (order) await db.payment.updateMany({ where: { orderId: order.id }, data: { status: "FAILED" } });
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook]", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
