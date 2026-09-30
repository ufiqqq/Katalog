import React from "react";
import { db } from "@/lib/db";
import ShopClient from "@/components/ShopClient";

export default async function ShopPage() {
  // Fetch active products with images and variants
  const products = await db.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      images: true,
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <ShopClient initialProducts={products} />;
}
