import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

// Helper to save base64 image locally to public/uploads/
function saveBase64Image(base64Str: string, slug: string): string {
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    return base64Str; // Return as-is if already a URL or empty
  }

  try {
    const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const data = Buffer.from(matches[2], "base64");
    
    const filename = `${slug}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, data);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error("Failed to save image file:", error);
    return "/images/placeholder.jpg";
  }
}

// GET /api/admin/products: List all products for admin (including inactive)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await db.product.findMany({
      include: {
        images: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Admin list products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products: Create new product with variants and images
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, slug, description, price, originalPrice, category, images, variants } = await req.json();

    if (!name || !slug || !price || !category || !variants || variants.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check slug duplication
    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product slug already exists" },
        { status: 400 }
      );
    }

    // Process image uploads if base64
    const processedImages = images && images.length > 0
      ? images.map((img: string) => saveBase64Image(img, slug))
      : [];

    const newProduct = await db.product.create({
      data: {
        name,
        slug,
        description,
        price: parseInt(price),
        originalPrice: originalPrice ? parseInt(originalPrice) : null,
        category,
        isActive: true,
        images: {
          create: processedImages.length > 0
            ? processedImages.map((url: string, index: number) => ({
                url,
                isPrimary: index === 0,
              }))
            : [{ url: "/images/placeholder.jpg", isPrimary: true }],
        },
        variants: {
          create: variants.map((v: { size: string; stock: number; sku?: string }) => ({
            size: v.size,
            stock: Number(v.stock) || 0,
            sku: v.sku || `${slug}-${v.size.toLowerCase()}`,
          })),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Admin create product error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products: Update product details and variant stocks
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, description, price, originalPrice, category, isActive, images, imageUrl, variants } = await req.json();

    if (!id || !name || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Update basic product info
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          price: parseInt(price),
          originalPrice: originalPrice ? parseInt(originalPrice) : null,
          category,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      // Update images if images list is provided (supports multiple image uploads)
      if (images && Array.isArray(images)) {
        const processedImages = images.map((img: string) => saveBase64Image(img, updatedProduct.slug));
        
        // Delete all old images and write new ones
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        if (processedImages.length > 0) {
          await tx.productImage.createMany({
            data: processedImages.map((url: string, index: number) => ({
              productId: id,
              url,
              isPrimary: index === 0,
            })),
          });
        }
      } else if (imageUrl) {
        const processedImageUrl = saveBase64Image(imageUrl, updatedProduct.slug);
        
        const existingImage = await tx.productImage.findFirst({
          where: { productId: id, isPrimary: true },
        });

        if (existingImage) {
          await tx.productImage.update({
            where: { id: existingImage.id },
            data: { url: processedImageUrl },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId: id,
              url: processedImageUrl,
              isPrimary: true,
            },
          });
        }
      }

      // 2. Update/upsert variant stock levels
      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          const sku = v.sku || `${updatedProduct.slug}-${v.size.toLowerCase()}`;
          await tx.productVariant.upsert({
            where: { sku },
            update: {
              stock: Number(v.stock) || 0,
            },
            create: {
              productId: id,
              size: v.size,
              stock: Number(v.stock) || 0,
              sku,
            },
          });
        }
      }

      return updatedProduct;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin update product error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products: Delete product (hard delete if no orders, soft delete if ordered)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Find product with variants and check if there are order items referencing these variants
    const product = await db.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const hasOrders = product.variants.some((v) => v.orderItems.length > 0);

    if (hasOrders) {
      return NextResponse.json(
        { error: "Produk tidak bisa dihapus karena sudah memiliki transaksi pembelian. Silakan nonaktifkan produk ini secara manual jika ingin menyembunyikannya." },
        { status: 400 }
      );
    } else {
      // Hard delete: Delete images, variants, and product
      await db.$transaction([
        db.productImage.deleteMany({ where: { productId: id } }),
        db.productVariant.deleteMany({ where: { productId: id } }),
        db.product.delete({ where: { id } }),
      ]);
      return NextResponse.json({
        message: "Produk berhasil dihapus permanen.",
        type: "hard",
      });
    }
  } catch (error) {
    console.error("Admin delete product error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
