import { z } from "zod";
import { NextResponse } from "next/server";

// ─── Shared helpers ───
export function ok<T>(data: T, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : init?.status ?? 200;
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function parseOrFail<T>(schema: z.ZodType<T>, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw Response.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  return parsed.data;
}

// ─── Domain schemas ───
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10),
  price: z.number().int().min(1, "price in cents"),
  compareAt: z.number().int().min(1).optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).default([]),
});

export const productUpdateSchema = productCreateSchema.partial();

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const addressSchema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().min(3),
  country: z.string().default("US"),
  phone: z.string().optional(),
});

export const checkoutSchema = z.object({
  email: z.string().email(),
  address: addressSchema,
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
});

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
