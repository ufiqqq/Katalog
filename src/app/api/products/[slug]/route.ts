import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const product = await db.product.findUnique({
      where: {
        slug,
      },
      include: {
        images: true,
        variants: true,
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Sort variants by size (S, M, L, XL)
    const sizeOrder = ["S", "M", "L", "XL"];
    product.variants.sort((a, b) => {
      return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Get product detail error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
