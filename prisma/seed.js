const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean up existing data
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.address.deleteMany({});
  await db.productVariant.deleteMany({});
  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  await db.user.deleteMany({});

  console.log("Cleared existing data.");

  // 2. Seed Users
  const adminPassword = await bcrypt.hash("adminpassword", 10);
  const customerPassword = await bcrypt.hash("customerpassword", 10);

  const admin = await db.user.create({
    data: {
      name: "Admin Streetwear",
      email: "admin@streetwear.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const customer = await db.user.create({
    data: {
      name: "John Customer",
      email: "customer@streetwear.com",
      password: customerPassword,
      role: "CUSTOMER",
    },
  });

  console.log("Created Users:", { admin: admin.email, customer: customer.email });

  // 3. Seed Products
  const product1 = await db.product.create({
    data: {
      name: "OOs Logo Tee",
      slug: "oos-logo-tee",
      description: "T-Shirt streetwear premium dengan sablon logo khas OOs di dada. Bahan cotton combed 24s berkualitas tinggi, tebal, nyaman, dan adem dipakai untuk aktivitas harian.",
      price: 185000,
      category: "Tees",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop", isPrimary: true },
          { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop", isPrimary: false },
        ],
      },
      variants: {
        create: [
          { size: "S", stock: 5, sku: "oos-logo-tee-s" },
          { size: "M", stock: 10, sku: "oos-logo-tee-m" },
          { size: "L", stock: 0, sku: "oos-logo-tee-l" }, // Out of stock to test disabled
          { size: "XL", stock: 8, sku: "oos-logo-tee-xl" },
        ],
      },
    },
  });

  const product2 = await db.product.create({
    data: {
      name: "Streetwear Oversized Hoodie",
      slug: "streetwear-oversized-hoodie",
      description: "Hoodie oversized dengan bahan fleece premium 330gsm. Sangat tebal, lembut di bagian dalam, dan memberikan potongan streetwear siluet yang kuat. Dilengkapi tudung tali serut ganda.",
      price: 399000,
      category: "Outerwear",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop", isPrimary: true },
          { url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop", isPrimary: false },
        ],
      },
      variants: {
        create: [
          { size: "S", stock: 3, sku: "streetwear-oversized-hoodie-s" },
          { size: "M", stock: 7, sku: "streetwear-oversized-hoodie-m" },
          { size: "L", stock: 15, sku: "streetwear-oversized-hoodie-l" },
          { size: "XL", stock: 4, sku: "streetwear-oversized-hoodie-xl" },
        ],
      },
    },
  });

  const product3 = await db.product.create({
    data: {
      name: "OOs Cargo Pants",
      slug: "oos-cargo-pants",
      description: "Celana cargo taktis multi-kantong dengan potongan santai (relaxed fit) untuk gaya urban utiliti. Terbuat dari material ripstop berkualitas tinggi yang tahan lama.",
      price: 450000,
      category: "Pants",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=800&auto=format&fit=crop", isPrimary: true },
        ],
      },
      variants: {
        create: [
          { size: "S", stock: 12, sku: "oos-cargo-pants-s" },
          { size: "M", stock: 4, sku: "oos-cargo-pants-m" },
          { size: "L", stock: 6, sku: "oos-cargo-pants-l" },
          { size: "XL", stock: 0, sku: "oos-cargo-pants-xl" },
        ],
      },
    },
  });

  console.log("Created Products:", [product1.slug, product2.slug, product3.slug]);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
