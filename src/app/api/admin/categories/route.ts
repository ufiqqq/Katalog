import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/admin/categories: Delete a category (resets all products of this category to "Uncategorized")
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    // Standard categories cannot be deleted
    const standardCategories = ["T-Shirt", "Outerwear", "Accessories", "Uncategorized"];
    if (standardCategories.includes(name)) {
      return NextResponse.json(
        { error: "Kategori utama bawaan tidak boleh dihapus." },
        { status: 400 }
      );
    }

    // Update all products with this category to "Uncategorized"
    await db.product.updateMany({
      where: { category: name },
      data: { category: "Uncategorized" },
    });

    return NextResponse.json({
      message: `Kategori "${name}" berhasil dihapus. Produk terkait otomatis dipindahkan ke kategori "Uncategorized".`,
    });
  } catch (error) {
    console.error("Admin delete category error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
