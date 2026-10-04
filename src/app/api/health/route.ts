import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET() {
  const checks: Record<string, string> = {};
  try { await db.$queryRaw`SELECT 1`; checks.db = "ok"; } catch { checks.db = "fail"; }
  try { checks.redis = (await redis.ping()) === "PONG" ? "ok" : "fail"; } catch { checks.redis = "fail"; }
  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status: healthy ? 200 : 503 });
}
