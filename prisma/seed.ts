import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding UrbanShop...");

  // Categories
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets, audio and accessories",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800",
    },
  });

  const apparel = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: {
      name: "Apparel",
      slug: "apparel",
      description: "Streetwear essentials",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    },
  });

  // Demo admin
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@urbanshop.dev" },
    update: {},
    create: {
      name: "Store Admin",
      email: "admin@urbanshop.dev",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Products
  const products = [
    {
      name: "Nova Wireless Headphones",
      slug: "nova-wireless-headphones",
      description: "Studio-grade sound with 40h battery life and ANC.",
      price: 19999,
      compareAt: 24999,
      sku: "NS-HP-001",
      stock: 48,
      isFeatured: true,
      categoryId: electronics.id,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
    },
    {
      name: "Urban Oversized Tee",
      slug: "urban-oversized-tee",
      description: "Heavyweight 240gsm cotton oversized tee.",
      price: 2999,
      sku: "UR-TEE-001",
      stock: 200,
      isFeatured: true,
      categoryId: apparel.id,
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
    },
    {
      name: "Minimal Chrono Watch",
      slug: "minimal-chrono-watch",
      description: "Sapphire glass, 5ATM, Italian leather strap.",
      price: 14999,
      sku: "UR-WT-001",
      stock: 25,
      isFeatured: false,
      categoryId: electronics.id,
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
    },
  ];

  for (const p of products) {
    const { images, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
    for (const [i, url] of images.entries()) {
      await prisma.productImage.upsert({
        where: { id: `${product.id}-${i}` },
        update: {},
        create: { id: `${product.id}-${i}`, url, alt: data.name, position: i, productId: product.id },
      });
    }
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
