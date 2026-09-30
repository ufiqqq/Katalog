import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import WishlistClient from "@/components/WishlistClient";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth");
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

  // Format database types safely to pass to client component
  const formattedItems = wishlistItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      description: item.product.description,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      category: item.product.category,
      images: item.product.images.map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary,
      })),
      variants: item.product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        stock: v.stock,
        sku: v.sku,
      })),
    },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col justify-start">
      {/* Title Header */}
      <div className="border-b border-neutral-100 pb-6 mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
          Koleksi Pilihan Anda
        </p>
        <h1 className="text-2xl font-extrabold uppercase tracking-wider text-black">
          My Wishlist
        </h1>
      </div>

      {/* Wishlist Items List Client Component */}
      <WishlistClient initialItems={formattedItems} />
    </div>
  );
}
