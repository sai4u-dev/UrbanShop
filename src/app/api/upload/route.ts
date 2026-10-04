import { auth } from "@/lib/auth";
import { createUploadPresignedUrl } from "@/lib/s3";
import { ok, fail } from "@/lib/validations";
import { z } from "zod";

const schema = z.object({ filename: z.string().min(1), contentType: z.string().min(1) });

// POST /api/upload — returns S3 presigned POST (ADMIN only)
export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return fail("Forbidden", 403);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());
  try {
    const result = await createUploadPresignedUrl({ key: parsed.data.filename, contentType: parsed.data.contentType, userId: session!.user!.id });
    return ok(result, 201);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
}
