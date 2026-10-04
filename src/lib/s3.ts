import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME ?? "urbanshop-uploads";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function createUploadPresignedUrl(params: {
  key: string;
  contentType: string;
  userId: string;
}) {
  const { key, contentType, userId } = params;
  if (!ALLOWED_TYPES.includes(contentType)) throw new Error("Unsupported file type");
  const safeKey = `products/${userId}/${Date.now()}-${key.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;

  // NOTE: direct browser upload via presigned POST (5MB image-only guard)
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: S3_BUCKET,
    Key: safeKey,
    Conditions: [
      ["content-length-range", 0, MAX_SIZE],
      ["starts-with", "$Content-Type", "image/"],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 600,
  });

  return { url, fields, key: safeKey, publicUrl: `https://${S3_BUCKET}.s3.amazonaws.com/${safeKey}` };
}

export async function deleteS3Object(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}
