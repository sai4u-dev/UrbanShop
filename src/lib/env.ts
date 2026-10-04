import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AUTH_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  AWS_S3_BUCKET_NAME: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

// Validates at boot in non-test envs; logs instead of crashing in dev for smoother onboarding.
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success && process.env.NODE_ENV === "production") {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed;
}
