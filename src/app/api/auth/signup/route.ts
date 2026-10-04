import { db } from "@/lib/db";
import { ok, fail, signupSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return fail("Email already registered", 409);

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await db.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash } });
  return ok({ id: user.id, email: user.email }, 201);
}
