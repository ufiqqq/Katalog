import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (category) {
      whereClause.category = category;
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        images: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Sort variants by size (S, M, L, XL)
    const sizeOrder = ["S", "M", "L", "XL"];
    const sortedProducts = products.map((product) => {
      const sortedVariants = [...product.variants].sort((a, b) => {
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
      });
      return {
        ...product,
        variants: sortedVariants,
      };
    });

    return NextResponse.json(sortedProducts);
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
