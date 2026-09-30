import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const wishlistItems = await db.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: true,
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Check if already in wishlist
    const existingItem = await db.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(existingItem, { status: 200 });
    }

    const newItem = await db.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    await db.wishlistItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return NextResponse.json({ message: "Product removed from wishlist" }, { status: 200 });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
